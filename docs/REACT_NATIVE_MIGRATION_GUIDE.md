# React Native Migration Guide (Flagship Plan)

This document defines the full migration approach for adding a high-performance Android app to the existing Renters project.

## 1. Scope and Goal

### Goal
Build a production-grade React Native Android app (APK first, Play Store later) while keeping:
- Existing web app (`client/`)
- Existing backend (`server/`)

### Primary constraints
- Performance-first architecture
- Shared business rules and API contracts across web and mobile
- No backend rewrite
- PNPM-first workflow

### Non-goals (initial phase)
- Replacing the existing web app
- Full mobile admin panel on day one
- iOS release before Android stability

## 2. Current Baseline (as of 2026-02-26)

- Frontend: React + Vite + Tailwind + React Router
- Backend: Express + MongoDB + Socket.IO
- API usage pattern is mixed:
  - Some calls use `VITE_API_BASE_URL`
  - Many calls use relative `/api/...`
- Web-specific features exist (service worker, manifest, browser storage assumptions)

Implication: mobile app must be a separate client, not a web-to-native wrapper for long-term performance.

## 3. Target Architecture

## 3.1 Repository layout (recommended)

```txt
Renters/
  client/                     # Existing web app
  server/                     # Existing backend
  mobile/                     # New React Native app (Expo)
  packages/
    api-contracts/            # Shared TS types + Zod schemas
    api-client/               # Shared HTTP client (optional, pure TS)
    domain/                   # Shared pure business logic (optional)
```

## 3.2 Runtime architecture

- Mobile app talks to hosted backend over HTTPS
- Backend remains single source of truth
- Auth token lifecycle designed for native app usage
- Shared contracts enforce API compatibility

## 4. Required Backend Changes Before Mobile Scale

## 4.1 API contract standardization

Adopt one response envelope everywhere:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  },
  "meta": {
    "requestId": "..."
  }
}
```

## 4.2 API versioning

- Introduce `/api/v1/...` routes
- Freeze contract changes per version
- Avoid breaking web and mobile clients together

## 4.3 Authentication hardening for mobile

Recommended:
- Access token: short-lived (in memory on client)
- Refresh token: secure device storage strategy
- Refresh endpoint with rotation
- Clear token invalidation and logout semantics

Minimum requirements:
- No reliance on `localStorage`-specific assumptions on server behavior
- No auth based on client-provided `x-user-id` alone
- Consistent `401/403` handling and error codes

## 4.4 CORS and security

- Add explicit production origins (web + mobile backend consumer domains)
- Keep `credentials` policy consistent with chosen auth strategy
- Enforce strict rate limiting and request-id tracing on auth-sensitive routes

## 4.5 Upload/media flow

- Keep upload contract stable (`multipart` or signed URL approach)
- Define max file size, file types, timeout, retry policy
- Add deterministic error codes for upload failures

## 5. Shared Contracts Strategy

Create `packages/api-contracts` with:
- Endpoint request/response DTOs
- Zod schemas for runtime validation
- Shared enums and constants (error codes, status values)

Example package structure:

```txt
packages/api-contracts/
  src/
    auth.ts
    property.ts
    user.ts
    common.ts
    index.ts
  package.json
  tsconfig.json
```

Consumption:
- Backend validates request/response using same schemas
- Web and mobile import same types to reduce drift

## 6. React Native Project Requirements

## 6.1 Local environment (Windows)

- Node.js 20+
- PNPM
- JDK 17
- Android Studio (latest stable)
- Android SDK (platform + build tools)
- One emulator + one real Android device for testing

Validation commands:

```bash
node -v
pnpm -v
java -version
adb --version
```

## 6.2 Mobile stack

- Expo + React Native + TypeScript
- Navigation: React Navigation (or Expo Router)
- Server state: TanStack Query
- HTTP client: Axios
- Forms + validation: React Hook Form + Zod
- Local secure storage: Expo Secure Store or MMKV
- Lists: FlashList
- Maps: react-native-maps
- Realtime: socket.io-client
- Animations: Reanimated + Gesture Handler
- Images: expo-image
- Crash reporting: Sentry

## 6.3 Performance defaults

- Hermes enabled
- New architecture enabled
- Keep screens virtualization-safe
- Avoid unbounded list rendering
- Memoize expensive components/selectors
- Use paginated APIs for lists

## 7. Implementation Plan (Execution Order)

## Phase 0: Backend and contracts (no mobile UI yet)

Deliverables:
- `/api/v1` routing introduced
- Unified response and error shape
- Auth strategy finalized for native app
- `packages/api-contracts` created and integrated

Exit criteria:
- Swagger/OpenAPI updated
- Web app still passes smoke tests
- At least auth + listings endpoints migrated to v1

## Phase 1: Mobile foundation

Deliverables:
- `mobile/` app bootstrapped (Expo)
- Environment config (`dev/staging/prod`)
- API client + interceptors + refresh flow
- Base navigation skeleton

Exit criteria:
- App launches on emulator and physical Android
- Login/logout token flow stable

## Phase 2: Core browsing parity

Deliverables:
- Home
- Listings
- Search + filters
- Property details
- Wishlist

Exit criteria:
- Core user journey from discover to save works end-to-end

## Phase 3: User workflows

Deliverables:
- Post property flow
- Profile management
- Image upload flow

Exit criteria:
- Create/edit flows stable in low and moderate network conditions

## Phase 4: Realtime and engagement

Deliverables:
- Messaging (Socket.IO)
- Notifications
- Unread counters and background refresh strategy

Exit criteria:
- Realtime message delivery and fallback polling validated

## Phase 5: Hardening and release

Deliverables:
- Performance profiling and fixes
- Crash reporting + analytics
- Release signing setup
- Internal test APK pipeline

Exit criteria:
- Release candidate APK accepted by internal QA

## 8. Feature Parity Rules

Priority order:
1. Public browsing + auth
2. Property detail + wishlist + messaging
3. Post property + profile
4. Admin capabilities (optional on mobile initially)

Rule:
- If a feature changes backend contract, merge backend/shared contracts first, then web/mobile clients.

## 9. API and Client Standards

## 9.1 API client behavior

- Single API client wrapper for mobile
- Centralized retry policy
- Centralized auth refresh behavior
- Timeout defaults and offline-aware error mapping

## 9.2 Error handling standard

- Display user-friendly messages
- Preserve machine-readable error codes for logging
- Always log `requestId` when provided by backend

## 9.3 Environment variables

Examples:
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_ENV=development|staging|production`

