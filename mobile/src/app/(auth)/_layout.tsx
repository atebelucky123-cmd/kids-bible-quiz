import { Stack } from 'expo-router';
import { RegistrationDraftProvider } from '@/contexts/registration-draft-context';

export default function AuthLayout() {
  return (
    <RegistrationDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistrationDraftProvider>
  );
}
