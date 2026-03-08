# SonicWave Flutter: Cross-Platform Architecture Plan

Last updated: 2026-03-07

## 1) Product Goal

Build one Flutter codebase with a unified UI/UX for:

- Android (phone-first experience)
- macOS (Arm64 + x64)
- Linux

Primary UX constraint:

- One design language everywhere (single brand UI), but adaptive layout and input behavior by available space and input method.

## 2) Why this stack

Flutter is suitable because it officially supports Android, macOS, and Linux deployment from one codebase.

Key implication:

- Code can be shared widely, but build/release setup is still platform-specific.
- iOS/macOS builds require macOS + Xcode.

## 3) Architecture approach (FSD-adapted for Flutter)

Flutter docs currently recommend a layered architecture (UI + Data, optional Domain), with MVVM (Views + ViewModels + Repositories + Services).

To keep this scalable and close to FSD ideas, use:

- Feature-first slicing (business boundaries first)
- Layered internals inside each feature (presentation/domain/data)
- Shared cross-feature core modules

### Proposed folder structure

```text
lib/
  app/
    bootstrap/
    di/
    routing/
    theme/
    app.dart

  core/
    capabilities/
    policies/
    error/
    logging/
    network/
    storage/
    ui/
    utils/

  features/
    auth/
      presentation/
      domain/
      data/
    library/
      presentation/
      domain/
      data/
    player/
      presentation/
      domain/
      data/
    search/
      presentation/
      domain/
      data/
    settings/
      presentation/
      domain/
      data/

  l10n/
```

### Dependency rules

- `app` can depend on `features` + `core`
- `features/*/presentation` depends on same feature `domain` and shared `core`
- `features/*/domain` must not depend on Flutter UI
- `features/*/data` depends on network/storage abstractions in `core`
- no cross-feature direct data/domain imports (only via app-level orchestration or shared abstractions)

## 4) UI strategy (single visual identity + adaptive layout)

### Visual consistency

- Use Material 3 as baseline design system across all platforms.
- Keep one tokenized theme (color, spacing, typography, radius, elevation).
- Keep component library in `core/ui` and never style ad hoc in screens.

### Adaptive behavior

Follow Flutter adaptive guidance:

- Branch by available window size, not device type.
- Prefer `MediaQuery.sizeOf` and `LayoutBuilder`.
- Use breakpoints for layout states.

Recommended breakpoints:

- Compact: `< 600` (Android phone primary)
- Medium: `600..1023`
- Expanded: `>= 1024`

Navigation shell example:

- Compact: `NavigationBar`
- Medium/Expanded: `NavigationRail` (or rail + detail panes)

### Input + accessibility

- Touch-first hit targets on compact layouts.
- Keyboard and mouse support on desktop/web flows.
- Use SafeArea correctly.
- Keep text scaling and high-contrast compatibility.

## 5) State management & data flow

Given requirement "minimize code and complexity":

Phase 1 default:

- `ChangeNotifier` + `ListenableBuilder` in ViewModels.
- DI via `provider` (simple and close to Flutter recommendations).

Data flow:

- Unidirectional: UI event -> ViewModel command -> Repository -> Service -> ViewModel state -> UI rebuild.

Modeling:

- Immutable domain models.
- Separate API DTOs and domain models when API complexity grows.

When complexity increases:

- Keep architecture and replace state engine selectively (e.g. Riverpod/BLoC) per feature, not as big-bang rewrite.

## 6) Navigation

- Use `go_router` for app-level navigation and deep links.
- Route ownership in `app/routing`.
- Features expose typed route builders/helpers.

## 7) Platform abstraction policy

Use `Capability` and `Policy` classes in `core`.

- Capability = what platform can do (hardware/API availability).
- Policy = what app should do (store rules/business toggles/rollout constraints).

Never branch layout logic by `Platform.isX` directly.

## 8) Quality gates

### Static quality

- `flutter analyze`
- Strict `analysis_options.yaml` with `flutter_lints`
- `dart format`

### Testing strategy

- Unit tests: domain + repositories + viewmodels
- Widget tests: screens/components with mocked viewmodels
- Integration tests: critical user flows (login, playback, queue, offline behavior)

