import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { reportError } from '@/lib/firebase';
import { useSession } from '@/store/session';

// TODO(you): set EXPO_PUBLIC_REVENUECAT_ANDROID_KEY (and the entitlement id) in .env / EAS env.
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const ENTITLEMENT = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || 'pro';
export const PRODUCT_ID = 'yearly_199';

export const purchasesEnabled = Platform.OS === 'android' && API_KEY.length > 0;

// configure() may only run once per process; later user switches go through logIn/logOut.
let configured = false;
let currentUser: string | null = null;

function apply(info: CustomerInfo) {
  useSession.getState().setStoreEntitled(info.entitlements.active[ENTITLEMENT] !== undefined);
}

/** Configure RevenueCat for the signed-in tutor (Firebase uid = RevenueCat app user id). */
export async function initPurchases(uid: string): Promise<() => void> {
  if (!purchasesEnabled) return () => {};
  try {
    if (!configured) {
      Purchases.configure({ apiKey: API_KEY, appUserID: uid });
      configured = true;
    } else if (currentUser !== uid) {
      await Purchases.logIn(uid);
    }
    currentUser = uid;
    Purchases.addCustomerInfoUpdateListener(apply);
    apply(await Purchases.getCustomerInfo());
  } catch (e) {
    reportError(e, 'initPurchases');
  }
  return () => {
    Purchases.removeCustomerInfoUpdateListener(apply);
  };
}

async function findYearlyPackage(): Promise<PurchasesPackage | undefined> {
  const offerings = await Purchases.getOfferings();
  const all = [
    ...(offerings.current?.availablePackages ?? []),
    ...Object.values(offerings.all).flatMap((o) => o.availablePackages),
  ];
  // Play subscription ids come back as `productId:basePlanId`.
  return all.find((p) => p.product.identifier.split(':')[0] === PRODUCT_ID);
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable' | 'failed';

export async function subscribeYearly(): Promise<PurchaseResult> {
  if (!purchasesEnabled) return 'unavailable';
  try {
    const pkg = await findYearlyPackage();
    if (!pkg) return 'unavailable';
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    apply(customerInfo);
    return 'purchased';
  } catch (e) {
    const code = typeof e === 'object' && e && 'code' in e ? e.code : undefined;
    if (code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    reportError(e, 'subscribeYearly');
    return 'failed';
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!purchasesEnabled) return false;
  try {
    const info = await Purchases.restorePurchases();
    apply(info);
    return info.entitlements.active[ENTITLEMENT] !== undefined;
  } catch (e) {
    reportError(e, 'restorePurchases');
    return false;
  }
}

export async function logOutPurchases(): Promise<void> {
  if (!purchasesEnabled || !configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Anonymous users can't log out — harmless.
  }
  currentUser = null;
  useSession.getState().setStoreEntitled(false);
}
