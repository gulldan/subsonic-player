import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MiniPlayer } from '@/components/ui';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { PlayerProvider } from '@/lib/contexts/PlayerContext';
import { I18nProvider } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const isTabsRoute = segments[0] === '(tabs)';
  const shouldHideMiniPlayer = pathname === '/player' || pathname === '/queue';
  const miniPlayerBottom = isTabsRoute ? (Platform.OS === 'web' ? 90 : insets.bottom + 54) : insets.bottom + 8;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: '#0A0A0A' } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player"
          options={{ headerShown: false, presentation: 'modal', contentStyle: { backgroundColor: '#0A0A0A' } }}
        />
        <Stack.Screen
          name="queue"
          options={{ headerShown: false, presentation: 'modal', contentStyle: { backgroundColor: '#0A0A0A' } }}
        />
        <Stack.Screen name="album/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="artist/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="playlist/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="genre/[name]" options={{ headerShown: false }} />
        <Stack.Screen name="albums" options={{ headerShown: false }} />
        <Stack.Screen name="artists" options={{ headerShown: false }} />
        <Stack.Screen name="playlists" options={{ headerShown: false }} />
        <Stack.Screen name="genres" options={{ headerShown: false }} />
        <Stack.Screen name="starred" options={{ headerShown: false }} />
      </Stack>
      {!shouldHideMiniPlayer ? (
        <MiniPlayer onPress={() => router.push('/player')} bottomOffset={miniPlayerBottom} />
      ) : null}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <PlayerProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </PlayerProvider>
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
