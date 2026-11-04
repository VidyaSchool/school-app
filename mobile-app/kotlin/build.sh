#!/bin/bash
set -e

echo "🔨 Building VIDYA School Android APK using Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Build using Docker
docker run --rm -v "$(pwd)":/project -w /project mingc/android-build-box:latest bash -c "./gradlew assembleDebug --no-daemon"

echo ""
echo "✅ Build successful!"
echo "📦 APK location: app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "To install on device:"
echo "  adb install app/build/outputs/apk/debug/app-debug.apk"
