import { Tabs } from "expo-router";
import { CalendarDays, Heart, House, Image, Star } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "#f5f0ec",
        headerTitleStyle: {
          color: "#ff2d78",
          fontSize: 28,
          fontWeight: "700",
        },
        headerTitleAlign: "left",
        sceneStyle: { backgroundColor: "#1a1a1a" },
        tabBarActiveTintColor: "#ff2d78",
        tabBarInactiveTintColor: "#f5f0ec",
        tabBarLabelStyle: {
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
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: "Moments",
          tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: "Dates",
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: "Milestones",
          tabBarIcon: ({ color }) => <Star color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: "Memories",
          tabBarIcon: ({ color }) => <Image color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
