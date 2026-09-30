import { useEffect, useState } from 'react';

// A countdown start point. Callers create a new object every time the clock
// should restart (a freshly fetched question, a wrong-answer retry), so it
// restarts even when the seconds value is the same as last time.
export type CountdownStart = { seconds: number };

// The server's secondsRemaining (computed from a server-recorded
// timestamp, spec Section 12) is the source of truth — this just ticks
// it down visually between fetches rather than trusting a local clock
// for real timing.
export function useCountdown(start: CountdownStart) {
  const [currentStart, setCurrentStart] = useState(start);
  const [remaining, setRemaining] = useState(start.seconds);

  // Reset during render rather than in an effect, so the render that
  // receives a new start never sees the previous question's leftover 0 —
  // that one stale frame was enough to trigger a false "time's up".
  let value = remaining;
  if (start !== currentStart) {
    setCurrentStart(start);
    setRemaining(start.seconds);
    value = start.seconds;
  }

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((current) => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return value;
}