Target baseline after MVP:

- unit/widget coverage >= 80% in critical packages
- smoke integration suite per platform class (mobile + desktop)

### Performance

- Prefer `const` widgets where possible.
- Avoid expensive rebuild scopes.
- Profile with DevTools before micro-optimizing.

## 9) Release strategy (multi-platform)

Build commands:

- Android: `flutter build appbundle` / `flutter build apk`
- iOS: `flutter build ipa`
- macOS: `flutter build macos`
- Windows: `flutter build windows`
- Linux: `flutter build linux`

CI/CD:

- PR: analyze + tests
- Main: per-platform release artifacts
- macOS runner for Apple builds/signing

## 10) Task backlog (ready to execute)

Use task IDs for tracking.

### Epic A: Foundation

- A1. Finalize package name, app id/bundle ids for all targets.
  - DoD: app ids documented for Android/iOS/macos/windows/linux.
- A2. Enable all required platforms in Flutter project.
  - DoD: project contains android/ios/macos/windows/linux folders and builds locally at least on macOS target.
- A3. Set lint/analyzer policy.
  - DoD: `analysis_options.yaml` includes `flutter_lints`; CI fails on analyzer errors.
- A4. Add formatting + analysis scripts.
  - DoD: `dart format --set-exit-if-changed .` and `flutter analyze` wired into CI.

### Epic B: Architecture skeleton

- B1. Implement folder skeleton (`app/core/features`).
  - DoD: initial feature modules created with `presentation/domain/data`.
- B2. Introduce dependency injection root.
  - DoD: app bootstraps dependencies from one place (`app/di`).
- B3. Add app router with `go_router`.
  - DoD: shell routes work on startup; deep-link smoke test passes.
- B4. Add `Capability`/`Policy` core abstractions.
  - DoD: one real policy + one capability used in app.

### Epic C: Design system & adaptive shell

- C1. Build design tokens (theme, spacing, typography, radii).
  - DoD: all base screens use tokens only.
- C2. Create adaptive app shell with breakpoints.
  - DoD: compact uses bottom nav; wider widths use rail.
- C3. Implement core reusable widgets (`AppScaffold`, buttons, inputs, cards, empty/error/loading states).
  - DoD: at least 80% of new UI uses shared components.
- C4. Accessibility pass for base shell.
  - DoD: keyboard nav works on desktop; text scale and semantics verified.

### Epic D: Auth + server setup

- D1. Login screen (server URL, user/pass, validation).
  - DoD: form validation and user-friendly errors.
- D2. Secure credential storage abstraction.
  - DoD: credentials persisted and restored safely.
- D3. Connection test flow (`ping`).
  - DoD: success/failure handling and retry path implemented.
- D4. Multiple server profiles (optional MVP+).
  - DoD: create/select/remove profiles.

### Epic E: Subsonic API layer

- E1. HTTP service client + interceptors/logging strategy.
  - DoD: API client test harness available.
- E2. Auth/token generation implementation.
  - DoD: parity with Subsonic auth behavior.
- E3. Repository interfaces + implementations.
  - DoD: repositories return domain models, not raw DTOs.
- E4. Error mapping and retry policy.
  - DoD: network/HTTP/domain errors mapped to user-facing states.

### Epic F: Playback MVP

- F1. Playback domain model + queue state.
  - DoD: deterministic queue operations covered by unit tests.
- F2. Audio engine integration abstraction.
  - DoD: play/pause/seek/next/prev works on macOS + Android.
- F3. Full player screen + mini player.
  - DoD: synchronized controls and progress updates.
- F4. Background playback policies by platform.
  - DoD: documented behavior per platform and smoke-tested.

### Epic G: Library/search UX

- G1. Home/library browsing screens.
  - DoD: load/error/empty states implemented.
- G2. Search screen.
  - DoD: debounced search with pagination/infinite scrolling.
- G3. Album/artist/playlist details.
  - DoD: navigation and track actions wired.

### Epic H: Testing & reliability

- H1. Unit tests for domain and repositories.
  - DoD: core business logic coverage target met.
