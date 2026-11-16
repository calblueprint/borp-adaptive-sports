import { useEffect, useState } from 'react';

// Ticks down once per second; used for the "Resend code" cooldown.
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(
      () => setSeconds(value => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [seconds]);

  return {
    seconds,
    start: (from = 60) => setSeconds(from),
    reset: () => setSeconds(0),
  };
}
