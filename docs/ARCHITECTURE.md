# Stickers WPP — Architecture & Plan

> Offline-first sticker creator for WhatsApp. Android-first MVP, iOS adapted later.
> Stack: Capacitor + React + TypeScript + SQLite + Fabric.js.

---

## 1. Product Vision

- Create WhatsApp stickers on the phone, 100% offline.
- Organize into packs (3-30 stickers), import to WhatsApp via native bridge.
- Share packs as `.wastickers` files (viral, no backend).
- Optional: background removal via on-demand model download.
- Community/sharing server deferred to a later phase (Cloudflare Tunnel + PocketBase on VPS).

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | Capacitor 6 | Single codebase → Android + iOS |
| UI | React 18 + TypeScript + Tailwind + shadcn/ui | Web-rendered in WebView |
| Canvas/editor | Fabric.js 6 | Recorte, texto, filtros, export WEBP client-side |
| Local DB | `@capacitor-community/sqlite` | SQLite file on device, offline |
| State | Zustand | Lightweight, no boilerplate |
| Routing | React Router 6 | |
| Background removal | `@imgly/background-removal` | Optional, downloaded on first use (~40MB) |
| Native bridge (Android) | Kotlin content provider | WhatsApp Stickers API |
| Native bridge (iOS) | Swift pasteboard + URL scheme | Deferred to phase 2 |
| Build/distribution | GitHub Releases (APK) | No Play Store for MVP |
| Backend (future) | PocketBase on VPS + Cloudflare Tunnel | Deferred |

## 3. Project Structure

```
stickers-wpp/
├── .github/workflows/        # CI/CD (ci.yml, build-android.yml)
├── docs/ARCHITECTURE.md      # This file
├── src/
│   ├── app/                  # React app root, routing
│   ├── features/
│   │   ├── editor/           # Canvas editor (Fabric.js)
│   │   ├── stickers/         # Sticker library: created + curated
│   │   ├── profile/          # Metrics + export name
│   │   └── settings/         # Dark mode, prefs, about
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   └── layout/           # AppShell, BottomNav
│   ├── lib/
│   │   ├── db/               # SQLite repositories
│   │   ├── canvas/           # Fabric.js helpers, export WEBP
│   │   ├── stickers/         # WhatsApp sticker validation, limits
│   │   └── platform/         # Platform detection helpers
│   └── stores/               # Zustand stores (theme, profile)
├── android/                  # Capacitor Android project (Kotlin bridge)
├── ios/                      # Capacitor iOS project (deferred)
├── resources/                # Bundled curated sticker packs
├── capacitor.config.ts
├── package.json
└── README.md
```

## 4. UI/UX Modules

### Navigation
Bottom tab bar: **Stickers** | **Perfil** | **Config**.

### Stickers module
- Sub-tabs: "Mis stickers" (created) / "Galería" (curated bundled packs).
- Search bar, empty states, FAB "Nuevo".
- Grid of stickers with pack grouping.

### Profile module
- Avatar + editable name (used on export).
- Metrics grid: stickers created, packs created, packs exported, shared.
- Export info note (name + pack metadata included in `.wastickers`).

### Settings module
- Dark mode toggle (persisted).
- Background removal: optional download (~40MB).
- About / version.

### Dark mode
- Tailwind `darkMode: "class"`.
- Persisted in `themeStore` (zustand + localStorage).
- `AppShell` applies `dark` class based on store.

## 5. Data Model (SQLite)

