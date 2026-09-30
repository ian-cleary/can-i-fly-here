# Can I Fly Here? — iOS app build guide

This repo ships the drone go/no-go web app **and** a Capacitor iOS shell around it
(`ios/`), so the same code runs as a native iPhone/iPad app. The web app lives at the
repo root (`index.html`); Capacitor bundles it from `www/`, which is generated —
never commit `www/`, `node_modules/` or Xcode build output (see `.gitignore`).

## What you need (all on your Mac)

- **Apple Developer Program** membership — $99/year, enrolled as yourself. Without it
  you can build and run on your own iPhone, but you cannot put the app on the
  App Store or TestFlight.
- **Xcode 15+** from the Mac App Store, plus its command-line tools.
- **Node.js 18+** (https://nodejs.org).

## Build it

```bash
git clone https://github.com/ian-cleary/can-i-fly-here.git
cd can-i-fly-here
npm ci                 # install Capacitor + plugins (pinned in package-lock.json)
npm run build          # stage index.html, sw.js, manifest, icons into www/
npx cap sync ios       # copy www/ into the native project
open ios/App/App.xcworkspace
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your **Team**.
   The bundle identifier is `com.iancleary.caniflyhere` — it must be unique to your
   developer account (it will be; it is derived from your name).
2. Pick your iPhone as the run destination and press **Run** (⌘R). Grant location
   access when prompted — the app detects your country from GPS.
   (Tip: in the Simulator, use Features → Location → Custom Location to test
   different countries.)
3. When it works: **Product → Archive**, then **Distribute App → App Store Connect →
   Upload**. The app appears in App Store Connect under TestFlight within minutes;
   add yourself as a tester and install it on your phone from the TestFlight app.

## App Store submission

Create the app record in App Store Connect (name "Can I Fly Here?", bundle ID
`com.iancleary.caniflyhere`), fill in the privacy questionnaire — the app uses
**location while in use** (purpose string is in `Info.plist`: country detection for
drone rules + nearby airfields) — add screenshots, then **Submit for Review**.

### Guideline 4.2 ("minimum functionality")

Apple rejects apps that are just a website in a frame. This one earns its place:

- **GPS is the core input** — native `NSLocationWhenInUseUsageDescription`
  permission prompt, real Core Location, not a web fallback.
- **Native plugins are bundled**: `@capacitor/haptics` (taptic feedback on the
  big verdict button), `@capacitor/share` (share the go/no-go verdict),
  `@capacitor/status-bar` (styled status bar), `@capacitor/splash-screen`
  (branded launch screen).
- Toggles persist in `localStorage` inside the WKWebView, and the service worker
  gives the app shell offline in the field.

Suggested one-line additions to `index.html` to make the native feel concrete:

```js
// taptic on the verdict button (needs the @capacitor/haptics script —
// import from '@capacitor/haptics' in a module script, or window.Capacitor)
import { Haptics, ImpactStyle } from '@capacitor/haptics';
document.getElementById('btn-verdict').addEventListener('click', () =>
  Haptics.impact({ style: ImpactStyle.Medium }));
```

## Updating the app later

1. Edit `index.html` (and friends) at the repo root, commit, push — GitHub Pages
   updates the website automatically.
2. For the native app: `npm run build && npx cap sync ios`, bump the version in
   Xcode (App target → General → Version), Archive, upload. TestFlight users get
   the update; submit the new build for review to update the Store listing.

## Files

| Path | What it is |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `icon-*.png` | The web app (also served by GitHub Pages) |
| `capacitor.config.json` | App ID `com.iancleary.caniflyhere`, splash + status-bar config |
| `package.json` / `package-lock.json` | Capacitor core, CLI, iOS platform, native plugins |
| `ios/` | Native Xcode project shell (no `cap add` needed again) |
| `IOS_BUILD.md` | This file |
