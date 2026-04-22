import { GroupScopePicker } from '@/components/GroupScopePicker';
import { signOut } from '@/lib/auth';
import { radius } from '@/theme/radius';
import PopoverMenu from '@/components/ui/PopoverMenu';
import { Text } from '@/components/ui/Text';
import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { CircleUser } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  tagLine?: string;
  color?: string;
  height?: number;
}

export const TAB_HEADER_CONTENT_HEIGHT = 108;

export default function Header({ title, tagLine, color, height }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      Alert.alert(
        'Could not sign out',
        error instanceof Error ? error.message : 'Please try again.',
      );
      setIsSigningOut(false);
      return;
    }

    setIsSigningOut(false);
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, height ? { height } : null]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text
            aria-level={1}
            role="heading"
            style={[styles.title, { color: color ?? baseColors.text }]}
          >
            {title}
          </Text>
          <View style={styles.actions}>
            <GroupScopePicker
              color={color ?? baseColors.text}
              sheetTitle="Switch space"
              size="header"
            />
            <Pressable
              accessibilityHint="Opens account actions"
              accessibilityLabel="Open account menu"
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={() => setIsMenuOpen(true)}
              style={({ pressed }) => [
                styles.accountButton,
                pressed ? styles.accountButtonPressed : null,
                isSigningOut ? styles.accountButtonDisabled : null,
              ]}
            >
              <CircleUser color={baseColors.text} size={24} />
            </Pressable>
          </View>
        </View>
        {tagLine && <Text style={styles.tagLine}>{tagLine}</Text>}
      </View>

      <PopoverMenu
        dismissDisabled={isSigningOut}
        items={[
          {
            label: isSigningOut ? 'Signing out...' : 'Sign out',
            onPress: handleSignOut,
            disabled: isSigningOut,
            variant: 'danger',
          },
        ]}
        onClose={() => setIsMenuOpen(false)}
        visible={isMenuOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: baseColors.bg,
    paddingTop: space.lg,
  },
  headerContainer: {
    marginBottom: space.md,
    marginHorizontal: space.lg,
    gap: space.sm,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space.xs,
  },
  title: {
    color: baseColors.text,
    fontSize: textTheme.size.xxl,
    fontFamily: textTheme.family.bold,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  accountButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    justifyContent: 'center',
  },
  accountButtonPressed: {
    opacity: 0.82,
  },
  accountButtonDisabled: {
    opacity: 0.45,
  },
  tagLine: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.md,
    fontFamily: textTheme.family.regularItalic,
  },
});
