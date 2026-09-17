import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/ui/timer';
import { Brand, Spacing } from '@/constants/theme';
import { useCountdown } from '@/hooks/use-countdown';
import { useCurrentQuestion } from '@/hooks/use-current-question';

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

// Answer submission (POST /api/quiz/:attemptId/answer), the "Well done" /
// "Whoops" feedback, and advancing to the next question are Phase 8 scope.
// This screen only needs to deliver the question and a real, server-backed
// countdown — tapping an option just highlights it locally for now.
export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { state, reload } = useCurrentQuestion(Number(attemptId));
  const [selected, setSelected] = useState<(typeof OPTION_KEYS)[number] | null>(null);
  // Called unconditionally (rules of hooks) with a harmless 0 while the
  // question hasn't loaded yet — the loading/error branches below never
  // render anything that reads `remaining`.
  const remaining = useCountdown(state.status === 'ready' ? state.data.secondsRemaining : 0);

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
          <Text style={styles.link} onPress={() => router.replace('/')}>
            Back to Home
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const { question, currentQuestionIndex, totalQuestions } = state.data;
  const expired = remaining <= 0;
  const options: Record<(typeof OPTION_KEYS)[number], string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Back to Home"
            hitSlop={10}
            onPress={() => router.replace('/')}
            style={styles.homeButton}>
            <Ionicons name="home" size={24} color={Brand.cobalt} />
          </Pressable>

          <Text style={styles.counter}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>

          <Timer remaining={remaining} />

          <Text style={styles.questionText}>{question.questionText}</Text>

          <View style={styles.options}>
            {OPTION_KEYS.map((key) => (
              <Pressable
                key={key}
                disabled={expired}
                onPress={() => setSelected(key)}
                style={[
                  styles.option,
                  selected === key && styles.optionSelected,
                  expired && styles.optionDisabled,
                ]}>
                <Text style={[styles.optionText, selected === key && styles.optionTextSelected]}>
                  {options[key]}
                </Text>
              </Pressable>
            ))}
          </View>

          {expired ? (
            <Text style={styles.expiredText}>Time&apos;s up! Answering is wired up in the next phase.</Text>
          ) : (
            <Text style={styles.hint}>Tap the answer you think is right.</Text>
          )}
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
  link: { fontSize: 14, color: Brand.cobalt, fontWeight: '600' },
  homeButton: { alignSelf: 'flex-start' },
  counter: { fontSize: 14, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  questionText: { fontSize: 22, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  options: { gap: 12 },
  option: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionSelected: { backgroundColor: Brand.cobalt },
  optionDisabled: { opacity: 0.5 },
  optionText: { fontSize: 16, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  optionTextSelected: { color: Brand.white },
  hint: { fontSize: 13, color: Brand.cobalt, textAlign: 'center' },
  expiredText: { fontSize: 14, fontWeight: '700', color: '#c0392b', textAlign: 'center' },
});