Never expose server secrets in mobile client.

## 10. Performance and Quality Gates

## 10.1 Performance gates (pre-release)

- Cold start and warm start measured on mid-tier Android device
- Listing scroll remains smooth under realistic data volume
- No memory spikes during media-heavy screens
- API latency budget monitored (P50, P95)

## 10.2 Testing gates

- Unit tests for critical business logic
- Integration tests for auth and API client
- Manual E2E smoke list on real device:
  - Login/register
  - Browse/search/filter
  - Property details
  - Wishlist
  - Messaging
  - Post property

## 10.3 Stability gates

- Crash-free session threshold target defined before store submission
- Sentry release health configured
- Error budget policy documented

## 11. CI/CD Plan

Minimum CI jobs:
- `server`: lint + tests
- `client`: lint + tests + build
- `mobile`: typecheck + lint + tests + Android build validation

Release pipeline:
- Internal APK on every release candidate tag
- Signed APK/AAB for production tags only

Recommended tools:
- Expo EAS Build for faster managed pipeline
- GitHub Actions for CI orchestration

## 12. APK Build and Release Playbook

## 12.1 Debug APK

```bash
cd mobile
pnpm install
pnpm expo prebuild
pnpm expo run:android
```

Alternative with Gradle (inside Android project):

```bash
cd mobile/android
./gradlew assembleDebug
```

## 12.2 Release signing

- Generate keystore once and store securely
- Configure signing in Android build config
- Build release APK/AAB using CI or Android Studio
- Keep key rotation and backup procedure documented

## 12.3 Distribution

- Internal distribution first (QA, stakeholders)
- Staged rollout in Play Console
- Monitor crashes and ANR before 100% rollout

## 13. Web + Mobile Parallel Development Rules

1. Backend contract changes require schema updates in `packages/api-contracts`.
2. Do not merge web-only assumptions into shared/domain code.
3. Every new feature PR should include:
   - API contract update (if changed)
   - Web implementation update (if applicable)
   - Mobile implementation update (if applicable)
4. Maintain release notes for web and mobile separately.

## 14. Security Checklist

- No secrets in client bundle
- Token storage is secure
- Sensitive logs redacted
- TLS-only API endpoints in production
- OTP/auth endpoints protected by rate limits
- Account deletion/export flows tested on mobile

## 15. Week 1 Starter Checklist

1. Create `mobile/` app and run on Android emulator.
2. Create `packages/api-contracts/` and move first schemas (auth + listing).
3. Implement mobile API client with auth interceptors.
4. Build login screen + token persistence.
5. Build listings screen with pagination.
6. Validate end-to-end login + listings on real device.

## 16. Risks and Mitigations

- Risk: API contract drift between clients
  - Mitigation: shared schemas + CI contract checks
- Risk: auth refresh edge-case bugs on flaky networks
  - Mitigation: central retry/refresh logic and timeout controls
- Risk: performance drops on low-end devices
  - Mitigation: FlashList, image optimization, profiling before release
- Risk: trying to migrate all web screens at once
  - Mitigation: phased parity with strict priorities

## 17. Definition of Done (Android Flagship MVP)

The Android app is considered ready when:
- Core parity flows are complete and stable
- Performance gates are met on target devices
- Crash and ANR rates are acceptable
- Signed release artifact is produced via CI
- Rollback and hotfix process is documented

---

Use this guide as the source of truth for implementation order and engineering standards while web and mobile evolve in parallel.
