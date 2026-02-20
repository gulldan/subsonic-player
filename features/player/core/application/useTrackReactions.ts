import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { SubsonicClient } from '@/shared/api/subsonic/subsonic';
import type { Song } from '@/shared/api/subsonic/types';

interface UseTrackReactionsArgs {
  client: SubsonicClient | null;
  track: Song | null;
}

export function useTrackReactions({ client, track }: UseTrackReactionsArgs) {
  const queryClient = useQueryClient();
  const [isStarred, setIsStarred] = useState(Boolean(track?.starred));
  const [isDisliked, setIsDisliked] = useState(track?.rating === 1);

  useEffect(() => {
    setIsStarred(Boolean(track?.starred));
  }, [track?.starred]);

  useEffect(() => {
    setIsDisliked(track?.rating === 1);
  }, [track?.rating]);

  const toggleStar = useCallback(async () => {
    if (!client || !track) return false;

    try {
      if (isStarred) {
        await client.unstar(track.id);
        setIsStarred(false);
      } else {
        await client.star(track.id);
        setIsStarred(true);
        if (isDisliked) {
          await client.setRating(track.id, 0);
          setIsDisliked(false);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['starred'] });
      return true;
    } catch {
      return false;
    }
  }, [client, isDisliked, isStarred, queryClient, track]);

  const toggleDislike = useCallback(async () => {
    if (!track || !client) return false;
    const nextDisliked = !isDisliked;

    try {
      await client.setRating(track.id, nextDisliked ? 1 : 0);
      setIsDisliked(nextDisliked);

      if (nextDisliked && isStarred) {
        await client.unstar(track.id);
        setIsStarred(false);
        await queryClient.invalidateQueries({ queryKey: ['starred'] });
      }
    } catch {
      return false;
    }

    return true;
  }, [client, isDisliked, isStarred, queryClient, track]);

  return {
    isStarred,
    isDisliked,
    toggleStar,
    toggleDislike,
  };
}
