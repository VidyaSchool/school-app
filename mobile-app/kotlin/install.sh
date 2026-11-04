#!/bin/bash
set -e

echo "🔨 Building and installing VIDYA School on device..."
echo ""

# Check device
adb devices | grep -w "device" > /dev/null || {
    echo "❌ No device connected or not authorized"
    echo "Please:"
    echo "  1. Connect device via USB"
    echo "  2. Enable USB debugging"
    echo "  3. Accept authorization popup on phone"
    exit 1
}

# Build APK
echo "📦 Building APK..."
docker run --rm -v "$(pwd)":/project -w /project mingc/android-build-box:latest bash -c "./gradlew assembleDebug --no-daemon"

# Install on device
echo ""
echo "📱 Installing on device..."
adb install -r app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "✅ App installed successfully!"
echo "🚀 Launch 'VIDYA School' from your phone"
