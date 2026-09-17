import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';

export default function LoginScreen() {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!firstName.trim() || !password) {
      setError('Please enter your first name and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login({ firstName, password });
      // Success navigates automatically via Stack.Protected in the root layout.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen backgroundColor={Brand.surface}>
      <Text style={styles.title}>Log In</Text>

      <TextField label="First Name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Log In" variant="primary" onPress={handleLogin} loading={submitting} />

      <Link href="/register-step-1" style={styles.link}>
        <Text style={styles.linkText}>
          New here? <Text style={styles.linkTextBold}>Sign up</Text>
        </Text>
      </Link>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: Brand.ink, marginBottom: 8 },
  error: { fontSize: 14, color: '#c0392b', fontWeight: '600' },
  link: { alignSelf: 'center', marginTop: 8 },
  linkText: { fontSize: 15, color: Brand.cobalt },
  linkTextBold: { fontWeight: '800' },
});
