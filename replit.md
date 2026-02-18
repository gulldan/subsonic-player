# SonicWave

## Overview

SonicWave is a cross-platform music streaming client built with Expo (React Native) that connects to Subsonic-compatible music servers (Navidrome, Airsonic, etc.). It acts as a frontend for self-hosted music libraries, allowing users to browse albums, artists, playlists, and genres, search their collection, and stream music. The app supports iOS, Android, and web platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`) and React Compiler experiment
- **Routing**: File-based routing via `expo-router` v6 with typed routes. The app directory structure defines all screens:
  - `app/index.tsx` — Login/connection screen (entry point when not authenticated)
  - `app/(tabs)/` — Main tab navigation with Home, Search, Library, and Settings tabs
  - `app/player.tsx` — Full-screen music player (presented as modal)
  - `app/album/[id].tsx`, `app/artist/[id].tsx`, `app/playlist/[id].tsx` — Detail screens
  - `app/albums.tsx`, `app/artists.tsx`, `app/playlists.tsx`, `app/genres.tsx`, `app/starred.tsx` — Browse/list screens
- **State Management**: React Context for two core domains:
  - `AuthContext` — Manages server connection, credentials (stored via `expo-secure-store` on native, `AsyncStorage` on web), and the Subsonic API client instance
  - `PlayerContext` — Manages audio playback state, queue, shuffle, repeat, seeking using `expo-av`
- **Data Fetching**: TanStack React Query v5 for server state (album lists, search results, artist info, etc.)
- **Styling**: Dark theme with a gold accent color scheme defined in `constants/colors.ts`. All styling uses React Native `StyleSheet`. Font: Inter (loaded via `@expo-google-fonts/inter`)
- **Internationalization**: Custom i18n system in `lib/i18n/` supporting English, Japanese, and Russian. Locale is persisted via AsyncStorage and auto-detected from device settings
- **UI Components**: Shared components in `components/ui.tsx` including CoverArt, TrackItem, AlbumCard, ArtistCard, SectionHeader, EmptyState, Shimmer loading states, and a MiniPlayer bar
- **Animations**: `react-native-reanimated` for shimmer effects and slide-in animations

### Backend (Express Server)

- **Purpose**: The Express server serves as a CORS proxy for Subsonic API requests. This is necessary because Subsonic servers typically don't set CORS headers, preventing direct browser/app requests
- **Proxy Route**: `POST/GET /api/subsonic/:endpoint` — Forwards requests to the user's Subsonic server, passing through query parameters. The `serverUrl` query param specifies which Subsonic server to target
- **Content Handling**: The proxy handles JSON, image (cover art), and audio (streaming) responses differently, passing through appropriate content types
- **Static Serving**: In production, serves a static landing page and built Expo web assets
- **Runtime**: Uses `tsx` for development, `esbuild` for production builds

### Subsonic API Client

- **Location**: `lib/api/subsonic.ts`
- **Authentication**: Implements Subsonic token-based auth (MD5 hash of password + salt). Uses a pure JavaScript MD5 implementation (`lib/api/md5.ts`) for cross-platform compatibility
- **API Version**: Targets Subsonic API v1.16.1
- **Proxy Routing**: All API calls route through the Express backend proxy to avoid CORS issues. Falls back to direct requests if proxy is unavailable
- **Supported Endpoints**: ping, getArtists, getArtist, getArtistInfo2, getAlbum, getAlbumList2, getRandomSongs, search3, getPlaylists, getPlaylist, getGenres, getStarred2, star/unstar, stream, getCoverArt

### Database Schema

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Located in `shared/schema.ts`. Currently minimal — just a `users` table with `id`, `username`, and `password` fields
- **Usage**: The database schema exists but the app primarily uses in-memory storage (`server/storage.ts` with `MemStorage`). The actual user authentication happens against the external Subsonic server, not the local database
- **Migrations**: Drizzle Kit configured to output migrations to `./migrations` directory. Use `npm run db:push` to push schema changes

### Build & Deployment

- **Dev Mode**: Two processes run simultaneously — Expo dev server (`expo:dev` on port 8081) and Express backend (`server:dev` on port 5000). Metro config includes a proxy middleware to forward `/api/` requests from port 8081 to port 5000
- **Production Build**: Custom build script (`scripts/build.js`) that bundles the Expo web app via Metro and builds the server with esbuild
- **Replit Integration**: Environment variables like `REPLIT_DEV_DOMAIN` and `REPLIT_INTERNAL_APP_DOMAIN` are used for CORS configuration and URL resolution

## External Dependencies

### Third-Party Services
- **Subsonic-compatible Server**: The entire app depends on connecting to a user-provided Subsonic/Navidrome/Airsonic server. No built-in music content exists
- **PostgreSQL Database**: Configured via `DATABASE_URL` environment variable (required by Drizzle config but minimally used currently)

### Key NPM Packages
- **expo** (~54.0.27) — Core framework
- **expo-router** (~6.0.17) — File-based routing
- **expo-av** (^16.0.8) — Audio playback engine (native), HTMLAudioElement used on web
- **expo-secure-store** (^15.0.8) — Secure credential storage
- **lib/api/md5.ts** — Pure JS MD5 implementation for Subsonic auth tokens (avoids SubtleCrypto incompatibility on web)
- **@tanstack/react-query** (^5.83.0) — Server state management
- **drizzle-orm** (^0.39.3) — Database ORM
- **express** (^5.0.1) — Backend HTTP server
- **pg** (^8.16.3) — PostgreSQL client
- **react-native-reanimated** (~4.1.1) — Animations
- **expo-haptics** (~15.0.8) — Haptic feedback on interactions
- **expo-image** (~3.0.11) — Optimized image loading (cover art)