# API Review

Date: 2026-02-20
Scope: Navidrome Subsonic API support in this app

## Summary

- Navidrome-supported endpoints in scope: 57
- Endpoints implemented in `shared/api/subsonic/subsonic.ts`: 57/57
- Endpoints implemented in API layer but not wired into product UI flow: 23

## Source of Truth

- Navidrome Subsonic compatibility page:
  https://www.navidrome.org/docs/developers/subsonic-api/

## Implemented in API, Not Yet Wired to Product UI

The endpoints below exist in `SubsonicClient`, but do not currently have product-level UI integration (screen/action flow):

1. `getIndexes`
2. `getMusicDirectory`
3. `getSong`
4. `getArtistInfo`
5. `getAlbumInfo`
6. `getAlbumInfo2`
7. `getSimilarSongs`
8. `getSimilarSongs2`
9. `getAlbumList`
10. `getStarred`
11. `getNowPlaying`
12. `getRandomSongs`
13. `getSongsByGenre`
14. `search2`
15. `updatePlaylist`
16. `download`
17. `getLyrics`
18. `getAvatar`
19. `getPlayQueue`
20. `savePlayQueue`
21. `updateShare`
22. `getUser`
23. `getUsers`

## Notes

- This file tracks UI wiring status only.
- API layer coverage for Navidrome-supported endpoints is complete.
- OpenSubsonic extensions are implemented beyond the 57 Navidrome table endpoints.
