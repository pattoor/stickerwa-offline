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
| Local DB | `@capacitor-community/sqlite` (native) / localStorage (web dev) | SQLite file on device, offline |
| State | Zustand | Lightweight, no boilerplate |
| Routing | React Router 6 | |
| Background removal | `@imgly/background-removal` | Optional, downloaded on first use (~40MB) |
| GIF support | `gifuct-js` | Parses GIFs, converts to animated WEBP |
| Native bridge (Android) | Java content provider | WhatsApp Stickers API |
| Native bridge (iOS) | Swift pasteboard + URL scheme | Deferred to phase 2 |
| Build/distribution | GitHub Releases (APK) + GitHub Actions | No Play Store for MVP |
| Backend (future) | PocketBase on VPS + Cloudflare Tunnel | Deferred |

## 3. Project Structure

```
stickers-wpp/
├── .github/workflows/          # CI/CD (ci.yml, build-android.yml)
├── docs/
│   ├── ARCHITECTURE.md         # This file
│   └── STATUS.md               # Current status & changelog
├── src/
│   ├── app/                    # React app root, routing
│   ├── features/
│   │   ├── editor/             # Canvas editor (Fabric.js) — full screen, floating controls
│   │   ├── stickers/           # Sticker library: created + curated + favorites
│   │   ├── profile/            # Metrics + export name + achievements
│   │   └── settings/           # Theme (auto/dark/light), backup/restore, about
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   └── layout/             # AppShell (hideNav support), BottomNav
│   ├── lib/
│   │   ├── backup/             # Backup/restore (JSON export/import)
│   │   ├── canvas/             # Fabric.js helpers, bgRemoval, gifToWebp
│   │   ├── db/                 # Web storage (localStorage), favorites, recents
│   │   ├── gamification/       # Achievements system
│   │   └── stickers/           # Validation, packExport, trayIcon, curatedPacks
│   ├── plugins/                # Capacitor plugin (StickerBridge)
│   └── stores/                 # Zustand (theme, profile)
├── android/                    # Capacitor Android project (Java bridge)
├── resources/                  # Bundled curated sticker packs
├── capacitor.config.ts
├── package.json
└── README.md
```

## 4. UI/UX Modules

### Navigation
Bottom tab bar: **Stickers** | **Perfil** | **Config**.

### Stickers module
- Sub-tabs: "Mis" (created) / "Favoritos" / "Galería" (curated bundled packs).
- Search bar, empty states, FAB "Nuevo".
- Pack chips with Export/Import to WhatsApp buttons.
- Import pack from `.wastickers` file (upload button).

### Editor module
- Full-screen canvas (background fills entire screen)
- Floating controls (top bar: back, undo/redo, export; bottom card: tools + colors + expanded options)
- Tools: Texto, Imagen, Borrar, Lápiz, Fondo (bg removal)
- Text tool: 5 fonts + 7 colors
- Pen tool: 7 colors + 5 sizes (2/4/8/12/20px) + toggle on/off
- Background color: transparent (checkerboard) + 5 colors
- Auto-crop on export (bounding box detection → 512×512)
- GIF support: parses frames, converts to animated WEBP
- Undo/redo (50 steps)

### Profile module
- Avatar + editable name (used on export).
- Metrics grid: stickers created, packs created, packs exported, shared.
- Achievements (5 badges with progress).
- Export info note.

### Settings module
- Theme: Auto/Oscuro/Claro (system preference + manual override)
- Background removal: optional download (~40MB), status indicator
- Backup/Restore: export/import all data as JSON
- About / version.

## 5. Data Model (Web: localStorage, Native: SQLite)

### Web storage keys
- `stickers-wpp:stickers` — array of Sticker objects
- `stickers-wpp:packs` — array of Pack objects
- `stickers-wpp:favorites` — array of sticker IDs
- `stickers-wpp:recents` — array of sticker IDs (max 20)
- `stickers-wpp:ach-progress` — achievement progress
- `stickers-wpp:theme` — theme state (zustand persist)
- `stickers-wpp:profile` — profile state (zustand persist)

### Native SQLite schema
```sql
CREATE TABLE stickers (id, pack_id, image_path, width, height, size_bytes, created_at, updated_at);
CREATE TABLE packs (id, name, tray_icon_path, created_at, updated_at, exported_at, is_curated);
CREATE TABLE favorites (sticker_id, added_at);
CREATE TABLE recents (sticker_id, used_at);
CREATE TABLE achievements (key, unlocked_at, progress);
CREATE TABLE settings (key, value);
```

## 6. WhatsApp Sticker Constraints (enforced in `lib/stickers/`)

| Constraint | Value |
|---|---|
| Image format | WEBP (static or animated) |
| Dimensions | 512 x 512 px |
| Max file size | 100 KB per sticker |
| Tray icon | 96 x 96 px, ≤ 50 KB |
| Pack size | 3–30 stickers |

