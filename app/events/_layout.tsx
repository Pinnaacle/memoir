import { baseColors } from '@/theme/colors';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

const detailScreenOptions = {
  presentation: 'card' as const,
  ...(Platform.OS === 'android'
    ? { animation: 'slide_from_right' as const }
    : null),
};

export default function EventsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: baseColors.bg },
      }}
    >
      <Stack.Screen
        name="new"
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={detailScreenOptions}
      />
    </Stack>
  );
}
