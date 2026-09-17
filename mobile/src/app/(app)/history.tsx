import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Brand, Spacing } from '@/constants/theme';
import { useAttemptsSummary } from '@/hooks/use-attempts-summary';
import type { QuizAttemptSummary } from '@/lib/api';

// No new backend endpoint — GET /api/me/attempts (Phase 6) already returns
// the student's complete attempt history (development plan Appendix D).
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function HistoryItem({ attempt }: { attempt: QuizAttemptSummary }) {
  const isInProgress = attempt.status === 'IN_PROGRESS';

  return (
    <Pressable
      disabled={isInProgress}
      onPress={() =>
        router.push({ pathname: '/quiz/result/[attemptId]', params: { attemptId: String(attempt.id) } })
      }
      style={styles.item}>
      <View style={styles.itemRow}>
        <Text style={styles.itemDate}>
          {isInProgress ? 'In progress' : formatDate(attempt.completedAt ?? attempt.startedAt)}
        </Text>
        {isInProgress ? (
          <Text style={styles.badgeSaved}>SAVED</Text>
        ) : (
          <Text style={styles.itemPercentage}>{Math.round(attempt.percentage ?? 0)}%</Text>
        )}
      </View>
      <Text style={styles.itemScore}>
        {isInProgress
          ? `Question ${attempt.currentQuestionIndex + 1} of ${attempt.totalQuestions}`
          : `${attempt.score} of ${attempt.totalQuestions} correct`}
      </Text>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { state, reload } = useAttemptsSummary();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to Home"
            hitSlop={10}
            onPress={() => router.replace('/')}
            style={styles.homeButton}>
            <Ionicons name="home" size={24} color={Brand.cobalt} />
          </Pressable>
          <Text style={styles.title}>Quiz History</Text>
        </View>

        {state.status === 'loading' ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Brand.cobalt} size="large" />
          </View>
        ) : state.status === 'error' ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{state.message}</Text>
            <Button title="Try Again" variant="outline" onPress={reload} />
          </View>
        ) : state.summary.attempts.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No quizzes yet — take your first quiz!</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {state.summary.attempts.map((attempt) => (
              <HistoryItem key={attempt.id} attempt={attempt} />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingBottom: 8 },
  homeButton: {},
  title: { fontSize: 22, fontWeight: '800', color: Brand.ink },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyText: { fontSize: 15, color: Brand.ink, textAlign: 'center' },
  list: { padding: 24, paddingTop: 8, gap: Spacing.three },
  item: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    padding: 16,
    gap: 4,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { fontSize: 13, fontWeight: '700', color: Brand.cobalt, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemPercentage: { fontSize: 18, fontWeight: '800', color: Brand.cobalt },
  badgeSaved: {
    fontSize: 12,
    fontWeight: '800',
    color: Brand.ink,
    backgroundColor: Brand.lime,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    letterSpacing: 1,
  },
  itemScore: { fontSize: 15, fontWeight: '600', color: Brand.ink },
});
