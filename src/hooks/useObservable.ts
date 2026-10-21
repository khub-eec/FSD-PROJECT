import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

/**
 * Subscribes to an Observable for the lifetime of the component and returns its latest value.
 * BehaviorSubject-backed streams emit synchronously on subscribe, so `initial` is only seen
 * for streams that have not produced a value yet.
 */
export function useObservable<T>(source$: Observable<T>, initial: T): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const subscription = source$.subscribe((next) => setValue(next));
    return () => subscription.unsubscribe();
  }, [source$]);

  return value;
}
