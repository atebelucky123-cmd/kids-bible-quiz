import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useRegistrationDraft } from '@/contexts/registration-draft-context';

export default function RegisterStep1Screen() {
  const { draft, setDraft } = useRegistrationDraft();
  const [firstName, setFirstName] = useState(draft.firstName);
  const [middleName, setMiddleName] = useState(draft.middleName);
  const [lastName, setLastName] = useState(draft.lastName);
  const [age, setAge] = useState(draft.age);
  const [mobileNumber, setMobileNumber] = useState(draft.mobileNumber);
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !mobileNumber.trim()) {
      setError('Please fill in your name and phone number.');
      return;
    }
    const ageNum = Number(age);
    if (!age.trim() || Number.isNaN(ageNum)) {
      setError('Please enter your age.');
      return;
    }
    setDraft({ firstName, middleName, lastName, age, mobileNumber });

    // Client-side early check for a friendlier flow — the server always
    // re-validates this for real when the account is actually created.
    if (ageNum > 12 || ageNum < 5) {
      router.push('/age-too-high');
      return;
    }
    router.push('/register-step-2');
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>About You</Text>

          <TextField label="First Name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          <TextField
            label="Middle Name (optional)"
            value={middleName}
            onChangeText={setMiddleName}
            autoCapitalize="words"
          />
          <TextField label="Last Name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
          <TextField label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={2} />
          <TextField
            label="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
          />
          <Text style={styles.hint}>Ages 5 to 12 can play. A grown-up can help enter the phone number.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Next" variant="primary" onPress={handleNext} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  safeArea: { flex: 1 },
  form: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Brand.ink, marginBottom: 8 },
  hint: { fontSize: 13, color: Brand.cobalt, lineHeight: 18 },
  error: { fontSize: 14, color: '#c0392b', fontWeight: '600' },
});
