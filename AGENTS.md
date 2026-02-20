# AGENTS.md

## Mission
Repository standards for contributors and coding agents.
Primary goal: production-safe changes with stable architecture, predictable player UX, and verified behavior.

## Current Stack
- Runtime/package manager: `bun`
- App: Expo + React Native + Expo Router
- Language: TypeScript (`strict`)
- State/query: TanStack Query
- Lint/format: Biome
- Tests: `bun test` (+ coverage and AST checks)

## Mandatory Quality Gates
Run for every non-trivial change:

```bash
bun run check
bun run check:coverage
bun test --reporter=dot
```

What each gate means:
- `bun run check`: Biome check, TypeScript typecheck, AST duplicate-function-body check.
- `bun run check:coverage`: enforces coverage thresholds `lines >= 80%` and `funcs >= 80%` (file-average, from `coverage/lcov.info`).

Optional local run:

```bash
bun run start
```

## Source Layout (Canonical)
- `app/`: route entry points only (thin wrappers/re-exports to feature screens/layouts).
- `features/`: product features and business logic.
- `shared/`: cross-feature modules (Subsonic API client, reusable UI, i18n, theme, query client).
- `server/`: backend/proxy runtime.
- `scripts/`: project gates and engineering utilities (`check-ast.ts`, `check-coverage.ts`, build scripts).

## Layering Contract
- `app` imports from `features` only.
- `features` imports from same feature and `shared`.
- `shared` must not depend on `features` or `app`.
- `server` stays isolated from mobile feature modules.
- Avoid circular dependencies across features.
- Keep `app/*` wrappers stable and logic-free.

## Feature Structure Standard
For feature modules, keep this split when applicable:
- `screens/`: route-level composition.
- `ui/`: presentational, reusable feature UI blocks.
- `core/domain/`: pure domain rules/types.
- `core/application/`: orchestration hooks/use-cases.
- `core/infrastructure/`: adapters/platform integrations.
- `core/presentation/`: providers and state wiring.

## Player Architecture (Reference)
Current player design is the template for complex feature modules:
- Orchestration/state: `features/player/core/*`
- Presentational components: `features/player/ui/*`
- Screen composition: `features/player/screens/PlayerScreen.tsx`

Extending player actions (favorite/dislike/bookmark/share/random/queue):
1. Add behavior in `core/application` (hook/use-case).
2. Wire action in `features/player/screens/PlayerScreen.tsx` via `secondaryActions`.
3. Keep `features/player/ui/PlayerSecondaryActions.tsx` generic.
4. Add/adjust tests for new behavior and regressions.

## UI and Theme Rules
- Theme tokens are source of truth: `shared/theme/colors.ts` and feature UI constants.
- Avoid hardcoded color literals in screens/components when token exists.
- Keep controls modular (`PlayerTopBar`, `PlayerProgress`, `PlayerPrimaryControls`, etc.).
- Maintain consistent behavior across full player and mini player.
- Ensure loading/error/empty states are explicit.
- Mobile touch targets must remain comfortable (`>= 44x44` where possible).

## Subsonic/Navidrome API Rules
- API client lives in `shared/api/subsonic/*`.
- Endpoint additions/changes must include:
  1. type updates in `types.ts` (if needed),
  2. client method update in `subsonic.ts`,
  3. tests in `shared/api/subsonic/__tests__/subsonic.test.ts`,
  4. status update in `API_REVIEW.md` (API vs product UI wiring).
- Preserve backward-compatible auth/request behavior unless intentionally versioned.

## Code Quality Rules
- Avoid `any` unless unavoidable and justified.
- Prefer explicit function signatures for public hooks/helpers.
- Keep files focused; split when responsibilities diverge.
- Reuse helpers to avoid duplicated logic.
- Path alias style: `@/...`.

## Error and Security Rules
- Do not leak credentials/tokens in logs or error messages.
- Keep secure storage/session handling behavior intact.
- Convert technical failures to clear user-facing errors where relevant.
- Avoid silent failure unless behavior is explicitly best-effort.

## Testing Policy
- Unit tests: `core/domain` and pure `core/application` logic.
- Integration tests: critical playback/session flows.
- Mandatory regression tests for every playback bug fix.
- Coverage target: `>= 80%` lines and functions (enforced by script).
- AST duplication gate must stay green; investigate and refactor repeated large function bodies.

## Definition of Done
A change is done only if:
1. Architecture/layering rules are respected.
2. `bun run check` passes.
3. `bun run check:coverage` passes.
4. `bun test --reporter=dot` passes.
5. New behavior includes tests (or explicit documented exception).
6. `API_REVIEW.md` is updated when API support or UI wiring status changes.

## Refactoring Policy
- Prefer incremental refactors with passing checks at each step.
- Do not mix unrelated architectural rewrites in one patch.
- Preserve behavior while moving code; any behavior change must be covered by tests.

## Git Hygiene
- Keep diffs scoped to task goals.
- Never revert unrelated user changes.
- Avoid destructive git commands in regular workflow.
