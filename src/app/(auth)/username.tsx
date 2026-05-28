import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafranButton } from '@/components/ui/SafranButton';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function UsernameScreen() {
  const router = useRouter();
  const { saveUsername } = useAuth();
  const [value, setValue] = useState('');

  async function handleContinue() {
    if (!value.trim()) {
      return;
    }

    await saveUsername(value);
    router.replace('/menu' as never);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setValue}
          placeholder="Entrez votre nom d'utilisateur"
          placeholderTextColor={COLORS.neutral}
          style={styles.input}
          value={value}
        />
        <SafranButton
          disabled={!value.trim()}
          label="CONTINUER"
          onPress={handleContinue}
          variant="warning"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: SPACING.lg,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  title: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    textAlign: 'center',
  },
});
