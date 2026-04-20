import { DatePicker } from '@/components/DatePicker';
import ModalTopBar from '@/components/ModalTopBar';
import {
  AddImageField,
  type SelectedImage,
} from '@/components/ui/AddImageField';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewMomentScreen() {
  const [momentType, setMomentType] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [photos, setPhotos] = useState<SelectedImage[]>([]);

  const momentTypeOptions = [
    { label: 'Food', value: 'food' },
    { label: 'Outfit', value: 'outfit' },
    { label: 'Tiny Joy', value: 'tiny-joy' },
    { label: 'Cozy Scene', value: 'cozy-scene' },
    { label: 'Nature', value: 'nature' },
    { label: 'Connection', value: 'connection' },
    { label: 'Personal Win', value: 'personal-win' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ModalTopBar
          color={sectionColors.moments}
          onClose={() => router.back()}
          onSave={() => {}}
          title="New Moment"
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
            <Dropdown
              color={sectionColors.moments}
              onChange={setMomentType}
              options={momentTypeOptions}
              placeholder="Moment type"
              value={momentType}
            />

            <Input
              label="Title"
              onChangeText={setTitle}
              placeholder="Give this moment a memorable title..."
              value={title}
            />

            <DatePicker
              color={sectionColors.moments}
              label="Date"
              onChange={setDate}
              required
              value={date}
            />

            <Input
              label="Description"
              minRows={4}
              onChangeText={setDescription}
              placeholder="Describe this special moment..."
              required
              value={description}
              variant="textarea"
            />

            <AddImageField
              color={sectionColors.moments}
              onChange={setPhotos}
              value={photos}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 45, 120, 0.35)',
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  form: {
    gap: space.xl,
  },
  dropdownField: {
    gap: space.sm,
  },
});
