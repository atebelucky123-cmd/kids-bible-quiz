import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

// The server's secondsRemaining (computed from a server-recorded
// timestamp, spec Section 12) is the source of truth — this just ticks
// it down visually between fetches rather than trusting a local clock
// for real timing.
export function Timer({ secondsRemaining, onExpire }: { secondsRemaining: number; onExpire?: () => void }) {
  const [remaining, setRemaining] = useState(secondsRemaining);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(secondsRemaining);
    expiredRef.current = false;
  }, [secondsRemaining]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsRemaining, onExpire]);

  const isLow = remaining <= 10;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={[styles.badge, isLow && styles.badgeLow]}>
      <Text style={[styles.text, isLow && styles.textLow]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 12,
    backgroundColor: Brand.white,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  badgeLow: { backgroundColor: '#ffe1d6' },
  text: { fontSize: 20, fontWeight: '800', color: Brand.ink },
  textLow: { color: '#c0392b' },
});
