# Renters Mobile Skeleton

React Native Android skeleton (Expo) for the Renters flagship mobile app.

## What is already scaffolded

- Expo + TypeScript setup
- Native stack navigation
- Query client setup
- Axios API client with env-based base URL
- Secure token storage helper (`expo-secure-store`)
- Starter screens:
  - `Login`
  - `Home`
  - `Listings` connectivity check

## Environment setup

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Default Android emulator API URL:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
```

## Commands

From repository root:

```bash
pnpm --dir mobile install
pnpm mobile:start
pnpm mobile:android
pnpm mobile:prebuild
pnpm --dir mobile apk:debug
```

Or from `mobile/` directly:

```bash
pnpm install
pnpm start
pnpm android
pnpm prebuild
pnpm apk:debug
```

## Next implementation targets

1. Replace placeholder login with backend auth integration.
2. Implement token-aware Axios interceptors.
3. Add listings API, filters, and pagination with FlashList.
4. Add app-level error boundary and offline state handling.

