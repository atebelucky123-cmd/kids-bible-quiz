import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type CurrentQuestionResponse } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: CurrentQuestionResponse };

export function useCurrentQuestion(attemptId: number) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await api.getQuizQuestion(attemptId);
      setState({ status: 'ready', data });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      });
    }
  }, [attemptId]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
