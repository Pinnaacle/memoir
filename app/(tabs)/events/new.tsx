import { useState } from 'react';

import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/ui/Input';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function NewEventScreen() {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date(2026, 3, 14));
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<SelectedImage[]>([]);

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
        <AddImageField
          color={sectionColors.events}
          value={photos}
          onChange={setPhotos}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: baseColors.bg,
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
});
