import { useState } from 'react';

import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Field, fieldStyles } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';

type DatePickerProps = {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  color?: string;
  required?: boolean;
};

function formatDate(date?: Date) {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePicker(props: DatePickerProps) {
  const {
    label = 'Date',
    value,
    onChange,
    placeholder = 'Pick a day',
    minimumDate,
    maximumDate,
    color = sectionColors.events,
    required,
  } = props;

  const isControlled = 'value' in props;
  const [draftDate, setDraftDate] = useState(value ?? new Date());
  const [hasDraftValue, setHasDraftValue] = useState(Boolean(value));
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = value ?? draftDate;
  const hasValue = isControlled ? value !== undefined : hasDraftValue;

  function handleChange(event: DateTimePickerEvent, nextDate?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !nextDate) {
      return;
    }

    setDraftDate(nextDate);
    setHasDraftValue(true);
    onChange?.(nextDate);
  }

  const displayValue = hasValue ? formatDate(selectedDate) : placeholder;

  return (
    <Field label={label} required={required}>
      <Pressable
        accessibilityHint="Opens the date picker"
        accessibilityRole="button"
        accessibilityState={{ expanded: showPicker }}
        onPress={() => setShowPicker((current) => !current)}
        style={({ pressed }) => [
          fieldStyles.control,
          fieldStyles.singleLine,
          styles.trigger,
          { borderColor: color },
          pressed ? styles.pressed : null,
        ]}
      >
        <Text
          style={[
            fieldStyles.controlText,
            styles.value,
            !hasValue ? fieldStyles.placeholderText : null,
          ]}
        >
          {displayValue}
        </Text>
        <CalendarDays color={color} size={20} />
      </Pressable>

      {showPicker ? (
        <View style={fieldStyles.pickerCard}>
          <DateTimePicker
            accentColor={color}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            mode="date"
            onChange={handleChange}
            textColor={baseColors.text}
            value={selectedDate}
          />
        </View>
      ) : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: baseColors.bg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.88,
  },
  value: {
    flex: 1,
    marginRight: space.md,
  },
});
