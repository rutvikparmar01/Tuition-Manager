import { query, where } from '@react-native-firebase/firestore';
import { useMemo } from 'react';

import { parseAttendance, parseBatch, parseFee, parseStudent } from '@/data/parse';
import { attendanceId } from '@/data/repo';
import { useLiveDoc, useLiveQuery } from '@/hooks/useLive';
import { colRef, docRef } from '@/lib/firebase';
import { useUid } from '@/store/session';
import type { Batch, DateKey, MonthKey, Student } from '@/types';

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export function useBatches() {
  const uid = useUid();
  const live = useLiveQuery(
    `batches:${uid}`,
    () => query(colRef(uid, 'batches'), where('active', '==', true)),
    parseBatch,
  );
  const data = useMemo(() => [...live.data].sort(byName), [live.data]);
  const byId = useMemo(() => new Map<string, Batch>(data.map((b) => [b.id, b])), [data]);
  return { ...live, data, byId };
}

export function useStudents() {
  const uid = useUid();
  const live = useLiveQuery(
    `students:${uid}`,
    () => query(colRef(uid, 'students'), where('active', '==', true)),
    parseStudent,
  );
  const data = useMemo(() => [...live.data].sort(byName), [live.data]);
  const byId = useMemo(() => new Map<string, Student>(data.map((s) => [s.id, s])), [data]);
  return { ...live, data, byId };
}

export function useStudent(id: string | undefined) {
  const uid = useUid();
  return useLiveDoc(
    id ? `student:${uid}:${id}` : null,
    () => docRef(uid, 'students', id ?? ''),
    parseStudent,
  );
}

export function useAttendance(batchId: string | null, date: DateKey) {
  const uid = useUid();
  return useLiveDoc(
    batchId ? `attendance:${uid}:${batchId}:${date}` : null,
    () => docRef(uid, 'attendance', attendanceId(batchId ?? '', date)),
    parseAttendance,
  );
}

/** All batches' attendance for one day (Home → which batches are "Done"). */
export function useAttendanceOn(date: DateKey) {
  const uid = useUid();
  return useLiveQuery(
    `attendanceOn:${uid}:${date}`,
    () => query(colRef(uid, 'attendance'), where('date', '==', date)),
    parseAttendance,
  );
}

export function useBatchMonthAttendance(batchId: string | undefined, month: MonthKey) {
  const uid = useUid();
  const live = useLiveQuery(
    batchId ? `attendanceMonth:${uid}:${batchId}:${month}` : null,
    () =>
      query(
        colRef(uid, 'attendance'),
        where('batchId', '==', batchId ?? ''),
        where('month', '==', month),
      ),
    parseAttendance,
  );
  const data = useMemo(
    () => [...live.data].sort((a, b) => a.date.localeCompare(b.date)),
    [live.data],
  );
  return { ...live, data };
}

export function useFees(month: MonthKey) {
  const uid = useUid();
  return useLiveQuery(
    `fees:${uid}:${month}`,
    () => query(colRef(uid, 'fees'), where('month', '==', month)),
    parseFee,
  );
}

export function useStudentFees(studentId: string | undefined) {
  const uid = useUid();
  const live = useLiveQuery(
    studentId ? `studentFees:${uid}:${studentId}` : null,
    () => query(colRef(uid, 'fees'), where('studentId', '==', studentId ?? '')),
    parseFee,
  );
  const data = useMemo(
    () => [...live.data].sort((a, b) => b.month.localeCompare(a.month)),
    [live.data],
  );
  return { ...live, data };
}
