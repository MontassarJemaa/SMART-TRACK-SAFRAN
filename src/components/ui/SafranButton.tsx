import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

export type SafranButtonVariant = 'primary' | 'danger' | 'warning' | 'outline' | 'success';

export interface SafranButtonProps {
  label: string;
  onPress: () => void;
  variant: SafranButtonVariant;
  icon?: string;
  disabled?: boolean;
}

export function SafranButton({ disabled, icon, label, onPress, variant }: SafranButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress()}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <View style={styles.content}>
        {icon ? <Text style={[styles.icon, variant === 'outline' && styles.outlineText]}>{icon}</Text> : null}
        <Text style={[styles.label, variant === 'outline' && styles.outlineText]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  outline: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  outlineText: {
    color: COLORS.primary,
  },
  pressed: {
    opacity: 0.78,
  },
  primary: {
    backgroundColor: COLORS.primaryLight,
  },
  success: {
    backgroundColor: COLORS.success,
  },
  warning: {
    backgroundColor: COLORS.warning,
  },
});
