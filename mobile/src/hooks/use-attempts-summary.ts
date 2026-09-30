import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { api, ApiError, type AttemptsSummary } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: AttemptsSummary };

// The Home screen's Start-vs-Continue decision must come from real
// quiz_attempts data (spec Section 7 / Phase 6 "verify before moving on"),
// never a client-side guess — this hook is the one place that fetches it.
export function useAttemptsSummary() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    // Only the first load shows the spinner; later refreshes swap the data
    // in quietly so returning to Home doesn't flash a loading screen.
    if (!hasLoadedRef.current) setState({ status: 'loading' });
    try {
      const summary = await api.getAttemptsSummary();
      hasLoadedRef.current = true;
      setState({ status: 'ready', summary });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      });
    }
  }, []);

  // Refetch every time Home comes back into view, not just when it's first
  // created. Leaving a quiz returns to the Home screen already underneath
  // it, so a mount-only fetch kept showing pre-quiz data — no "Welcome
  // back", no Continue Quiz, stale stats.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { state, reload: load };
}
