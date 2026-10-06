import { useCallback, useRef } from "react";

// Serialize event-triggered actions immediately, before a React state update can
// disable the control. State still owns the visible loading feedback.
export function useExclusiveAction() {
  const running = useRef(false);
  return useCallback(async (action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    try {
      await action();
    } finally {
      running.current = false;
    }
  }, []);
}
