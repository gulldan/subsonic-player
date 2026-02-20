import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { IS_ANDROID } from '@/features/player/core/domain/constants';
import type { Song } from '@/shared/api/subsonic/types';

const PLAYER_NOTIFICATION_CHANNEL_ID = 'player-status';
const PLAYER_NOTIFICATION_ID = 'player-status-now-playing';

export function usePlayerNotification(currentTrack: Song | null, isPlaying: boolean): void {
  const notificationReadyRef = useRef(false);
  const notificationPermissionRequestedRef = useRef(false);

  const ensureNotificationReady = useCallback(async () => {
    if (!IS_ANDROID) return false;
    if (notificationReadyRef.current) return true;

    try {
      let permissions = await Notifications.getPermissionsAsync();
      if (!permissions.granted && !notificationPermissionRequestedRef.current) {
        notificationPermissionRequestedRef.current = true;
        permissions = await Notifications.requestPermissionsAsync();
      }
      if (!permissions.granted) return false;

      await Notifications.setNotificationChannelAsync(PLAYER_NOTIFICATION_CHANNEL_ID, {
        name: 'Player Status',
        importance: Notifications.AndroidImportance.LOW,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: false,
        enableVibrate: false,
      });
      notificationReadyRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const syncNotification = useCallback(async () => {
    if (!IS_ANDROID) return;

    try {
      if (!currentTrack || !isPlaying) {
        await Notifications.dismissNotificationAsync(PLAYER_NOTIFICATION_ID).catch(() => {});
        return;
      }

      const isReady = await ensureNotificationReady();
      if (!isReady) return;

      await Notifications.dismissNotificationAsync(PLAYER_NOTIFICATION_ID).catch(() => {});
      await Notifications.scheduleNotificationAsync({
        identifier: PLAYER_NOTIFICATION_ID,
        content: {
          title: currentTrack.title,
          body: currentTrack.artist ?? 'SonicWave',
          subtitle: currentTrack.album ?? undefined,
          data: { trackId: currentTrack.id, source: 'player' },
          sticky: true,
          autoDismiss: false,
          sound: false,
        },
        trigger: { channelId: PLAYER_NOTIFICATION_CHANNEL_ID },
      });
    } catch {}
  }, [currentTrack, ensureNotificationReady, isPlaying]);

  useEffect(() => {
    void syncNotification();
  }, [syncNotification]);

  useEffect(() => {
    return () => {
      if (IS_ANDROID) {
        Notifications.dismissNotificationAsync(PLAYER_NOTIFICATION_ID).catch(() => {});
      }
    };
  }, []);
}
