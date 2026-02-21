# SonicWave

Mobile music player for self-hosted Navidrome / Subsonic-compatible servers.
Runs on iOS, Android, and web. Streams music from a personal library over the network.

## What this is

A full-featured client for the [Subsonic API](https://www.navidrome.org/docs/developers/subsonic-api/).
Connects to a running [Navidrome](https://www.navidrome.org/) instance (or any Subsonic-compatible server),
authenticates, and provides playback, library browsing, search, playlists, and more.

All 57 Navidrome-supported Subsonic API endpoints are implemented.
Current UI wiring status is tracked in [API_REVIEW.md](./API_REVIEW.md).

## Features

- Full-screen player with seek, shuffle, repeat (off / all / one)
- Persistent mini-player across all screens
- Background audio playback on iOS and Android
- Play queue management (add, remove, reorder, clear)
- Star / unstar tracks, albums, artists
- Bookmarks (save and resume playback position)
- Share links (server-side share, native share sheet)
- Scrobbling (playback reported to server)
- Library browsing: albums, artists, playlists, genres
- Home screen with random, newest, and frequently played albums
- Full-text search across artists, albums, and songs
- Internet radio stations
- Playlist creation and deletion
- Library scan trigger from settings
- Localization: English, Japanese, Russian

## Tech stack

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Runtime            | Bun                                     |
| Framework          | Expo 54 + React Native 0.81            |
| Web                | React Native Web                        |
| Routing            | Expo Router 6 (file-system based)       |
| Language           | TypeScript (strict)                     |
| State / data       | TanStack React Query v5                 |
| Audio              | expo-audio                              |
| Animation          | react-native-reanimated v4              |
| Lint / format      | Biome                                   |
| Tests              | bun test                                |
| Backend proxy      | Express 5                               |
| Theme              | Tokyo Night (dark only)                 |
| Build              | EAS Build                               |

## Project structure

```
app/          Route entry points (thin re-exports to feature screens)
features/     Product features and business logic
  auth/       Login, session, credential storage
  home/       Home screen (album rows)
  library/    Albums, artists, playlists, genres, starred, bookmarks, shares, radio
  player/     Playback engine, queue, mini-player, full-screen player
  search/     Search screen
  settings/   Settings screen
shared/       Cross-feature modules
  api/        Subsonic API client (57 endpoints), types, auth
  components/ Reusable UI (cards, cover art, lists, error boundaries)
  i18n/       Localization (en, ja, ru)
  theme/      Colors, spacing, typography tokens
  query/      TanStack Query client, API request helpers
server/       Express backend (Subsonic proxy for web, static file serving)
scripts/      Quality gate scripts (AST check, coverage check, build)
```

Architecture follows Feature-Sliced Design. Layering rules:
- `app/` imports from `features/` only
- `features/` imports from same feature and `shared/`
- `shared/` never imports from `features/` or `app/`

Full architecture and contribution rules: [AGENTS.md](./AGENTS.md).

## Prerequisites

- [Bun](https://bun.sh/) installed
- A running Navidrome or Subsonic-compatible server with a music library

## Install

```bash
bun install
```

## Run (development)

Start the backend proxy and the Expo dev server in separate terminals:

```bash
# Terminal 1: backend proxy (port 5000)
bun run server:dev

# Terminal 2: Expo dev server
bun run start
```

On web, API requests are proxied through the Express backend to handle CORS.
On native (iOS/Android), the app calls the Subsonic server directly.

## Build (production)

```bash
bun run expo:static:build
bun run server:build
bun run server:prod
```

For native builds, use EAS:

```bash
bunx eas build --platform android
bunx eas build --platform ios
```

Build profiles are defined in `eas.json`.

## Quality gates

Fast check (runs on every commit via lefthook pre-commit hook):

```bash
bun run biome:fix        # Biome lint + format with auto-fix
bun run typecheck        # TypeScript type checking
```

Full verification (runs on push via lefthook pre-push hook):

```bash
bun run verify           # All fast gates in one command:
                         #   biome:ci + typecheck + AST duplicate check
                         #   + knip (dead code) + dependency-cruiser (FSD boundaries)
                         #   + bun audit (security)
```

Extended verification (manual):

```bash
bun run verify:full      # verify + tests with coverage + Playwright e2e
                         #   + a11y audit + size-limit + Lighthouse CI
```

Individual gates:

```bash
bun run check            # Biome lint + TypeScript typecheck + AST duplicate check
bun run check:coverage   # Tests + coverage enforcement (>= 80% lines and functions)
bun test --reporter=dot  # Unit tests
bun run knip             # Dead code detection (unused files, exports, dependencies)
bun run depcruise        # FSD architecture boundary enforcement
bun run audit            # Dependency vulnerability audit
bun run e2e              # Playwright visual regression tests (web)
bun run a11y             # Playwright + axe accessibility audit (web)
bun run size             # Bundle size budget check
bun run perf             # Lighthouse CI performance and accessibility scores
```

Git hooks are managed by [lefthook](https://github.com/evilmartians/lefthook).
Configuration: `lefthook.yml`.

## Configuration

| Variable             | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection (for `bun run db:push`)    |
| `EXPO_PUBLIC_DOMAIN` | API URL base for non-browser environments        |
| `PORT`               | Express server port (default: 5000)              |
| `NODE_ENV`           | `development` or `production`                    |

TypeScript path aliases:
- `@/*` -- project root
- `@shared/*` -- `shared/` directory

## Authentication

The app authenticates with MD5 token + salt per the Subsonic API specification.
Credentials are stored using `expo-secure-store` on native platforms
and `AsyncStorage` on web.

## Related documents

- [AGENTS.md](./AGENTS.md) -- architecture rules, contribution standards, definition of done
- [API_REVIEW.md](./API_REVIEW.md) -- Subsonic API implementation and UI wiring status

## License

Private project. Not published under an open-source license.
