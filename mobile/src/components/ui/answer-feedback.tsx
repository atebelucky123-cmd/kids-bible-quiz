import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { Brand } from '@/constants/theme';

// Client's exact required wording (spec Section 13): correct answers get
// "Well done" with a star, full-screen, before moving on; wrong answers
// get the "Whoops" message inline, staying on the same question.
export function CorrectAnswerOverlay({ onNext }: { onNext: () => void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Mascot pose="star" size={140} />
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
