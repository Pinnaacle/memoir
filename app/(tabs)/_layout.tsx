import { Tabs } from "expo-router";
import { CalendarDays, Heart, House, Image, Star } from "lucide-react-native";
import { baseColors, sectionColors } from "../../theme/colors";
import { text } from "../../theme/type";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: baseColors.bg },
        headerShadowVisible: false,
        headerTintColor: baseColors.text,
        headerTitleAlign: "left",
        sceneStyle: { backgroundColor: baseColors.bg },
        tabBarActiveTintColor: sectionColors.moments,
        tabBarInactiveTintColor: baseColors.textSoft,
        tabBarLabelStyle: {
          fontFamily: text.family.label,
          fontSize: 11,
          marginTop: -2,
          marginBottom: 8,
        },
        tabBarStyle: {
          backgroundColor: "rgba(13,13,13,0.95)",
          borderTopWidth: 0,
          height: 83,
          paddingTop: 6,
          paddingBottom: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Timeline",
          headerTitleStyle: {
            color: sectionColors.timeline,
            fontSize: text.size.title,
          },
          tabBarActiveTintColor: sectionColors.timeline,
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: "Moments",
          headerTitleStyle: {
            color: sectionColors.moments,
            fontSize: text.size.title,
            fontFamily: text.family.heading,
          },
          tabBarActiveTintColor: sectionColors.moments,
          tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          headerTitleStyle: {
            color: sectionColors.events,
            fontSize: text.size.title,
            fontFamily: text.family.heading,
          },
          tabBarActiveTintColor: sectionColors.events,
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: "Chapters",
          headerTitleStyle: {
            color: sectionColors.chapters,
            fontSize: text.size.title,
            fontFamily: text.family.heading,
          },
          tabBarActiveTintColor: sectionColors.chapters,
          tabBarIcon: ({ color }) => <Star color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: "Memories",
          headerTitleStyle: {
            color: sectionColors.memories,
            fontSize: text.size.title,
            fontFamily: text.family.heading,
          },
          tabBarActiveTintColor: sectionColors.memories,
          tabBarIcon: ({ color }) => <Image color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
