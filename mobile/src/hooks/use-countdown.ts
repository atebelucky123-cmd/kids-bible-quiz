import { useEffect, useState } from 'react';

// The server's secondsRemaining (computed from a server-recorded
// timestamp, spec Section 12) is the source of truth — this just ticks
// it down visually between fetches rather than trusting a local clock
// for real timing. Resets whenever the caller passes a new initial value
// (e.g. a freshly fetched question).
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return remaining;
}
