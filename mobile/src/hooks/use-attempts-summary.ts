import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const summary = await api.getAttemptsSummary();
      setState({ status: 'ready', summary });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
