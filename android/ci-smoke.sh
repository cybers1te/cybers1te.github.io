#!/usr/bin/env bash
# Essai de l'APK de débogage sur l'émulateur de GitHub Actions : installe,
# lance, puis prend des captures d'écran dans android/dist/.
set -x
OUT=android/dist
mkdir -p "$OUT"
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell dumpsys package com.android.chrome | grep -m1 versionName
# Sans écran d'accueil de Chrome au premier lancement.
adb shell 'echo "_ --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'
adb shell am set-debug-app --persistent com.android.chrome
adb shell am force-stop com.android.chrome
adb shell am start -W -n io.github.cybers1te.messageme/com.google.androidbrowserhelper.trusted.LauncherActivity
for i in 1 2 3 4 5 6; do
  sleep 10
  adb exec-out screencap -p > "$OUT/shot-$i.png"
  adb shell dumpsys activity activities | grep -m2 -E "topResumedActivity|mResumedActivity"
done
adb shell dumpsys package io.github.cybers1te.messageme | grep -E "versionName|Activity|Service|permission" | head -40 > "$OUT/package.txt"
adb logcat -d | grep -iE "TrustedWebActivity|LauncherActivity|androidbrowserhelper|TwaLauncher|AndroidRuntime|FATAL|cr_TWA|cr_Custom" | tail -80 > "$OUT/logcat.txt"
exit 0
