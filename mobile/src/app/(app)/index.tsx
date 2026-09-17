import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { LastResultCard } from '@/components/ui/last-result-card';
import { Mascot } from '@/components/ui/mascot';
import { StatCard } from '@/components/ui/stat-card';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAttemptsSummary } from '@/hooks/use-attempts-summary';
import { api, ApiError } from '@/lib/api';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { state, reload } = useAttemptsSummary();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (!user) return null;

  async function handleStart(restart: boolean) {
    setStartError(null);
    setStarting(true);
    try {
      const attempt = await api.startQuiz(restart);
      router.push({ pathname: '/quiz/[attemptId]', params: { attemptId: String(attempt.attemptId) } });
    } catch (err) {
      setStartError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color={Brand.cobalt} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.errorText}>{state.message}</Text>
          <Button title="Try Again" variant="outline" onPress={reload} />
        </SafeAreaView>
      </View>
    );
  }

  const { inProgressAttempt, stats } = state.summary;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Mascot pose={inProgressAttempt ? 'shrug' : 'wave'} size={110} />
            <Text style={styles.greeting}>
              {inProgressAttempt ? 'Welcome back, ' : 'Welcome, '}
              {user.firstName}!
            </Text>
          </View>

          {inProgressAttempt ? (
            <View style={styles.savedCard}>
              <Text style={styles.savedBadge}>SAVED</Text>
              <Text style={styles.savedText}>
                Question {inProgressAttempt.currentQuestionIndex + 1} of {inProgressAttempt.totalQuestions}
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {inProgressAttempt ? (
              <>
                <Button
                  title="Continue Quiz"
                  variant="secondary"
                  loading={starting}
                  onPress={() =>
                    router.push({ pathname: '/quiz/[attemptId]', params: { attemptId: String(inProgressAttempt.id) } })
                  }
                />
                <Button
                  title="Start a New Quiz"
                  variant="outline"
                  loading={starting}
                  onPress={() => handleStart(true)}
                />
              </>
            ) : (
              <Button title="Start Quiz" variant="primary" loading={starting} onPress={() => handleStart(false)} />
            )}
            {startError ? <Text style={styles.errorText}>{startError}</Text> : null}
          </View>

          <View style={styles.statsRow}>
            <StatCard value={stats.starsEarned} label="Stars Earned" />
            <StatCard value={stats.quizzesCompleted} label="Quizzes Completed" />
          </View>

          {stats.lastResult ? <LastResultCard result={stats.lastResult} /> : null}

          <Text style={styles.logoutLink} onPress={logout}>
            Log Out
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontSize: 15, color: Brand.ink, textAlign: 'center' },
  content: { padding: 24, gap: Spacing.four },
  header: { alignItems: 'center', gap: 12 },
  greeting: { fontSize: 24, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  savedCard: {
    borderWidth: 2,
    borderColor: Brand.ink,
    backgroundColor: Brand.lime,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  savedBadge: { fontSize: 12, fontWeight: '800', color: Brand.ink, letterSpacing: 1 },
  savedText: { fontSize: 15, fontWeight: '600', color: Brand.ink },
  actions: { gap: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  logoutLink: { fontSize: 14, color: Brand.cobalt, textAlign: 'center', marginTop: 8 },
});
