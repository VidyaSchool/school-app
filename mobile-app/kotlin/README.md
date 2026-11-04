# VIDYA School - Kotlin Android App

## Build APK (No Android Studio Required!)

Just run:
```bash
cd /home/ankit/Documents/Code/vs/mobile-app/kotlin
./build.sh
```

This uses Docker to build the APK. You only need Docker installed.

### Install Docker (if not installed):
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### After build:
APK will be at: `app/build/outputs/apk/debug/app-debug.apk`

### Install on phone:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Features
- Material 3 dark/light theme
- Custom shadcn-style components
- Working login with https://vidyaschool.vercel.app
- No Android Studio needed!
