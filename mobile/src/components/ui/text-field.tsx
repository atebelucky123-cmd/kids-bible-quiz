import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Brand } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#9aa0b4"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.cobalt,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Brand.ink,
    backgroundColor: Brand.white,
  },
  inputError: {
    borderColor: '#c0392b',
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    fontWeight: '600',
  },
});
