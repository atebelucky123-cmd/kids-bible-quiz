import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { Brand } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline';

type ButtonProps = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Brand.ink : Brand.ink} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: Brand.ink,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.ink,
  },
  outlineText: {
    color: Brand.ink,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: Brand.orange },
  secondary: { backgroundColor: Brand.lime },
  outline: { backgroundColor: Brand.white },
});
