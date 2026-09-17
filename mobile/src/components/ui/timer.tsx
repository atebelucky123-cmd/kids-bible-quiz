import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

// Purely presentational — the countdown itself lives in whichever screen
// uses this (see useCountdown), so there's a single component owning that
// state instead of a child ticking its own clock and reaching back up into
// a parent's state from an effect.
export function Timer({ remaining }: { remaining: number }) {
  const isLow = remaining > 0 && remaining <= 10;
  const expired = remaining <= 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={[styles.badge, (isLow || expired) && styles.badgeLow]}>
      <Text style={[styles.text, (isLow || expired) && styles.textLow]}>{label}</Text>
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
