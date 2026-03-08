# SonicWave Flutter

Flutter rewrite skeleton for SonicWave with macOS-first delivery and shared architecture for multi-platform rollout.

## Current Scope (implemented)

- Login flow with Subsonic credentials and session bootstrap.
- Route transitions `login -> app shell` via `go_router`.
- Desktop-first shell UI for macOS with sections:
  - `Music`
  - `Collections`
  - `Playlists`
  - `Settings`
- Real audio playback wired via `just_audio` with queue/next/previous/play/pause/seek.
- Player actions wired to Subsonic/Navidrome API:
  - shuffle
  - repeat (off/all/one)
  - favorite/unfavorite
  - dislike
  - star rating
  - scrobble
- Desktop adaptive layout without forced vertical scrolling in main shell.
- Subsonic API client with:
  - auth signing (`u`, `t`, `s`, `v`, `c`)
  - universal endpoint invocation via `call(endpoint, params)`
  - media URL builders (`stream`, `getCoverArt`)
  - typed endpoints used by app shell:
    - `getRandomSongs`
    - `getAlbumList2`
    - `getPlaylists`
    - `getPlaylistSongs`
    - `getAlbumSongs`
    - `searchSongs`
    - `star` / `unstar`
    - `setRating`
    - `scrobble`
- Unit + widget tests with coverage run.

## Run on macOS

```bash
cd flutter_sonicwave
flutter run -d macos
```

## Build macOS app

```bash
cd flutter_sonicwave
flutter build macos
```

## Quality Gates

```bash
cd flutter_sonicwave
flutter analyze
flutter test
flutter test --coverage
```

## Coverage Quick Check

```bash
cd flutter_sonicwave
awk 'BEGIN{lf=0;lh=0} /^LF:/{lf+=substr($0,4)} /^LH:/{lh+=substr($0,4)} END{printf("Lines: %d/%d (%.2f%%)\\n", lh, lf, (lf?lh/lf*100:0))}' coverage/lcov.info
```

## Next Planned Steps

1. Expand typed Subsonic wrappers for frequently used endpoints.
2. Add secure credential storage (Keychain-backed for macOS/iOS).
3. Wire real audio playback engine and queue behavior.
4. Add library/search screens and adaptive layouts for wider desktop states.
