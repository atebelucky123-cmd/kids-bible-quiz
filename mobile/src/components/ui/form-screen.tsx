import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Wraps every scrollable form screen so the keyboard never covers the
// field being edited (or the submit button below it) — without this,
// tapping a lower field/button while the keyboard is up silently fails to
// register a tap, which looks like "the button doesn't work".
export function FormScreen({
  children,
  backgroundColor,
  contentStyle,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  contentStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 24, gap: 16 },
});
