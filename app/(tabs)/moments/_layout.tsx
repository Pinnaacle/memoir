import { Stack } from "expo-router";

export default function MomentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
