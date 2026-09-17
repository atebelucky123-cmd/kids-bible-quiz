import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRegistrationDraft } from '@/contexts/registration-draft-context';
import { ApiError } from '@/lib/api';

const COLOR_OPTIONS = [
  { name: 'Blue', hex: '#3498db' },
  { name: 'Green', hex: '#2ecc71' },
  { name: 'Orange', hex: Brand.orange },
  { name: 'Pink', hex: '#ff6fa5' },
  { name: 'Purple', hex: '#9b59b6' },
  { name: 'Yellow', hex: '#f1c40f' },
  { name: 'Red', hex: '#e74c3c' },
];

const ANIMAL_OPTIONS = ['Lion', 'Lamb', 'Dove', 'Elephant', 'Dog', 'Cat', 'Rabbit', 'Bird'];

// Mirrors the server's rule for instant feedback — the server always
// re-checks this for real, this is UX only.
const PASSWORD_OK = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,}$/;

export default function RegisterStep2Screen() {
  const { draft } = useRegistrationDraft();
  const { register } = useAuth();

  const [hobbies, setHobbies] = useState('');
  const [favoriteColor, setFavoriteColor] = useState<string | null>(null);
  const [favoriteAnimal, setFavoriteAnimal] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordValid = PASSWORD_OK.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit() {
    setError(null);
    if (!hobbies.trim() || !favoriteColor || !favoriteAnimal) {
      setError('Please fill in your hobbies and pick a favourite colour and animal.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please enter your password twice.');
      return;
    }
    // Check the mismatch first — it's the more fundamental problem and the
    // one most likely to actually be wrong; reporting "too short" instead
    // when two DIFFERENT short values were entered hid the real issue.
    if (password !== confirmPassword) {
      setError("Passwords don't match yet.");
      return;
    }
    if (!passwordValid) {
      setError('Password needs at least 6 letters and numbers (no symbols).');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName: draft.firstName,
        middleName: draft.middleName || undefined,
        lastName: draft.lastName,
        age: Number(draft.age),
        mobileNumber: draft.mobileNumber,
        hobbies,
        favoriteColor,
        favoriteAnimal,
        password,
      });
      // On success, AuthProvider's user state flips and Stack.Protected
      // in the root layout navigates to (app) automatically.
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'AGE_TOO_HIGH' || err.code === 'AGE_TOO_LOW')) {
        router.replace('/age-too-high');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen backgroundColor={Brand.surface}>
      <Text style={styles.title}>Your Favourites</Text>

          <Text style={styles.label}>Favourite Colour</Text>
          <View style={styles.row}>
            {COLOR_OPTIONS.map((c) => (
              <Pressable
                key={c.name}
                accessibilityLabel={c.name}
                onPress={() => setFavoriteColor(c.name)}
                style={[
                  styles.swatch,
                  { backgroundColor: c.hex },
                  favoriteColor === c.name && styles.swatchSelected,
                ]}
              />
            ))}
          </View>

          <Text style={styles.label}>Favourite Animal</Text>
          <View style={styles.row}>
            {ANIMAL_OPTIONS.map((animal) => (
              <Pressable
                key={animal}
                onPress={() => setFavoriteAnimal(animal)}
                style={[styles.pill, favoriteAnimal === animal && styles.pillSelected]}>
                <Text style={[styles.pillText, favoriteAnimal === animal && styles.pillTextSelected]}>
                  {animal}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextField label="Hobbies" value={hobbies} onChangeText={setHobbies} placeholder="Singing, football..." />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {password.length > 0 && confirmPassword.length > 0 && (
            <Text style={[styles.passwordHint, passwordsMatch && passwordValid && styles.passwordHintOk]}>
              {!passwordsMatch
                ? "Passwords don't match yet."
                : passwordValid
                  ? 'Both passwords match. Use letters and numbers.'
                  : 'Use at least 6 letters and numbers, no symbols.'}
            </Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Create My Account" variant="primary" onPress={handleSubmit} loading={submitting} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: Brand.ink, marginBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.cobalt,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: Brand.ink },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Brand.ink,
    backgroundColor: Brand.white,
  },
  pillSelected: { backgroundColor: Brand.cobalt },
  pillText: { fontWeight: '700', color: Brand.ink },
  pillTextSelected: { color: Brand.white },
  passwordHint: { fontSize: 13, color: '#8a6d00', fontWeight: '600' },
  passwordHintOk: { color: '#1a7a3c' },
  error: { fontSize: 14, color: '#c0392b', fontWeight: '600' },
});
