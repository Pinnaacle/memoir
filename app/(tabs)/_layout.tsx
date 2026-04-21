import Header, { TAB_HEADER_CONTENT_HEIGHT } from '@/components/ui/Header';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { CalendarDays, Heart, House, Image, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { baseColors, sectionColors } from '../../theme/colors';
import { text } from '../../theme/type';

const headerColorByRoute: Record<string, string> = {
  index: sectionColors.timeline,
  moments: sectionColors.moments,
  events: sectionColors.events,
  chapters: sectionColors.chapters,
  memories: sectionColors.memories,
};

const headerTitleByRoute: Record<string, string> = {
  index: 'Timeline',
  moments: 'Moments',
  events: 'Events',
  chapters: 'Chapters',
  memories: 'Memories',
};

const headerTagLineByRoute: Record<string, string | undefined> = {
  index: 'Your story, one memory at a time',
  moments: 'Insert very meaningful text here',
  events: 'Insert very meaningful text here',
  chapters: 'Insert very meaningful text here',
  memories: 'A lifetime of memories',
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + TAB_HEADER_CONTENT_HEIGHT;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        sceneStyle: { backgroundColor: baseColors.bg },
        headerStyle: {
          backgroundColor: baseColors.bg,
          height: headerHeight,
        },
        header: () => (
          <Header
            title={headerTitleByRoute[route.name] ?? route.name}
            color={headerColorByRoute[route.name] ?? baseColors.text}
            height={headerHeight}
            tagLine={headerTagLineByRoute[route.name]}
          />
        ),
        tabBarActiveTintColor: sectionColors.moments,
        tabBarInactiveTintColor: baseColors.textSoft,
        tabBarLabelStyle: {
          fontFamily: text.family.medium,
          fontSize: 11,
          marginTop: -2,
          marginBottom: 8,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(13,13,13,0.95)',
          borderTopWidth: 0,
          height: 83,
          paddingTop: 6,
          paddingBottom: 18,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timeline',
          tabBarActiveTintColor: sectionColors.timeline,
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="moments"
        options={({ route }) => {
          const focusedRouteName =
            getFocusedRouteNameFromRoute(route) ?? 'index';

          return {
            title: 'Moments',
            headerShown: focusedRouteName !== '[id]',
            tabBarActiveTintColor: sectionColors.moments,
            tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
          };
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarActiveTintColor: sectionColors.events,
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: 'Chapters',
          tabBarActiveTintColor: sectionColors.chapters,
          tabBarIcon: ({ color }) => <Star color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Memories',
          tabBarActiveTintColor: sectionColors.memories,
          tabBarIcon: ({ color }) => <Image color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
