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
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
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
  const [sessionReady, setSessionReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const session = await getSession();
        if (isMounted) {
          setIsSignedIn(Boolean(session));
        }
      } finally {
        if (isMounted) {
          setSessionReady(true);
        }
      }
    })();

    const unsubscribe = onAuthStateChange((_, session) => {
      setIsSignedIn(Boolean(session));
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

  if (!loaded || !sessionReady) {
    return null;
  }

  const currentRootSegment = segments[0];
  const inAuthFlow =
    currentRootSegment === 'sign-in' || currentRootSegment === 'sign-up';
  const isNotFoundRoute = currentRootSegment === '+not-found';

  if (!isSignedIn && !inAuthFlow && !isNotFoundRoute) {
    return <Redirect href="/sign-in" />;
  }

  if (isSignedIn && inAuthFlow) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: baseColors.bg },
          }}
        >
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