```sql
CREATE TABLE stickers (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tray_icon_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  exported_at INTEGER,
  is_curated INTEGER DEFAULT 0
);

CREATE TABLE favorites (
  sticker_id TEXT PRIMARY KEY REFERENCES stickers(id) ON DELETE CASCADE,
  added_at INTEGER NOT NULL
);

CREATE TABLE recents (
  sticker_id TEXT PRIMARY KEY REFERENCES stickers(id) ON DELETE CASCADE,
  used_at INTEGER NOT NULL
);

CREATE TABLE achievements (
  key TEXT PRIMARY KEY,
  unlocked_at INTEGER,
  progress INTEGER DEFAULT 0
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## 6. WhatsApp Sticker Constraints (enforced in `lib/stickers/`)

| Constraint | Value |
|---|---|
| Image format | WEBP (static or animated) |
| Dimensions | 512 x 512 px |
| Max file size | 100 KB per sticker |
| Tray icon | 96 x 96 px, ≤ 50 KB |
| Pack size | 3–30 stickers |

## 7. Native Bridge — Android (Kotlin)

Implements WhatsApp Stickers Content Provider contract:
- Authority: `com.stickerswpp.stickercontentprovider`
- Exposes metadata, sticker list, and binary WEBP per pack.
- Triggered from React via Capacitor plugin: `StickerBridge.importPack(packId)`.

## 8. Background Removal — Optional Download Flow

1. User taps "Remove background".
2. Check if model cached in app storage.
3. If not: show modal with size (~40MB) and "Download" button.
4. Download with progress bar animation.
5. Cache in `Capacitor.Filesystem` app data dir.
6. Run `@imgly/background-removal` with cached model path.
7. On failure: show "Try again" + fallback to manual eraser tool.

## 9. CI/CD Strategy

### Branches
- `main` — production. Releases only via `v*` tags.
- `develop` — integration. PRs merge here.
- `feature/*`, `fix/*` — feature work, no CI runs.

### Workflows

**`.github/workflows/ci.yml`** — PR validation
- Triggers: PR to `main`/`develop`, push to `develop`.
- Steps: lint → typecheck → web build → tests.
- No APK build (fast feedback).

**`.github/workflows/build-android.yml`** — Android build
- Triggers: push to `main`, tags `v*`, manual `workflow_dispatch`.
- Builds debug APK on `main` push (beta artifact, 30-day retention).
- Builds release APK on tags (signed via keystore secrets, or debug fallback).
- Creates GitHub Release with APK on `v*` tags.

### Secrets required for signed releases
- `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

### Why not build on every commit
- Feature branches: no CI (speed, cost).
- PRs: validation only (lint/typecheck/build), no APK.
- APK builds only on `main`/tags/manual (heavier, ~5-10 min).

## 10. Build & Release (Android)

```bash
npm install
npm run dev                          # Vite dev server
npx cap sync android
npx cap open android                 # Android Studio

# Release APK (local)
cd android && ./gradlew assembleRelease
```

- CI builds on tag push (`v*`) → GitHub Release with APK.
- Distribution: direct APK download, no Play Store for MVP.

## 11. iOS Adaptation (deferred)

- Same React codebase, add `ios/` via `npx cap add ios`.
- Bridge: Swift plugin using `UIPasteboard` + `whatsapp://` URL scheme.
- Distribution: requires Apple Developer account ($99/yr) → App Store or TestFlight.
- Alternative (no spend): AltStore (re-sign every 7 days).
- UI: platform detection already in place (`lib/platform/`).

## 12. Constraints & Risks

- WhatsApp may break Stickers API (happened 2023). Keep bridge minimal and isolated.
- APK size target: ≤12MB without AI model.
- All sticker validation client-side.
- `.wastickers` format: zip with WEBPs + `manifest.json`.

## 13. Phases

| Phase | Scope | Duration |
|---|---|---|
| 1 | Scaffolding + canvas editor + export WEBP + local save | 3-4 days |
| 2 | Packs + tray icon + import to WhatsApp (Android bridge) | 2-3 days |
| 3 | Share/import `.wastickers` + favorites/recents | 2 days |
| 4 | Background removal (optional download) | 2 days |
| 5 | Gamification + curated gallery + polish | 2-3 days |
| 6 (later) | iOS bridge + distribution | 1-2 weeks |

---

## Key Learnings

1. WhatsApp has no web sticker import API — native bridge is mandatory.
2. Capacitor + React keeps one codebase and small APK (~10MB) while leveraging Fabric.js.
3. PocketBase/Supabase deferred; SQLite local is enough for offline MVP.
4. Background removal model (~40MB) must be optional download to keep APK light.
5. iOS distribution without App Store is impractical for end users — deferred.