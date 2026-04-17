import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { signIn } from '@/lib/auth';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { useForm } from '@tanstack/react-form';
import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
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
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await signIn(value.email.trim(), value.password);
      router.replace('/(tabs)');
    },
  });

  const submitError = form.state.errorMap.onSubmit;

  const handleSubmitPress = async () => {
    await form.handleSubmit();

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
            <form.Field
              name="email"
              validators={{
                onSubmit: ({ value }) => {
                  if (!value.trim()) return 'Email is required.';
                  const emailPattern = /^\S+@\S+\.\S+$/;
                  return emailPattern.test(value.trim())
                    ? undefined
                    : 'Please enter a valid email.';
                },
              }}
            >
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
                  {field.state.meta.errors[0] ? (
                    <Text style={styles.errorText}>
                      {field.state.meta.errors[0]}
                    </Text>
                  ) : null}
                </View>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onSubmit: ({ value }) =>
                  value ? undefined : 'Password is required.',
              }}
            >
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
                  {field.state.meta.errors[0] ? (
                    <Text style={styles.errorText}>
                      {field.state.meta.errors[0]}
                    </Text>
                  ) : null}
                </View>
              )}
            </form.Field>

            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            <Button
              title={form.state.isSubmitting ? 'Signing in...' : 'Sign In'}
              color={sectionColors.timeline}
              onPress={handleSubmitPress}
              disabled={form.state.isSubmitting}
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
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  form: {
    gap: space.lg,
  },
  field: {
    gap: space.sm,
  },
  label: {
    color: sectionColors.timeline,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
  input: {
    backgroundColor: baseColors.card,
    borderColor: 'rgba(160,212,166,0.22)',
    borderRadius: 16,
    borderWidth: 1.5,
    color: baseColors.text,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  footerLink: {
    color: sectionColors.timeline,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
