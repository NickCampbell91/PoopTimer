@echo off
setlocal EnableDelayedExpansion

set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"

if not exist "%ANDROID_SDK%\platform-tools\adb.exe" (
  echo Android SDK tools were not found at "%ANDROID_SDK%".
  echo Open Android Studio and make sure the SDK + platform-tools are installed.
  exit /b 1
)

set "ANDROID_HOME=%ANDROID_SDK%"
set "ANDROID_SDK_ROOT=%ANDROID_SDK%"
set "PATH=%ANDROID_SDK%\platform-tools;%ANDROID_SDK%\emulator;%PATH%"
set "CI="
set "PROJECT_ROOT=%CD%"
set "DEVICE_STATE="

powershell -NoProfile -Command "$workspace = [regex]::Escape('%PROJECT_ROOT%'); Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Where-Object { $_.CommandLine -match $workspace } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }" >nul 2>nul

for /f %%P in ('powershell -NoProfile -Command "$ports = 8082..8090; foreach ($p in $ports) { if (-not (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue)) { $p; break } }"') do set "EXPO_PORT=%%P"

if not defined EXPO_PORT (
  echo Could not find an open Expo port between 8082 and 8090.
  exit /b 1
)

for /f %%A in ('"%ANDROID_SDK%\platform-tools\adb.exe" get-state 2^>nul') do set "DEVICE_STATE=%%A"

if /I "%DEVICE_STATE%"=="device" set "DEVICE_FOUND=1"

if not defined DEVICE_FOUND (
  for /f "delims=" %%A in ('"%ANDROID_SDK%\emulator\emulator.exe" -list-avds') do (
    set "FIRST_AVD=%%A"
    goto :start_emulator
  )
)

goto :start_expo

:start_emulator
if not defined FIRST_AVD (
  echo No Android emulators were found.
  echo Create one in Android Studio: More Actions ^> Virtual Device Manager.
  exit /b 1
)

if /I "%DEVICE_STATE%"=="offline" (
  echo Clearing stale emulator connection...
  taskkill /IM emulator.exe /F >nul 2>nul
  taskkill /IM qemu-system-x86_64.exe /F >nul 2>nul
  "%ANDROID_SDK%\platform-tools\adb.exe" kill-server >nul 2>nul
  "%ANDROID_SDK%\platform-tools\adb.exe" start-server >nul 2>nul
)

echo Starting emulator: %FIRST_AVD%
powershell -NoProfile -Command "Start-Process -FilePath '%ANDROID_SDK%\emulator\emulator.exe' -ArgumentList '-avd','%FIRST_AVD%','-no-snapshot-load'" >nul 2>nul
echo Waiting for the emulator to connect...

set "EMULATOR_SERIAL="
for /l %%I in (1,1,36) do (
  for /f "skip=1 tokens=1,2" %%S in ('"%ANDROID_SDK%\platform-tools\adb.exe" devices') do (
    if /I "%%T"=="device" (
      set "CURRENT_SERIAL=%%S"
      if /I "!CURRENT_SERIAL:~0,9!"=="emulator-" set "EMULATOR_SERIAL=%%S"
    )
  )

  if defined EMULATOR_SERIAL goto :wait_boot
  ping -n 6 127.0.0.1 >nul
)

echo Timed out waiting for the emulator to appear in adb.
exit /b 1

:wait_boot
echo Emulator detected as !EMULATOR_SERIAL!. Waiting for Android to finish booting...

for /l %%I in (1,1,36) do (
  set "BOOT_COMPLETE="
  for /f %%B in ('"%ANDROID_SDK%\platform-tools\adb.exe" -s !EMULATOR_SERIAL! shell getprop sys.boot_completed 2^>nul') do (
    set "BOOT_COMPLETE=%%B"
  )

  if "!BOOT_COMPLETE!"=="1" goto :start_expo
  ping -n 6 127.0.0.1 >nul
)

echo Timed out waiting for Android to finish booting.
exit /b 1

:start_expo
echo Launching Expo on port %EXPO_PORT%...
"%ANDROID_SDK%\platform-tools\adb.exe" shell am force-stop host.exp.exponent >nul 2>nul
"%ANDROID_SDK%\platform-tools\adb.exe" reverse --remove "tcp:%EXPO_PORT%" >nul 2>nul
"%ANDROID_SDK%\platform-tools\adb.exe" reverse "tcp:%EXPO_PORT%" "tcp:%EXPO_PORT%" >nul
call npx.cmd expo start --android --localhost --clear --port %EXPO_PORT%

endlocal
