#!/usr/bin/env bash
# Essai de l'APK sur l'émulateur de GitHub Actions : installe, lance, puis
# note si Chrome ouvre le site en plein écran (lien vérifié par
# /.well-known/assetlinks.json) ou avec une barre d'adresse. Captures et
# journaux dans android/dist/.
set -x
OUT=android/dist
mkdir -p "$OUT"
# L'APK signé du site s'il existe, sinon celui de débogage.
APK=android/app/build/outputs/apk/debug/app-debug.apk
[ -s public/message-me.apk ] && APK=public/message-me.apk
adb install -r "$APK"
adb shell dumpsys package com.android.chrome | grep -m1 versionName
# Sans écran d'accueil de Chrome au premier lancement.
adb shell 'echo "_ --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'
adb shell am set-debug-app --persistent com.android.chrome
adb shell am force-stop com.android.chrome
adb shell am start -W -n io.github.cybers1te.messageme/com.google.androidbrowserhelper.trusted.LauncherActivity
for i in 1 2 3 4; do
  sleep 10
  adb exec-out screencap -p > "$OUT/shot-$i.png"
done
adb shell uiautomator dump /sdcard/ui.xml
if adb shell cat /sdcard/ui.xml | grep -q 'com.android.chrome:id/url_bar\|com.android.chrome:id/title_bar\|com.android.chrome:id/close_button'; then
  echo "RESULTAT: barre d'adresse visible ($APK)"
else
  echo "RESULTAT: plein écran ($APK)"
fi
adb shell dumpsys package io.github.cybers1te.messageme | grep -E "versionName|Activity|Service|permission" | head -40 > "$OUT/package.txt"
adb logcat -d | grep -iE "TrustedWebActivity|LauncherActivity|androidbrowserhelper|TwaLauncher|OriginVerifier|Verif|AndroidRuntime|FATAL" | tail -80 > "$OUT/logcat.txt"
grep -iE "OriginVerifier|Verif" "$OUT/logcat.txt" | tail -10
exit 0
