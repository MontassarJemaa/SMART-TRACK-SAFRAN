import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

export interface SafranCardProps {
  label: string;
  icon?: string;
  onPress: () => void;
}

export function SafranCard({ icon, label, onPress }: SafranCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.content}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.md,
  },
  icon: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    minWidth: 28,
  },
  label: {
    color: COLORS.textLight,
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
