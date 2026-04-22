import { baseColors } from '@/theme/colors';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const detailScreenOptions = {
  presentation: 'card' as const,
  ...(Platform.OS === 'android'
    ? { animation: 'slide_from_right' as const }
    : null),
};

export default function MomentsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: baseColors.bg },
      }}
    >
      <Stack.Screen
        name="new"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={detailScreenOptions}
      />
    </Stack>
  );
}
