import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Brand, Spacing } from '@/constants/theme';
import { api, ApiError, type Quiz } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; quizzes: Quiz[] };

// Reached from Home's "Start Quiz"/"Start a New Quiz" and the Result
// screen's "Play Again" — none of them create an attempt directly anymore,
// they all land here first so the student can pick which named quiz to take.
export default function ChooseQuizScreen() {
  const { restart } = useLocalSearchParams<{ restart?: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [startingId, setStartingId] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAvailableQuizzes()
      .then((quizzes) => {
        if (!cancelled) setState({ status: 'ready', quizzes });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Failed to load quizzes' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChoose(quiz: Quiz) {
    setStartError(null);
    setStartingId(quiz.id);
    try {
      const attempt = await api.startQuiz(restart === '1', quiz.id);
      router.replace({ pathname: '/quiz/[attemptId]', params: { attemptId: String(attempt.attemptId) } });
    } catch (err) {
      setStartError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setStartingId(null);
    }
  }

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
          <Text style={styles.title}>Choose a Quiz</Text>
        </View>

        {state.status === 'loading' ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Brand.cobalt} size="large" />
          </View>
        ) : state.status === 'error' ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{state.message}</Text>
            <Button title="Back to Home" variant="outline" onPress={() => router.replace('/')} />
          </View>
        ) : state.quizzes.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No quizzes for your age yet — ask a grown-up to check back later.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {startError ? <Text style={styles.errorText}>{startError}</Text> : null}
            {state.quizzes.map((quiz) => (
              <Pressable
                key={quiz.id}
                disabled={startingId !== null}
                onPress={() => handleChoose(quiz)}
                style={styles.item}>
                <Text style={styles.itemTitle}>{quiz.title}</Text>
                <Text style={styles.itemMeta}>
                  {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'} · {quiz.timeLimitSeconds}s each
                </Text>
                {startingId === quiz.id ? <ActivityIndicator color={Brand.cobalt} style={styles.itemSpinner} /> : null}
              </Pressable>
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
  errorText: { fontSize: 14, color: '#c0392b', textAlign: 'center', fontWeight: '600' },
  list: { padding: 24, paddingTop: 8, gap: Spacing.three },
  item: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    padding: 16,
    gap: 4,
  },
  itemTitle: { fontSize: 17, fontWeight: '800', color: Brand.ink },
  itemMeta: { fontSize: 14, fontWeight: '600', color: Brand.cobalt },
  itemSpinner: { marginTop: 8 },
});
