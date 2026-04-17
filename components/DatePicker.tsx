import { useEffect, useState } from "react";

import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Text } from "@/components/ui/Text";
import { baseColors, sectionColors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { space } from "@/theme/space";
import { text as textTheme } from "@/theme/type";
import { CalendarDays } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";

type DatePickerProps = {
  label?: string;
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

function formatDate(date?: Date) {
  return date ? date.toLocaleDateString() : "";
}

export function DatePicker({
  label = "Date",
  value,
  onChange,
  placeholder = "Pick a day",
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value ?? new Date());
  const [hasSelection, setHasSelection] = useState(Boolean(value));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!value) {
      setHasSelection(false);
      return;
    }

    setSelectedDate(value);
    setHasSelection(true);
  }, [value]);

  function handleChange(event: DateTimePickerEvent, nextDate?: Date) {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "dismissed" || !nextDate) {
      return;
    }

    setSelectedDate(nextDate);
    setHasSelection(true);
    onChange?.(nextDate);
  }

  const displayValue = hasSelection ? formatDate(selectedDate) : placeholder;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityHint="Opens the date picker"
        accessibilityRole="button"
        accessibilityState={{ expanded: showPicker }}
        onPress={() => setShowPicker((current) => !current)}
        style={({ pressed }) => [
          styles.trigger,
          pressed ? styles.triggerPressed : null,
        ]}
      >
        <Text style={[styles.value, !hasSelection ? styles.placeholder : null]}>
          {displayValue}
        </Text>
        <CalendarDays color={sectionColors.events} size={18} />
      </Pressable>

      {showPicker ? (
        <View style={styles.pickerCard}>
          <DateTimePicker
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            mode="date"
            onChange={handleChange}
            value={selectedDate}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  label: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  trigger: {
    alignItems: "center",
    backgroundColor: baseColors.card,
    borderColor: baseColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  triggerPressed: {
    opacity: 0.88,
  },
  value: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.md,
  },
  placeholder: {
    color: baseColors.textMuted,
  },
  pickerCard: {
    backgroundColor: baseColors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: space.sm,
  },
});
