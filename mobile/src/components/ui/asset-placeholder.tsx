import { StyleSheet, Text, View } from 'react-native';

// Stands in for a custom SVG asset (star, smiley, mascot) that gets wired
// in during Phase 10. Deliberately NOT an emoji — the spec is explicit
// that custom supplied assets shouldn't be replaced with emoji, even as a
// placeholder, since that's easy to mistake for a real decision later.
export function AssetPlaceholder({ label, size = 96 }: { label: string; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c9b98a',
    backgroundColor: '#f3ead0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a7a4a',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
