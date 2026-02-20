import { type MutableRefObject, useCallback, useMemo, useRef } from 'react';
import type { PositionStore } from '@/features/player/core/domain/types';

interface PositionStoreController {
  positionRef: MutableRefObject<number>;
  positionStore: PositionStore;
  emitPosition: (ms: number, force?: boolean) => void;
}

export function usePositionStore(): PositionStoreController {
  const positionRef = useRef(0);
  const listenersRef = useRef(new Set<() => void>());
  const lastEmitRef = useRef(0);

  const emitPosition = useCallback((ms: number, force?: boolean) => {
    positionRef.current = ms;
    const now = Date.now();
    if (!force && now - lastEmitRef.current < 200) return;
    lastEmitRef.current = now;
    for (const listener of listenersRef.current) listener();
  }, []);

  const positionStore = useMemo<PositionStore>(
    () => ({
      subscribe: (cb: () => void) => {
        listenersRef.current.add(cb);
        return () => {
          listenersRef.current.delete(cb);
        };
      },
      getSnapshot: () => positionRef.current,
    }),
    [],
  );

  return { positionRef, positionStore, emitPosition };
}
