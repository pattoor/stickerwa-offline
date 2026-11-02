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

## Dev builds (APK sin instalar Android Studio)

Cada push a la rama `dev` genera un APK debug automáticamente en GitHub Actions.

1. Hacé tus cambios y pusheá a `dev`:
   ```bash
   git checkout dev
   git add -A && git commit -m "tu cambio"
   git push origin dev
   ```
2. Esperá ~5-10 min a que GitHub Actions termine.
3. Andá a https://github.com/pattoor/stickerwa-offline/actions
4. Descargá el artefacto `stickers-wpp-debug-dev-...`
5. Descomprimí y instalá el APK en tu celular (activá "fuentes desconocidas").

Para releases estables, pusheá un tag:
```bash
git tag v0.1.0 && git push origin v0.1.0
```

## License

MIT