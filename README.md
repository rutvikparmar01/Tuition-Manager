# Tuition Manager

Android app for home tutors: track students, attendance and monthly fees, and send fee reminders on WhatsApp.

**Stack:** Expo SDK 58 · React Native 0.88 · TypeScript (strict) · Expo Router · React Native Firebase (Auth, Firestore, Crashlytics) · RevenueCat · react-hook-form + zod · zustand · dayjs.

The app uses native Firebase modules, so it runs in an **Expo development build**, not Expo Go.

---

## 1. One-time setup

### Things you need

- Node 22+, npm
- An [Expo](https://expo.dev) account (`npx eas-cli@latest login`)
- A Firebase project
- (For subscriptions) a Google Play Console app and a RevenueCat project
- (For the local emulators only) Java **21+** — `firebase-tools` refuses older JDKs

```bash
npm install
cp .env.example .env      # then fill it in (see §4)
```

### TODOs before the first build

| Where                          | What                                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.json` → `android.package` | Replace `com.TODO.tuitionmanager` with your real id (e.g. `com.yourname.tuitionmanager`). It must match the Firebase Android app and Play Console. Changing it later means a new Play listing. |
| `google-services.json`         | Download from Firebase (below) and put it next to `app.json`. See `GOOGLE_SERVICES_SETUP.md`.                                                                                                  |
| `.env`                         | RevenueCat key, entitlement id, support WhatsApp number, privacy-policy URL.                                                                                                                   |
| `.firebaserc`                  | Replace `demo-tuition-manager` with your Firebase project id before deploying rules.                                                                                                           |

---

## 2. Firebase console

1. **Create a project** at <https://console.firebase.google.com>. Google Analytics is optional.
2. **Add an Android app** (Project settings → Your apps → Android):
   - Package name = `android.package` from `app.json`.
   - Add the **SHA-1 and SHA-256** fingerprints (see §3). Phone auth will not work without them.
   - Download **`google-services.json`** into the project root.
3. **Authentication** → Sign-in method → enable **Phone**.
   - Optional: under _Phone numbers for testing_, add e.g. `+91 98765 43210` / `123456` so you can log in without real SMS.
   - Phone auth on Android uses Play Integrity. Make sure the app's SHA-256 is registered, and test on a device with Google Play services.
4. **Firestore Database** → Create database → production mode → region `asia-south1` (Mumbai) is closest for Indian users.
5. **Deploy the security rules** in `firestore.rules`:
   ```bash
   npx firebase-tools login
   npx firebase-tools use <your-project-id>
   npx firebase-tools deploy --only firestore:rules
   ```
6. **Crashlytics** → click _Enable_. Crashes appear after the first launch of a release/dev build.

No composite indexes are needed: every query uses equality filters only.

## 3. SHA fingerprints

Firebase needs the fingerprint of **every key that signs a build you run**:

| Build                                           | Where to get SHA-1 / SHA-256                                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EAS builds (development / preview / production) | `npx eas-cli@latest credentials -p android` → pick the profile → _Keystore_ shows both hashes. EAS creates the keystore on your first build.                         |
| Google Play (after upload)                      | Play Console → your app → _Test and release_ → _App integrity_ → **App signing key certificate**. Play re-signs the app, so this one is required for store installs. |
| Local `npx expo run:android`                    | `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`                                                   |

After adding new fingerprints, download `google-services.json` again.

---

## 4. Environment variables

`.env` (copy from `.env.example`). `EXPO_PUBLIC_*` values are bundled into the app, so they are not secret:

| Variable                             | Purpose                                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat → Project → API keys → Google Play public SDK key. Empty = the Subscribe button says "Not available yet". |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` | Entitlement id unlocked by `yearly_199` (default `pro`).                                                             |
| `EXPO_PUBLIC_USE_FIREBASE_EMULATOR`  | `true` points a dev build at the local emulators.                                                                    |
| `EXPO_PUBLIC_EMULATOR_HOST`          | `10.0.2.2` for the Android emulator, your computer's LAN IP for a real phone.                                        |
| `EXPO_PUBLIC_SUPPORT_WHATSAPP`       | 10-digit number for _Help on WhatsApp_.                                                                              |
| `EXPO_PUBLIC_PRIVACY_URL`            | Privacy policy link. Google Play requires one.                                                                       |

For EAS cloud builds, set the same values with `npx eas-cli@latest env:create` (or on expo.dev → Project → Environment variables), since `.env` is git-ignored.

---

## 5. Build and run

```bash
# 1. Build a development client once (and again whenever native deps or app.json plugins change)
npx eas-cli@latest build --profile development --platform android
#    → install the APK from the link on your phone or emulator

# 2. Start the JS dev server and open the app
npm start            # = expo start --dev-client
```

Other profiles (`eas.json`):

| Profile       | Output              | Use                                                     |
| ------------- | ------------------- | ------------------------------------------------------- |
| `development` | APK with dev client | daily development                                       |
| `preview`     | APK                 | share a test build                                      |
| `production`  | AAB                 | upload to Play (`npx eas-cli@latest submit -p android`) |

Checks:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint (ESLint + Prettier)
npx expo-doctor
```

---

## 6. Local emulators + seed data

```bash
# terminal 1 (needs Java 21+)
npm run emulators

# terminal 2
npm run seed
```

The seed creates tutor **Priya Sharma**, `+91 98765 43210`, on a 9-day trial. It also creates 3 batches and the 8 students from the Figma file (Aarav Patel, Riya Kapoor, Meet Shah, Diya Joshi, Kabir Verma, Nisha Singh, Ishaan Mehta, Om Trivedi), with fee history and this month's attendance. It refuses to run unless `FIRESTORE_EMULATOR_HOST` is localhost.

Set `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true` and restart `npm start`. Log in with the seeded number. The emulator doesn't send SMS: the OTP is shown in the Emulator UI (<http://127.0.0.1:4000/auth>) and in the terminal 1 log.

---

## 7. Subscriptions (RevenueCat)

1. Play Console → _Monetize_ → _Subscriptions_ → create **`yearly_199`** with a yearly base plan at ₹199. A Play subscription needs the app uploaded to a testing track first.
2. RevenueCat → add the Play app (with service-account credentials) → import `yearly_199` → create entitlement **`pro`** (or set your id in `.env`) → attach the product → add it to the **current offering**.
3. Put the Google Play public SDK key in `.env`.

How entitlement works (`src/hooks/useEntitlement.ts`):

- Onboarding writes `subscription: { status: 'trial', trialEndsAt: now + 30 days }`. Firestore rules allow only this exact shape on create, and forbid the client from ever changing `subscription` after that.
- **Active** = RevenueCat entitlement active on this device **or** `subscription.status == 'active'` on the tutor doc.
- **Expired** means the app goes read-only: add/edit/save controls are disabled and the plan card is shown. Nothing is ever deleted, and WhatsApp reminders and viewing keep working.

**TODO (server side):** because clients can't write `subscription`, keep it in sync with a RevenueCat **webhook → Cloud Function**. On `INITIAL_PURCHASE`/`RENEWAL` set `tutors/{app_user_id}.subscription.status = 'active'`; on `EXPIRATION` set `'expired'`. The RevenueCat app user id is the Firebase uid. Until then, "active" is only known on the device that purchased (or after _Restore purchase_).

---

## 8. Project layout

```
app/                     Expo Router routes (screens only)
  _layout.tsx            fonts, providers, auth gate (Stack.Protected)
  (auth)/                login, otp, onboarding
  (tabs)/                home (index), students, attendance, fees + BottomNav
  student/[id].tsx       student detail
  student/new.tsx        add student (also edit: /student/new?id=…)
  settings.tsx, class-details.tsx, batches.tsx, batch-edit.tsx
src/
  theme.ts               design tokens from Figma
  types.ts               data model
  components/            Button, Field, Card, Pill, Avatar, IconButton, SectionHeader,
                         Segmented/OptionGroup, Select, DaysSelector, StudentRow/DefaulterRow,
                         BottomNav, Screen (AppBar, PageHeader, StickyFooter, Empty/Loading/Offline),
                         PlanBanner, RecordPaymentSheet
  data/parse.ts          Firestore → typed objects (defensive)
  data/repo.ts           all writes (fire-and-forget, offline-safe)
  hooks/                 live Firestore hooks, entitlement, reminders, fee ensure, purchases
  lib/                   firebase, format (₹ en-IN), whatsapp, pickers, phone validation, purchases
  store/session.ts       zustand: auth user, tutor doc, offline flag, OTP confirmation
scripts/seed.ts          emulator seed
firestore.rules          security rules
```

### Data model

```
tutors/{uid}                                  name, phone, className, reminderTemplate, createdAt,
                                              subscription { status, trialEndsAt }
tutors/{uid}/batches/{id}                     name, timing, days[], monthlyFee, active
tutors/{uid}/students/{id}                    name, parentName, parentPhone, batchId, monthlyFee, joinDate, active
tutors/{uid}/attendance/{batchId}_{date}      batchId, date, month, absent[]
tutors/{uid}/fees/{studentId}_{YYYY-MM}       studentId, month, amountDue, amountPaid, status, payments[]
```

Two fields were added beyond the original spec:

- `batches.monthlyFee`: the fee entered at onboarding, used to prefill new students in that batch.
- `attendance.month`: lets Student Detail load a batch's month with equality filters only, so no composite index is needed.

Amounts are whole rupees. Dates are `YYYY-MM-DD` strings.

### Offline behaviour

Firestore's on-device cache is on by default. All screens read through `onSnapshot` listeners, and writes are applied locally and never awaited in the UI, so the app works fully offline and syncs later. An amber banner shows when data is served from cache.

On app open, `useEnsureMonthlyFees` creates any missing `fees/{studentId}_{month}` docs for the current month. It uses deterministic ids and `merge`, so it is idempotent.

## Known limitations

- Android only. Date/time pickers use the Android native dialog; iOS would need an inline picker.
- Changing a student's monthly fee applies from the next month's fee doc. The current month's doc is not rewritten.
