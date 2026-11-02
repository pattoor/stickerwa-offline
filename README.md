# Stickers WPP

Offline-first sticker creator for WhatsApp. Android-first MVP.

## Stack

- Capacitor 6 + React 18 + TypeScript
- Fabric.js (canvas editor)
- SQLite (local, offline)
- Tailwind + shadcn/ui
- Dark mode built-in

## Requirements

- Node.js >= 20
- JDK 17 (for Android)
- Android Studio (for Android builds)

## Setup

```bash
npm install
npm run dev          # web dev server

# First time only: generate native Android project
npx cap add android
npx cap sync android
npx cap open android # open in Android Studio
```

> The `android/` folder in this repo contains the native bridge (Kotlin) scaffolding.
> Run `npx cap add android` first to generate the Gradle project, then copy the
> Kotlin files from `android/app/src/main/java/...` into the generated project.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production web build
- `npm run lint` — ESLint
- `npm run typecheck` — tsc --noEmit
- `npm run test` — Vitest
- `npm run cap:sync` — sync web build to native
- `npm run cap:android` — open Android Studio

## Branches

- `main` — production, releases only via tags
- `develop` — integration
- `feature/*`, `fix/*` — feature work

## Releases

APKs are published via GitHub Releases on `v*` tags. See `.github/workflows/`.

## License

MIT