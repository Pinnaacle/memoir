import { useState } from 'react';

import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/ui/Input';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text } from '@/theme/type';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function NewEventScreen() {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date(2026, 3, 14));
  const [description, setDescription] = useState('');

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.form}>
        <Input
          label="Title"
          onChangeText={setTitle}
          placeholder="Enter milestone title..."
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
          label="Description"
          onChangeText={setDescription}
          placeholder="Describe this special moment..."
          required
          variant="textarea"
          minRows={4}
          value={description}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  hero: {
    gap: space.sm,
  },
  eyebrow: {
    color: baseColors.textSoft,
    fontFamily: text.family.medium,
    fontSize: text.size.sm,
    lineHeight: text.lineHeight.sm,
  },
  title: {
    color: baseColors.text,
    fontFamily: text.family.bold,
    fontSize: text.size.xl,
    lineHeight: text.lineHeight.xl,
  },
  description: {
    color: baseColors.textSoft,
    fontFamily: text.family.regular,
    fontSize: text.size.md,
    lineHeight: 24,
  },
  form: {
    gap: space.xl,
  },
});
