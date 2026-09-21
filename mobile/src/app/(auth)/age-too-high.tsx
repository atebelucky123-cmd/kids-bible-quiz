import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgeErrorIcon } from '@/components/ui/age-error-icon';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

export default function AgeTooHighScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <AgeErrorIcon size={120} />
          {/* Wording is verbatim from the client's handwritten notes. */}
          <Text style={styles.title}>Oops, the age is too high</Text>
          <Text style={styles.body}>
            This quiz is for children aged 5 to 12. Ask a grown-up if you need help.
          </Text>
        </View>
        <Button title="Change My Age" variant="primary" onPress={() => router.replace('/register-step-1')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontSize: 26, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  body: { fontSize: 16, color: Brand.cobalt, textAlign: 'center', lineHeight: 22 },
});
