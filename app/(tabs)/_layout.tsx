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
        headerTitleStyle: {
          color: sectionColors.moments,
          fontSize: text.size.title,
          fontFamily: text.family.heading,
        },
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
          tabBarActiveTintColor: sectionColors.timeline,
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: "Moments",
          tabBarActiveTintColor: sectionColors.moments,
          tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarActiveTintColor: sectionColors.events,
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: "Chapters",
          tabBarActiveTintColor: sectionColors.chapters,
          tabBarIcon: ({ color }) => <Star color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: "Memories",
          tabBarActiveTintColor: sectionColors.memories,
          tabBarIcon: ({ color }) => <Image color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
