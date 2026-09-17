import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Brand } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, secureTextEntry, ...rest }: TextFieldProps) {
  // Kids mistype passwords a lot — let them reveal what they typed rather
  // than guess from dots. Only relevant when the field is a password field
  // in the first place (secureTextEntry was passed at all).
  const [revealed, setRevealed] = useState(false);
  const isPasswordField = secureTextEntry !== undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, isPasswordField && styles.inputWithIcon, error && styles.inputError, style]}
          placeholderTextColor="#9aa0b4"
          secureTextEntry={isPasswordField ? secureTextEntry && !revealed : secureTextEntry}
          {...rest}
        />
        {isPasswordField && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={10}
            style={styles.eyeButton}>
            <Ionicons name={revealed ? 'eye-off' : 'eye'} size={22} color={Brand.cobalt} />
          </Pressable>
        )}
      </View>
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
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
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
  inputWithIcon: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: '#c0392b',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: 52,
    justifyContent: 'center',
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    fontWeight: '600',
  },
});
