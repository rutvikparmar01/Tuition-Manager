import {
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type Query,
} from '@react-native-firebase/firestore';
import { useEffect, useEffectEvent, useState } from 'react';

import { reportError } from '@/lib/firebase';

export interface Live<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

interface Result<T> {
  /** The query key this result belongs to; a mismatch with the current key means "loading". */
  key: string | null;
  data: T;
  error: Error | null;
}

const EMPTY: never[] = [];

/**
 * Subscribes to a Firestore query. `key` identifies the query: the listener is rebuilt only when it
 * changes, so callers can build the query inline. Pass a `null` key to skip (e.g. no id yet).
 * Results from a previous key are never returned, so switching e.g. batch never shows stale rows.
 */
export function useLiveQuery<T>(
  key: string | null,
  build: () => Query<DocumentData>,
  parse: (id: string, data: DocumentData) => T,
): Live<T[]> {
  const [result, setResult] = useState<Result<T[]>>({ key: null, data: EMPTY, error: null });

  const subscribe = useEffectEvent((k: string) =>
    onSnapshot(
      build(),
      (snap) =>
        setResult({ key: k, data: snap.docs.map((d) => parse(d.id, d.data())), error: null }),
      (error) => {
        reportError(error, `useLiveQuery(${k})`);
        setResult({ key: k, data: EMPTY, error });
      },
    ),
  );

  useEffect(() => (key ? subscribe(key) : undefined), [key]);

  const fresh = key !== null && result.key === key;
  return {
    data: fresh ? result.data : EMPTY,
    loading: key !== null && !fresh,
    error: fresh ? result.error : null,
  };
}

export function useLiveDoc<T>(
  key: string | null,
  build: () => DocumentReference<DocumentData>,
  parse: (id: string, data: DocumentData) => T,
): Live<T | null> {
  const [result, setResult] = useState<Result<T | null>>({ key: null, data: null, error: null });

  const subscribe = useEffectEvent((k: string) =>
    onSnapshot(
      build(),
      (snap) =>
        setResult({
          key: k,
          data: snap.exists() ? parse(snap.id, snap.data()) : null,
          error: null,
        }),
      (error) => {
        reportError(error, `useLiveDoc(${k})`);
        setResult({ key: k, data: null, error });
      },
    ),
  );

  useEffect(() => (key ? subscribe(key) : undefined), [key]);

  const fresh = key !== null && result.key === key;
  return {
    data: fresh ? result.data : null,
    loading: key !== null && !fresh,
    error: fresh ? result.error : null,
  };
}
