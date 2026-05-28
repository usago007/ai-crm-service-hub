import { useCallback, useEffect, useRef, useState } from 'react';

function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => a[k] === b[k]);
}

export function useDirtyTracking<T>(saved: T) {
  const [draft, setDraft] = useState<T>(saved);
  const dirty = !shallowEqual(draft as Record<string, unknown>, saved as Record<string, unknown>);
  const savedRef = useRef(saved);

  // Sync draft when external saved value changes and there are no local edits
  useEffect(() => {
    if (saved !== savedRef.current) {
      savedRef.current = saved;
      if (!dirty) {
        setDraft(saved);
      }
    }
  }, [saved, dirty]);

  const reset = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  return { draft, setDraft, dirty, reset, saved };
}
