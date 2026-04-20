import { useState } from 'react';

import ModalTopBar from '@/components/ModalTopBar';
import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import Chip from '@/components/ui/Chip';
import { DatePicker } from '@/components/DatePicker';
import { Field, Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { baseColors, sectionColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

const EVENT_TYPE_OPTIONS = [
  'Date night',
  'Anniversary',
  'Adventure',
  'Celebration',
] as const;

const MOOD_OPTIONS = [
  'Magical',
  'Romantic',
  'Adventurous',
  'Cozy',
  'Spontaneous',
  'Dreamy',
] as const;

export default function NewEventScreen() {
  const [eventType, setEventType] = useState<string | null>(null);
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date(2026, 3, 14));
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState<string>('Romantic');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<SelectedImage[]>([]);

  return (
    <View style={styles.container}>
      <ModalTopBar
        color={sectionColors.events}
        onClose={() => router.back()}
        title="New Event"
      />
      <View style={styles.headerDivider} />

      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.dropdownField}>
            <Pressable
              accessibilityHint="Opens the event type options"
              accessibilityLabel="Event type"
              accessibilityRole="button"
              accessibilityState={{ expanded: isEventTypeOpen }}
              onPress={() => setIsEventTypeOpen((current) => !current)}
              style={({ pressed }) => [
                styles.dropdownTrigger,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.dropdownValue}>
                {eventType ?? 'Event type'}
              </Text>
              <ChevronDown color="#1a1512" size={20} />
            </Pressable>

            {isEventTypeOpen ? (
              <View style={styles.dropdownMenu}>
                {EVENT_TYPE_OPTIONS.map((option) => {
                  const isSelected = option === eventType;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setEventType(option);
                        setIsEventTypeOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownOption,
                        isSelected ? styles.dropdownOptionSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionLabel,
                          isSelected
                            ? styles.dropdownOptionLabelSelected
                            : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
          <Input
            label="Title"
            onChangeText={setTitle}
            placeholder="Give this date a memorable title..."
            required
            value={title}
          />
          <DatePicker
            color={sectionColors.events}
            label="Date"
            onChange={setEventDate}
            required
            value={eventDate}
          />
          <Input
            label="Location"
            onChangeText={setLocation}
            placeholder="Where did this take place?"
            required
            value={location}
          />
          <Field label="Mood">
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  color={sectionColors.events}
                  isSelected={mood === option}
                  label={option}
                  setIsSelected={() => setMood(option)}
                  style={styles.moodChip}
                />
              ))}
            </View>
          </Field>
          <Input
            label="Description"
            onChangeText={setDescription}
            placeholder="Describe this special moment..."
            required
            variant="textarea"
            minRows={4}
            value={description}
          />
          <AddImageField
            color={sectionColors.events}
            value={photos}
            onChange={setPhotos}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(168, 155, 255, 0.35)',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  form: {
    gap: space.xl,
  },
  pressed: {
    opacity: 0.9,
  },
  dropdownField: {
    gap: space.sm,
  },
  dropdownTrigger: {
    minHeight: 36,
    borderRadius: radius.full,
    backgroundColor: sectionColors.events,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: '#1a1512',
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  dropdownMenu: {
    backgroundColor: baseColors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(168, 155, 255, 0.25)',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(168, 155, 255, 0.12)',
  },
  dropdownOptionLabel: {
    color: baseColors.text,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  dropdownOptionLabelSelected: {
    color: sectionColors.events,
    fontFamily: textTheme.family.semiBold,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.sm,
  },
  moodChip: {
    width: '48%',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
