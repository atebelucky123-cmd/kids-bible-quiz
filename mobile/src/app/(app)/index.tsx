import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

// Placeholder — Start/Continue Quiz, stats cards, etc. are built in
// Phase 6 (Student Home & Session Management). This screen exists now
// just to prove the protected-route/login flow works end to end.
export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.greeting}>Hi {user?.firstName}! 👋</Text>
        <Text style={styles.note}>Home screen (Start/Continue Quiz) is built in Phase 6.</Text>
        <Button title="Log Out" variant="outline" onPress={logout} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  safeArea: { flex: 1, padding: 24, justifyContent: 'center', gap: 16, alignItems: 'center' },
  greeting: { fontSize: 28, fontWeight: '800', color: Brand.ink },
  note: { fontSize: 14, color: Brand.cobalt, textAlign: 'center', marginBottom: 12 },
});