- H2. Widget tests for major screens.
  - DoD: login, shell navigation, player controls tested.
- H3. Integration smoke flows.
  - DoD: login -> browse -> play flow automated.
- H4. Crash/error reporting integration.
  - DoD: uncaught error path captured and observable.

### Epic I: Platform release hardening

- I1. Android signing + release pipeline.
  - DoD: internal test distribution working.
- I2. Apple signing/notarization pipeline.
  - DoD: macOS release app signed; iOS TestFlight upload documented.
- I3. Windows/Linux packaging.
  - DoD: reproducible release artifacts generated in CI.
- I4. Versioning/release notes automation.
  - DoD: semantic versioning + changelog workflow in CI.

## 11) Recommended implementation order

1. A -> B -> C (foundation, architecture, adaptive shell)
2. D -> E (auth and API backbone)
3. F (playback MVP)
4. G (library/search)
5. H + I in parallel after MVP is stable

## 12) Definition of Done (project-level)

A task/feature is done only if:

- it follows app/core/features dependency rules;
- adaptive behavior is verified on compact and expanded layouts;
- accessibility checks are passed for keyboard and semantics;
- unit/widget/integration tests are updated;
- analyzer and formatting are clean;
- release impact and platform notes are documented.

## 13) Official recommendations audit (Flutter/Dart, checked 2026-03-07)

This section maps our plan to current official guidance.

### Architecture and app structure

- Keep explicit UI layer and data layer; this is a strong recommendation.
- Use repository + service in data layer.
- Use View + ViewModel (MVVM) in UI layer and keep widgets "dumb".
- Keep logic out of widgets except simple rendering/layout/routing conditions.
- Use unidirectional data flow.
- Use immutable models.
- Use DI (`provider`) and navigation (`go_router`) as default choices.

What this means for us:

- The `app/core/features` structure remains valid.
- Our FSD-style boundaries should be enforced with import rules and review checklists.
- Domain layer is optional and used only where complexity justifies it.

### Adaptive UI and one-interface strategy

- Branch by available window size, not by device type.
- Prefer `MediaQuery.sizeOf` for window-level decisions and `LayoutBuilder` for local layout decisions.
- Flutter docs cite Material guidance: bottom navigation under 600 logical px, rail at 600+.
- Do not use orientation as the primary strategy for organizing UI; size-based adaptation is preferred.
- Support non-touch inputs (keyboard, hover, shortcuts, focus traversal) for desktop quality.

What this means for us:

- One visual system, multiple layout shells by width class.
- Android phone remains first-class in compact layout.
- Desktop quality is not "mobile stretched to large screen"; add keyboard and pointer UX explicitly.

### State management policy

- Flutter docs mark `ChangeNotifier`/`Listenable` as a valid conditional default.
- Official docs explicitly state state management is context-dependent, and package choice is team/app specific.
- Case study confirms architecture principles can be preserved even if state engine changes (Riverpod/BLoC/signals/streams).

What this means for us:

- Start with `ChangeNotifier` + `provider` to minimize rewrite complexity.
- Define a replacement seam so features can later migrate to Riverpod/BLoC without a project-wide rewrite.

### Testing strategy

- Official guidance favors many unit/widget tests plus enough integration tests for critical flows.
- Tradeoff is explicit: integration tests provide highest confidence but are slowest and most expensive to maintain.

What this means for us:

- Keep most coverage in unit + widget tests.
- Keep a small integration smoke suite for critical paths (`login -> browse -> play`).

### Performance and code quality

- Control `build()` cost: avoid heavy work in build and split large widgets.
- Prefer `const` constructors where possible.
- For large lists/grids, use lazy builders (`ListView.builder`, etc.).
- Keep lint discipline (`flutter_lints`) and follow Effective Dart rules with analyzer enforcement.

What this means for us:

- Add performance checks to PR review template.
- Treat lint warnings as actionable debt, not optional cleanup.

## 14) Cross-compilation reality check

Important: Flutter gives one codebase, but not "build everything from one host OS".

- Android/Web: can be targeted from any host.
- iOS/macOS: require macOS toolchain.
- Windows: requires Windows host tooling.
- Linux: requires Linux host tooling.

