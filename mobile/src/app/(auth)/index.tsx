import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '@/components/ui/mascot';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Mascot pose="wave" size={150} />
          <Text style={styles.title}>Kids Bible Quiz</Text>
          <Text style={styles.tagline}>Bible questions, one step at a time.</Text>
        </View>

        <View style={styles.actions}>
          <Button title="Sign Up" variant="primary" onPress={() => router.push('/register-step-1')} />
          <Button title="Log In" variant="outline" onPress={() => router.push('/login')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.cobalt },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontSize: 32, fontWeight: '800', color: Brand.white, textAlign: 'center' },
  tagline: { fontSize: 16, color: '#d7ddf5', textAlign: 'center' },
  actions: { gap: 14 },
});
