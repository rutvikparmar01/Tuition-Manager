/**
 * Seeds the local Firebase emulators with a demo tutor that matches the Figma screens.
 *
 *   npm run emulators          # terminal 1
 *   npm run seed               # terminal 2
 *
 * Then log in on the dev build (with EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true) as +91 98765 43210.
 * The emulator does not send SMS: read the OTP from the Emulator UI (http://127.0.0.1:4000/auth)
 * or the emulator terminal log.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-tuition-manager';
const UID = 'demo-tutor';
const PHONE = '9876543210';

if (
  !process.env.FIRESTORE_EMULATOR_HOST.startsWith('127.0.0.1') &&
  !process.env.FIRESTORE_EMULATOR_HOST.startsWith('localhost')
) {
  throw new Error('Refusing to seed: FIRESTORE_EMULATOR_HOST does not point at localhost.');
}

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();
const auth = getAuth();
const tutorDoc = db.collection('tutors').doc(UID);

type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const batches = [
  {
    id: 'class-10-maths',
    name: 'Class 10 Maths',
    timing: '5:00 PM',
    days: WEEKDAYS.slice(0, 6),
    monthlyFee: 1500,
  },
  {
    id: 'class-9-science',
    name: 'Class 9 Science',
    timing: '4:00 PM',
    days: ['Mon', 'Wed', 'Fri'] as Weekday[],
    monthlyFee: 1200,
  },
  {
    id: 'class-8-maths',
    name: 'Class 8 Maths',
    timing: '6:00 PM',
    days: ['Tue', 'Thu', 'Sat'] as Weekday[],
    monthlyFee: 2400,
  },
];

// [name, parent, phone, batchId, fee, monthsAgoJoined, thisMonth: paid | partial | pending]
const students = [
  ['Aarav Patel', 'Rakesh Patel', '9812345601', 'class-10-maths', 1500, 8, 'pending'],
  ['Diya Joshi', 'Meena Joshi', '9812345602', 'class-10-maths', 1500, 6, 'paid'],
  ['Kabir Verma', 'Anil Verma', '9812345603', 'class-10-maths', 1500, 5, 'paid'],
  ['Ishaan Mehta', 'Kavita Mehta', '9812345604', 'class-10-maths', 1500, 3, 'partial'],
  ['Nisha Singh', 'Sunita Singh', '9812345605', 'class-10-maths', 1500, 2, 'paid'],
  ['Om Trivedi', 'Hemant Trivedi', '9812345606', 'class-10-maths', 1500, 1, 'paid'],
  ['Riya Kapoor', 'Neha Kapoor', '9812345607', 'class-9-science', 1200, 7, 'pending'],
  ['Meet Shah', 'Jignesh Shah', '9812345608', 'class-8-maths', 2400, 4, 'pending'],
] as const;

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => dateKey(d).slice(0, 7);
const weekday = (d: Date) => WEEKDAYS[(d.getDay() + 6) % 7]!;
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

// Deterministic pseudo-random so every seed looks the same.
let seed = 42;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;

async function clearTutor() {
  for (const col of ['batches', 'students', 'attendance', 'fees']) {
    const snap = await tutorDoc.collection(col).get();
    const w = db.bulkWriter();
    snap.docs.forEach((d) => w.delete(d.ref));
    await w.close();
  }
}

async function main() {
  try {
    await auth.deleteUser(UID);
  } catch {
    // not there yet
  }
  await auth.createUser({ uid: UID, phoneNumber: '+91' + PHONE, displayName: 'Priya Sharma' });
  await clearTutor();

  const now = new Date();
  const thisMonth = monthKey(now);
  const w = db.bulkWriter();

  w.set(tutorDoc, {
    name: 'Priya Sharma',
    phone: PHONE,
    className: "Priya's Tuition Classes",
    reminderTemplate:
      "Hi, this is a reminder that {student}'s fee of ₹{amount} for {month} is pending. Please pay at your earliest. — {tutor}",
    createdAt: FieldValue.serverTimestamp(),
    subscription: {
      status: 'trial',
      trialEndsAt: Timestamp.fromMillis(now.getTime() + 9 * 24 * 60 * 60 * 1000),
    },
  });

  for (const { id, ...b } of batches) {
    w.set(tutorDoc.collection('batches').doc(id), { ...b, active: true });
  }

  for (const [name, parentName, parentPhone, batchId, fee, monthsAgo, status] of students) {
    const id = slug(name);
    const join = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 5);
    w.set(tutorDoc.collection('students').doc(id), {
      name,
      parentName,
      parentPhone,
      batchId,
      monthlyFee: fee,
      joinDate: dateKey(join),
      active: true,
    });

    // Fee history: previous months paid in full, this month per the table above.
    for (let m = Math.min(monthsAgo, 3); m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const month = monthKey(d);
      const isCurrent = month === thisMonth;
      const paidAmount = !isCurrent || status === 'paid' ? fee : status === 'partial' ? fee / 2 : 0;
      const payDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        Math.min(5 + Math.floor(rand() * 5), now.getDate()),
      );
      w.set(tutorDoc.collection('fees').doc(`${id}_${month}`), {
        studentId: id,
        month,
        amountDue: fee,
        amountPaid: paidAmount,
        status: paidAmount >= fee ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
        payments: paidAmount
          ? [{ amount: paidAmount, mode: rand() > 0.4 ? 'upi' : 'cash', date: dateKey(payDay) }]
          : [],
      });
    }
  }

  // Attendance for every class day this month up to yesterday (today is left for the demo).
  for (const b of batches) {
    const roster = students.filter((s) => s[3] === b.id).map((s) => slug(s[0]));
    for (let day = 1; day < now.getDate(); day++) {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      if (!b.days.includes(weekday(d))) continue;
      const date = dateKey(d);
      w.set(tutorDoc.collection('attendance').doc(`${b.id}_${date}`), {
        batchId: b.id,
        date,
        month: thisMonth,
        absent: roster.filter(() => rand() < 0.12),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await w.close();
  console.log(
    `Seeded ${PROJECT_ID}: tutor ${UID} (+91 ${PHONE}), ${batches.length} batches, ${students.length} students.`,
  );
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
