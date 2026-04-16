# Poop Timer

Poop Timer is a small Expo + React Native MVP that helps users avoid turning a bathroom break into a full lifestyle choice. Start a session, watch the timer count upward, and get increasingly judgmental messages as the minutes pass.

## Architecture

The app is intentionally split into a few beginner-friendly modules:

- `App.tsx` holds the single-screen layout and wires the UI to session state.
- `src/hooks/usePoopSession.ts` owns the timer, active session state, app background detection, and message updates.
- `src/data/messages.ts` stores all message content and metadata in one place so new messages can be added without changing business logic.
- `src/storage/sessionStorage.ts` persists the active session so reminders can survive a full app close and the timer can recover on relaunch.
- `src/utils/selectMessage.ts` contains the message selection rules and fallback logic.
- `src/utils/formatTime.ts` keeps timer formatting isolated from message logic.
- `src/utils/notifications.ts` configures local notifications, schedules reminder batches, and cancels them when a session ends.
- `src/components/TimerDisplay.tsx`, `src/components/MessageCard.tsx`, and `src/components/SessionButton.tsx` keep the UI reusable and tidy.

This structure leaves clean extension points later for stats/history, achievements, settings, tone packs, and local notification scheduling.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm start
```

3. Open the app in Expo Go, an Android emulator, an iOS simulator, or the web preview.

Useful shortcuts:

```bash
npm run android
npm run android:dev-build
npm run android:studio
npm run ios
npm run start:dev-client
npm run web
```

Windows note:

- If PowerShell blocks `npx`, use `npm.cmd` or `npx.cmd` instead of `npm` / `npx`.

## Android Studio Setup

This project uses Expo, so you do not open and run a native `android/` folder in Android Studio for the MVP. Instead, Android Studio provides the emulator, and Expo serves the app.

Recommended Windows flow:

1. Open Android Studio.
2. Open `More Actions` -> `Virtual Device Manager`.
3. Start an emulator.
4. In PowerShell, run from the project folder:

```powershell
cd "C:\Users\nickc\OneDrive\Documents\Poop Timer"
npm.cmd run android:studio
```

If PowerShell blocks `npx`, use the included Windows launcher instead:

```powershell
cd "C:\Users\nickc\OneDrive\Documents\Poop Timer"
.\run-android.cmd
```

`run-android.cmd` will:

- point Expo at your Android SDK
- cold-boot the first available emulator to avoid stale snapshot issues
- start the first available emulator if one is not already running
- clear any lingering `CI=1` shell setting that would make Expo non-interactive
- connect Expo Go over `localhost` with `adb reverse` instead of depending on LAN discovery
- clear the Metro cache before launch so stale transforms do not linger
- pick an open Expo port automatically between `8082` and `8090`

If Android Studio is installed in the default location, no extra manual SDK path setup should be needed.

## Local Android Development Build

Expo's current development-build flow is:

1. install `expo-dev-client`
2. build the native Android app locally with `npx expo run:android`
3. use `npx expo start --dev-client` for later JavaScript-only development sessions

This project now includes a Windows helper for that flow:

```powershell
cd "C:\Users\nickc\OneDrive\Documents\Poop Timer"
.\run-android-dev-build.cmd
```

or:

```powershell
cd "C:\Users\nickc\OneDrive\Documents\Poop Timer"
npm.cmd run android:dev-build
```

That script will:

- use Android Studio's bundled JDK instead of the older system Java on this machine
- start the first available emulator if one is not already running
- wait for Android to finish booting
- run `npx expo run:android` to prebuild, compile, and install the local development client

After the dev build is installed once, future sessions can usually use:

```powershell
cd "C:\Users\nickc\OneDrive\Documents\Poop Timer"
npm.cmd run start:dev-client
```

Notes:

- The generated `android/` and `ios/` folders are ignored in this repo so Expo's prebuild output does not clutter version control.
- If you change native dependencies or native app config later, rebuild with `npm.cmd run android:dev-build` again.
- Because `app.json` does not yet define an explicit `android.package`, Expo currently generates the local Android app id as `com.anonymous.pooptimer`. That is fine for development, but you will probably want to set a real package id before shipping.

## Add More Messages Later

Edit only `src/data/messages.ts`.

- Add session messages to `SESSION_MESSAGES`.
- Add return-from-background messages to `BACKGROUND_RETURN_MESSAGES`.
- Each message uses:
  - `id`: unique string
  - `text`: what the user sees
  - `category`: tone bucket
  - `minMinute`: first eligible minute
  - `maxMinute`: last eligible minute

Example:

```ts
{
  id: "supportive-new-01",
  text: "You are still technically on schedule.",
  category: "supportive",
  minMinute: 0,
  maxMinute: 5,
}
```

The selection utility already filters by minute, randomizes eligible options, avoids immediate repeats, and falls back automatically if nothing matches.

## Notifications

- Starting a session requests notification permission if the app does not already have it.
- The app schedules the next hour of reminder notifications locally so they can still fire while the app is backgrounded or closed.
- Reopening the app restores the active session and refreshes the pending reminder schedule.
- Ending the session cancels the pending reminders.
- Reopening or ending a session also clears any delivered Poop Timer reminders from the notification tray so old jokes do not linger.
- `app.json` includes the `expo-notifications` config plugin, which makes notification-related native settings easier to carry into a development build or production build later.
- On some Android devices, force-stopping the app from OS settings can pause scheduled notifications until the app is opened again. That is an Android platform limitation rather than a Poop Timer-specific bug.
