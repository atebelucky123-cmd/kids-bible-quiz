import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Brand } from '@/constants/theme';

export function QuizHistoryCard() {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/history')} style={styles.card}>
      <Text style={styles.title}>Quiz History</Text>
      <Text style={styles.link}>See all your past quizzes</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    padding: 16,
    gap: 4,
  },
  title: { fontSize: 12, fontWeight: '800', color: Brand.ink, letterSpacing: 1, textTransform: 'uppercase' },
  link: { fontSize: 15, color: Brand.cobalt, fontWeight: '600' },
});
