import { useMemo } from 'react';

import { useBatches, useFees, useStudents } from '@/hooks/data';
import type { Batch, Fee, MonthKey, Student } from '@/types';

export interface FeeRow {
  fee: Fee;
  student: Student;
  batch: Batch | undefined;
  due: number;
}

/** A month's fee docs joined with their (active) students, plus the totals the screens show. */
export function useFeeRows(month: MonthKey) {
  const students = useStudents();
  const batches = useBatches();
  const fees = useFees(month);

  const studentsById = students.byId;
  const batchesById = batches.byId;
  const loading = students.loading || fees.loading || batches.loading;
  const error = students.error ?? fees.error ?? batches.error;

  return useMemo(() => {
    const rows: FeeRow[] = [];
    for (const fee of fees.data) {
      const student = studentsById.get(fee.studentId);
      if (!student) continue;
      rows.push({
        fee,
        student,
        batch: batchesById.get(student.batchId),
        due: Math.max(0, fee.amountDue - fee.amountPaid),
      });
    }
    const pending = rows.filter((r) => r.fee.status !== 'paid').sort((a, b) => b.due - a.due);
    const paid = rows
      .filter((r) => r.fee.status === 'paid')
      .sort((a, b) => a.student.name.localeCompare(b.student.name));
    const byStudent = new Map(rows.map((r) => [r.student.id, r]));
    return {
      loading,
      error,
      rows,
      pending,
      paid,
      byStudent,
      collected: rows.reduce((s, r) => s + r.fee.amountPaid, 0),
      total: rows.reduce((s, r) => s + r.fee.amountDue, 0),
      dueTotal: pending.reduce((s, r) => s + r.due, 0),
    };
  }, [fees.data, studentsById, batchesById, loading, error]);
}
