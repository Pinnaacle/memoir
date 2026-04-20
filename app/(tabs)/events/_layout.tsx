import { baseColors } from '@/theme/colors';
import { Stack } from 'expo-router';

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: baseColors.bg },
        headerShadowVisible: false,
        headerTintColor: baseColors.text,
        contentStyle: { backgroundColor: baseColors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="new"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: '',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
