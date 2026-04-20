import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { baseColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';

import { Text } from './Text';

const inputColors = {
  fill: 'rgba(255, 255, 255, 0.05)',
  text: '#f5f0ec',
  placeholder: 'rgba(245, 240, 236, 0.5)',
} as const;

type SharedInputProps = {
  label: string;
  required?: boolean;
};

type DefaultInputProps = SharedInputProps &
  React.ComponentProps<typeof TextInput> & {
    variant?: 'default';
  };

type TextareaInputProps = SharedInputProps &
  Omit<
    React.ComponentProps<typeof TextInput>,
    'multiline' | 'numberOfLines'
  > & {
    variant: 'textarea';
    minRows?: number;
    maxRows?: number;
  };

type InputProps = DefaultInputProps | TextareaInputProps;

type FieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

function Input(props: InputProps) {
  if (props.variant === 'textarea') {
    return <TextareaInput {...props} />;
  }

  return <DefaultInput {...props} />;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      {children}
    </View>
  );
}

function DefaultInput({ label, required, style, ...props }: DefaultInputProps) {
  return (
    <Field label={label} required={required}>
      <TextInput
        placeholderTextColor={inputColors.placeholder}
        selectionColor={baseColors.text}
        style={[
          fieldStyles.control,
          fieldStyles.filled,
          fieldStyles.singleLine,
          fieldStyles.singleLineText,
          styles.singleLineInput,
          style,
        ]}
        {...props}
      />
    </Field>
  );
}

function TextareaInput({
  label,
  required,
  minRows = 3,
  style,
  ...props
}: TextareaInputProps) {
  const rows = Math.max(minRows, 1);
  const verticalPadding = space.lg * 2;
  const height = rows * textTheme.lineHeight.lg + verticalPadding;

  return (
    <Field label={label} required={required}>
      <TextInput
        multiline
        numberOfLines={rows}
        placeholderTextColor={inputColors.placeholder}
        rejectResponderTermination={false}
        returnKeyType="default"
        scrollEnabled
        selectionColor={baseColors.text}
        submitBehavior="newline"
        style={[
          fieldStyles.control,
          fieldStyles.filled,
          fieldStyles.multiline,
          fieldStyles.controlText,
          { height },
          style,
        ]}
        textAlignVertical="top"
        {...props}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  label: {
    color: baseColors.text,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
  },
  control: {
    borderCurve: 'continuous',
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  filled: {
    backgroundColor: inputColors.fill,
  },
  singleLine: {
    borderRadius: radius.full,
    minHeight: 60,
  },
  singleLineInput: {
    height: 60,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  multiline: {
    borderRadius: radius.xl,
  },
  singleLineText: {
    color: inputColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.lg,
  },
  controlText: {
    color: inputColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.lg,
    lineHeight: textTheme.lineHeight.lg,
  },
  placeholderText: {
    color: inputColors.placeholder,
  },
  pickerCard: {
    backgroundColor: baseColors.card,
    borderCurve: 'continuous',
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: space.sm,
  },
});

const fieldStyles = styles;

export { Field, Input, fieldStyles };
