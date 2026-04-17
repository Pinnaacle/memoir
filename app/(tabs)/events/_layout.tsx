import { baseColors, sectionColors } from "@/theme/colors";
import { text } from "@/theme/type";
import { Stack } from "expo-router";

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
          presentation: "modal",
          title: "New Event",
          headerTitleStyle: {
            color: sectionColors.events,
            fontFamily: text.family.bold,
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
