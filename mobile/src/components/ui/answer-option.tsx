import { Pressable, StyleSheet, Text } from 'react-native';
import { Brand } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // The option the child just tapped, while it's being checked.
  selected?: boolean;
  // The correct answer, shown after a timeout or when looking back.
  revealed?: boolean;
};

export function AnswerOptionButton({ label, onPress, disabled, selected, revealed }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && !revealed && styles.optionDisabled,
        revealed && styles.optionRevealed,
      ]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionSelected: { backgroundColor: Brand.cobalt },
  optionDisabled: { opacity: 0.5 },
  optionRevealed: { backgroundColor: Brand.lime, borderWidth: 3 },
  optionText: { fontSize: 16, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  optionTextSelected: { color: Brand.white },
});
