import { getSession, onAuthStateChange } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_500Medium_Italic,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { baseColors } from '../theme/colors';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
          },
        },
      }),
  );
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_500Medium_Italic,
    PlusJakartaSans_400Regular_Italic,
  });
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    sessionReady: false,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      let nextIsSignedIn = false;

      try {
        const session = await getSession();
        nextIsSignedIn = Boolean(session);
      } catch {
        nextIsSignedIn = false;
      }

      if (isMounted) {
        setAuthState({
          isSignedIn: nextIsSignedIn,
          sessionReady: true,
        });
      }
    })();

    const unsubscribe = onAuthStateChange((_, session) => {
      setAuthState((current) => ({
        ...current,
        isSignedIn: Boolean(session),
      }));
    });

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          supabase.auth.startAutoRefresh();
          return;
        }

        supabase.auth.stopAutoRefresh();
      },
    );

    return () => {
      isMounted = false;
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  if (!loaded || !authState.sessionReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: baseColors.bg },
            }}
          >
            <Stack.Protected guard={!authState.isSignedIn}>
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="sign-up" />
            </Stack.Protected>
            <Stack.Protected guard={authState.isSignedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="events/new"
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="events/[id]"
                options={{
                  animation: 'slide_from_right',
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="moments/new"
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="moments/[id]"
                options={{
                  animation: 'slide_from_right',
                  presentation: 'card',
                }}
              />
            <Stack.Screen
              name="chapters/new"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="chapters/[id]"
              options={{
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
            </Stack.Protected>
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