Implementation consequence:

- Local dev on macOS can cover Android + iOS + macOS.
- CI must use a matrix of host runners for full release output:
  - macOS runner: iOS + macOS (+ optional Android)
  - Windows runner: Windows
  - Linux runner: Linux

## 15) Prioritized execution tasks (ready for issue tracker)

Use these IDs as direct tickets.

### P0 (must-have foundation)

- FW-001: Enable all target platforms in project and validate local macOS build.
  - DoD: `android/ios/macos/windows/linux` enabled; `flutter build macos` green locally.
- FW-002: Add architecture skeleton (`app/core/features`) with import boundary rules.
  - DoD: feature template exists with `presentation/domain/data`; boundaries documented.
- FW-003: Configure static quality gates (`dart format`, `flutter analyze`, tests) in CI.
  - DoD: PR pipeline blocks on analyzer or test failure.
- FW-004: Implement adaptive shell with width breakpoints (`<600`, `600+`).
  - DoD: compact uses bottom nav; medium/expanded uses rail.
- FW-005: Implement auth bootstrap (server URL + credentials + ping check + clear errors).
  - DoD: user can save server and verify connectivity.
- FW-006: Implement Subsonic client base (auth signing, basic endpoints, error mapping).
  - DoD: API integration tests pass for login + library bootstrap endpoints.
- FW-007: Playback MVP on macOS + Android abstraction layer.
  - DoD: play/pause/seek/next/prev work in both targets.

### P1 (product completeness)

- FW-008: Unified design system tokens and reusable UI primitives.
  - DoD: no ad-hoc styling on feature screens for core UI elements.
- FW-009: Library/home/search/detail flows with load/error/empty states.
  - DoD: user can browse, search, open details, and queue playback.
- FW-010: Accessibility and desktop input pass.
  - DoD: keyboard traversal, shortcuts, hover/focus states implemented for primary flows.
- FW-011: Widget + unit test expansion to target coverage baseline.
  - DoD: critical features covered; coverage trend tracked in CI.
- FW-012: Integration smoke tests for core flow.
  - DoD: automated scenario `login -> browse -> play`.

### P2 (release hardening)

- FW-013: Multi-host CI matrix (macOS/Windows/Linux) and artifact publishing.
  - DoD: all desktop artifacts are produced from CI.
- FW-014: Signing/distribution pipelines (Play internal, TestFlight, macOS signed app, Windows/Linux packages).
  - DoD: documented and reproducible release process.
- FW-015: Observability (crash reporting + structured logging).
  - DoD: production failures are traceable with actionable context.
- FW-016: Optional migration seam for advanced state management per feature.
  - DoD: one pilot feature can switch state engine without touching other features.

## 16) Source links (official + primary)

- Flutter architecture recommendations: <https://docs.flutter.dev/app-architecture/recommendations>
- Flutter app architecture guide: <https://docs.flutter.dev/app-architecture/guide>
- Flutter architecture case study (Compass): <https://docs.flutter.dev/app-architecture/case-study>
- Adaptive general approach: <https://docs.flutter.dev/ui/adaptive-responsive/general>
- Adaptive capabilities/policies: <https://docs.flutter.dev/ui/adaptive-responsive/capabilities>
- Adaptive input/accessibility: <https://docs.flutter.dev/ui/adaptive-responsive/input>
- Orientation cookbook note (size-first): <https://docs.flutter.dev/cookbook/design/orientation>
- Platform integration + host setup constraints: <https://docs.flutter.dev/platform-integration>
- Supported platforms matrix: <https://docs.flutter.dev/reference/supported-platforms>
- Flutter testing overview: <https://docs.flutter.dev/testing/overview>
- Flutter performance best practices: <https://docs.flutter.dev/perf/best-practices>
- Flutter state management options: <https://docs.flutter.dev/data-and-backend/state-mgmt/options>
- Dart Effective Dart: <https://dart.dev/effective-dart>
- `flutter_lints` package: <https://pub.dev/packages/flutter_lints>
- `go_router` package: <https://pub.dev/packages/go_router>