## 7. Native Bridge — Android (Java)

- `StickerBridgePlugin.java` — Capacitor plugin, `importPack(packId)` → returns `{ imported: true }`
- `StickerContentProvider.java` — WhatsApp Stickers Content Provider contract
- Authority: `com.stickerswpp.stickercontentprovider`
- Registered in `AndroidManifest.xml` with `<provider>` + `<meta-data>`
- **Plan A note:** WhatsApp does not expose API to read stickers from other apps. Users import images manually.

## 8. Background Removal — Optional Download Flow

1. User taps "Fondo" on an image → modal appears
2. Check if model cached in app storage
3. If not: show modal with size (~40MB) and "Download" button
4. Download with progress bar animation
5. Cache in `Capacitor.Filesystem` app data dir
6. Run `@imgly/background-removal` with cached model path
7. On failure: show "Try again" + fallback to manual eraser

## 9. GIF Support — Animated WEBP

1. User selects a GIF file → parsed with `gifuct-js`
2. Frames extracted and rendered to canvases
3. On export: frames converted to animated WEBP (RIFF container with ANMF chunks)
4. Each frame resized to 512×512
5. Exported as `.webp` animated sticker

## 10. CI/CD Strategy

### Branches
- `main` — production. Releases via `v*` tags.
- `dev` — development. Push triggers debug APK build.
- `feature/*`, `fix/*` — feature work.

### Workflows

**`.github/workflows/ci.yml`** — PR/push validation
- Triggers: PR to `main`/`develop`/`dev`, push to `develop`/`dev`.
- Steps: lint → typecheck → web build → tests (`--passWithNoTests`).

**`.github/workflows/build-android.yml`** — Android build
- Triggers: push to `main`/`dev`, tags `v*`, manual `workflow_dispatch`.
- Builds debug APK (artefacto, 30-day retention).
- On tags: builds release APK + creates GitHub Release with APK attached.
- `chmod +x ./gradlew` required for Linux runner.

### Known CI/CD issues (resolved)
- Duplicate `push:` keys in YAML → combined into one
- `./gradlew: Permission denied` → added `chmod +x`
- Vitest failing without test files → added `--passWithNoTests`
- `setup-android@v3` failing → uses pre-installed SDK

## 11. Build & Release (Android)

```bash
npm install
npm run dev                          # Vite dev server
npx cap add android                  # First time only
npx cap sync android
npx cap open android                 # Android Studio (optional)

# Release APK (local, requires Android SDK)
cd android && ./gradlew assembleDebug
```

- CI builds on push to `dev` → artefacto (zip with APK)
- CI builds on tag `v*` → GitHub Release with APK directo
- Distribution: direct APK download, no Play Store for MVP

## 12. iOS Adaptation (deferred)

- Same React codebase, add `ios/` via `npx cap add ios`.
- Bridge: Swift plugin using `UIPasteboard` + `whatsapp://` URL scheme.
- Distribution: requires Apple Developer account ($99/yr).
- UI: platform detection already in place (`lib/platform/`).

## 13. Constraints & Risks

- WhatsApp may break Stickers API (happened 2023). Keep bridge minimal and isolated.
- APK size target: ≤12MB without AI model (actual: ~19MB with model).
- All sticker validation client-side.
- `.wastickers` format: zip with WEBPs + `manifest.json`.
- GIF → animated WEBP conversion is experimental (RIFF container manual).

## 14. Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Scaffolding + canvas editor + export WEBP + local save | ✅ Done |
| 2 | Packs + tray icon + import to WhatsApp (Android bridge) | ✅ Scaffolding done |
| 3 | Share/import `.wastickers` + favorites/recents | ✅ Done |
| 4 | Background removal (optional download) | ✅ Done |
| 5 | Gamification + curated gallery + polish | ✅ Done |
| 6 | Editor UX (full screen, floating controls, pen, auto-crop) | ✅ Done |
| 7 | Auto dark mode + backup/restore | ✅ Done |
| 8 | CI/CD (GitHub Actions, APK builds) | ✅ Done |
| 9 (later) | iOS bridge + distribution | ⏳ Deferred |
| 10 (later) | Community/sharing server | ⏳ Deferred |

---

## Key Learnings

1. WhatsApp has no web sticker import API — native bridge is mandatory.
2. Capacitor + React keeps one codebase and small APK while leveraging Fabric.js.
3. PocketBase/Supabase deferred; SQLite local (native) / localStorage (web) is enough for MVP.
4. Background removal model (~40MB) must be optional download to keep APK light.
5. iOS distribution without App Store is impractical for end users — deferred.
6. GitHub Actions `gradlew` needs `chmod +x` on Linux runners.
7. YAML duplicate keys cause silent failures — always validate YAML.
8. Fabric.js manages canvas size internally; CSS overrides need `!important`.