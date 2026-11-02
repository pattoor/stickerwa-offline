# Stickers WPP — Project Status

> Last updated: 2026-11-02
> Branch: `dev` (active development), `main` (production)
> Repo: https://github.com/pattoor/stickerwa-offline

---

## Current State

### What works (web)
- ✅ Canvas editor (Fabric.js) — full screen, floating controls
- ✅ Sticker creation from photos (contain scaling, no crop)
- ✅ Sticker creation from GIFs (animated WEBP conversion)
- ✅ Text tool (5 fonts, 7 colors, size)
- ✅ Pen tool (7 colors, 5 sizes, toggle on/off)
- ✅ Background color (transparent checkerboard + 5 colors)
- ✅ Background removal (optional download, ~40MB model)
- ✅ Auto-crop on export (bounding box detection → 512×512)
- ✅ Undo/redo (50 steps)
- ✅ Packs (create, list, export, import)
- ✅ Favorites and recents
- ✅ Achievements (5 badges)
- ✅ Curated gallery (bundled packs)
- ✅ Dark mode (auto/system + manual override)
- ✅ Backup/restore (JSON export/import all data)
- ✅ Profile (name + metrics)
- ✅ Settings (theme, bg removal status, backup, about)

### What's scaffolded (native, not tested)
- 🔄 Android project (Capacitor 6 + Gradle)
- 🔄 StickerBridgePlugin (Java) — `importPack(packId)`
- 🔄 StickerContentProvider (Java) — WhatsApp Stickers contract
- 🔄 AndroidManifest with content provider
- 🔄 GitHub Actions CI/CD (builds APK on push)

### What's deferred
- ⏳ iOS bridge (Swift) — requires Apple Developer account
- ⏳ Community/sharing server (PocketBase + Cloudflare Tunnel)
- ⏳ Plan A: Read existing stickers from WhatsApp (not possible via API)
- ⏳ Plan B: Search/filter, templates, share individual sticker, keyboard shortcuts

### Known limitations
- GIF → animated WEBP conversion is experimental (RIFF container manual)
- Background removal requires ~40MB model download on first use
- Web storage uses localStorage (not SQLite) — native uses SQLite
- Canvas is full screen but internal resolution is screen size (export auto-crops to 512×512)
- No tests yet (vitest configured with `--passWithNoTests`)

## CI/CD Status

| Workflow | Status | Notes |
|---|---|---|
| `ci.yml` | ✅ Passing | lint + typecheck + build web + tests |
| `build-android.yml` | ✅ Passing | Builds APK on push to dev/main, tags v* |
| GitHub Release | ✅ Working | Creates release with APK on v* tags |

### Latest release
- **v0.1.2** — APK `app-debug.apk` (~19MB)
- URL: https://github.com/pattoor/stickerwa-offline/releases

## Decision Log

| Decision | Choice | Why |
|---|---|---|
| Framework | Capacitor + React | Single codebase, web tech for canvas, small APK |
| Canvas | Fabric.js 6 | Rich ecosystem, text/images/filters, export WEBP |
| Local DB (web) | localStorage | Simple, no native deps for dev |
| Local DB (native) | SQLite (capacitor-community) | Offline-first, persistent |
| State management | Zustand | Lightweight, no boilerplate |
| Styling | Tailwind + shadcn/ui | Rapid UI, dark mode built-in |
| Background removal | @imgly/background-removal | Client-side, no API needed |
| GIF support | gifuct-js + manual WEBP encoder | No native dependency, experimental |
| CI/CD | GitHub Actions | Free, no local SDK needed |
| Distribution | GitHub Releases (APK) | No Play Store for MVP |
| iOS | Deferred | Requires $99/yr Apple Developer account |
| Backend | Deferred | PocketBase on VPS when community needed |

## Next Steps (prioritized)

1. **Test APK on real device** — install from GitHub Release, verify import to WhatsApp
2. **Fix native bridge** — StickerContentProvider needs to serve actual sticker data
3. **Add tests** — unit tests for validation, backup, canvas helpers
4. **Plan A (Android)** — read existing sticker packs from device (if possible)
5. **Plan B (features)** — search/filter, templates, share individual sticker
6. **iOS** — when Apple Developer account is available

## How to Resume

```bash
# Clone
git clone https://github.com/pattoor/stickerwa-offline.git
cd stickerwa-offline

# Install
npm install

# Dev server (web)
npm run dev
# → http://localhost:5173

# Typecheck + lint + build
npm run typecheck && npm run lint && npm run build

# Sync Android (requires Android SDK)
npx cap sync android
```