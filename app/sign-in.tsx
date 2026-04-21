import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { signIn } from '@/lib/auth';
import { signInSchema } from '@/lib/validation/auth';
import { getSchemaFieldErrorHelpers } from '@/lib/validation/formErrors';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { useForm } from '@tanstack/react-form';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  //For preventing spamming the button hitting rate limiting on invalid emails
  const [isCoolingDown, setIsCoolingDown] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await signIn(value.email.trim(), value.password);
    },
  });

  const submitError = form.state.errorMap.onSubmit;
  const { getFieldError } = getSchemaFieldErrorHelpers(
    signInSchema,
    form.state.values,
  );

  const handleSubmitPress = async () => {
    if (isCoolingDown) {
      return;
    }

    setIsCoolingDown(true);
    try {
      await form.handleSubmit();
    } catch {
      // TanStack Form keeps submit errors in state; suppress uncaught promise noise.
    }
    setTimeout(() => setIsCoolingDown(false), 2500);

    if (Platform.OS === 'web') return;
    if (submitError || !form.state.isValid) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your memoir.
            </Text>
          </View>

          <View style={styles.form}>
            <form.Field name="email">
              {(field) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={baseColors.textMuted}
                    selectionColor={sectionColors.timeline}
                    style={styles.input}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                  />
                  {getFieldError('email') ? (
                    <Text style={styles.errorText}>
                      {getFieldError('email')}
                    </Text>
                  ) : null}
                </View>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={baseColors.textMuted}
                    secureTextEntry
                    selectionColor={sectionColors.timeline}
                    style={styles.input}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChangeText={field.handleChange}
                  />
                  {getFieldError('password') ? (
                    <Text style={styles.errorText}>
                      {getFieldError('password')}
                    </Text>
                  ) : null}
                </View>
              )}
            </form.Field>

            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            <Button
              label={form.state.isSubmitting ? 'Signing in...' : 'Sign In'}
              color={sectionColors.timeline}
              onPress={handleSubmitPress}
              disabled={form.state.isSubmitting || isCoolingDown}
            />

            {form.state.isSubmitting ? (
              <ActivityIndicator color={sectionColors.timeline} />
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account yet? </Text>
            <Link href="/sign-up" asChild>
              <Text style={styles.footerLink}> Create one</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.xl,
  },
  header: {
    gap: space.sm,
  },
  title: {
    color: sectionColors.timeline,
    fontFamily: textTheme.family.bold,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
  },
  form: {
    gap: space.lg,
  },
  field: {
    gap: space.sm,
  },
  label: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
  },
  input: {
    backgroundColor: baseColors.card,
    borderColor: 'rgba(160,212,166,0.22)',
    borderRadius: 16,
    borderWidth: 1.5,
    color: baseColors.text,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  footerLink: {
    color: sectionColors.timeline,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
});
