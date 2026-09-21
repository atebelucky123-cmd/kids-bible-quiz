import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { StarIcon } from '@/components/ui/star-icon';
import { Brand } from '@/constants/theme';

// Client's exact required wording (spec Section 13): correct answers get
// "Well done" with a star, full-screen, before moving on; wrong answers
// get the "Whoops" message inline, staying on the same question.
export function CorrectAnswerOverlay({ onNext }: { onNext: () => void }) {
  // A light bounce-in for the star — enough to feel like a reward without
  // being the "excessive animation" the spec cautions against.
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <StarIcon size={140} />
      </Animated.View>
      <Text style={styles.title}>Well done!</Text>
      <Button title="Next Question" variant="primary" onPress={onNext} />
    </View>
  );
}

export function WrongAnswerBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>Whoops! That is the wrong answer, let&apos;s try again.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: Brand.lime,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: '800', color: Brand.ink },
  banner: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: '#ffe1c9',
    padding: 14,
  },
  bannerText: { fontSize: 15, fontWeight: '700', color: '#a3410a', textAlign: 'center' },
});
