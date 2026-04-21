import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import * as Slot from '@rn-primitives/slot';
import * as React from 'react';
import {
  Text as RNText,
  StyleSheet,
  type Role,
  type TextStyle,
} from 'react-native';

type TextVariant =
  | 'default'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'large'
  | 'small'
  | 'muted';

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const variantStyles: Record<TextVariant, TextStyle> = {
  default: {},
  h1: {
    fontFamily: textTheme.family.bold,
    fontSize: textTheme.size.xxl,
    lineHeight: textTheme.lineHeight.xxl,
    textAlign: 'center',
    letterSpacing: -1,
  },
  h2: {
    fontFamily: textTheme.family.bold,
    fontSize: textTheme.size.xl,
    lineHeight: textTheme.lineHeight.xl,
    borderBottomColor: baseColors.border,
  },
  h3: {
    fontFamily: textTheme.family.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  h4: {
    fontFamily: textTheme.family.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  p: {
    marginTop: space.md,
    lineHeight: textTheme.lineHeight.md,
  },
  large: {
    fontFamily: textTheme.family.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  small: {
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.xs,
    lineHeight: 16,
  },
  muted: {
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    color: baseColors.textMuted,
  },
};

const TextColorContext = React.createContext<string | undefined>(undefined);

function Text({
  style,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> & {
  asChild?: boolean;
  variant?: TextVariant;
}) {
  const contextColor = React.useContext(TextColorContext);
  const Component = asChild ? Slot.Text : RNText;

  return (
    <Component
      style={[
        styles.base,
        contextColor ? { color: contextColor } : null,
        variantStyles[variant],
        style,
      ]}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: baseColors.text,
    fontFamily: textTheme.family.regular,
    fontSize: textTheme.size.md,
    lineHeight: textTheme.lineHeight.md,
  },
});

export { Text, TextColorContext };
