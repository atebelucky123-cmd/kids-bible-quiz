import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

export function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  value: { fontSize: 28, fontWeight: '800', color: Brand.cobalt },
  label: { fontSize: 13, fontWeight: '600', color: Brand.ink, textAlign: 'center' },
});
