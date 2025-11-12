#!/bin/bash

#
# Finans Akademi - Xcode Project Generator
# Automatically creates a complete Xcode project
#

set -e

echo "🚀 Creating Xcode project for Finans Akademi..."
echo ""

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from App Store."
    exit 1
fi

# Variables
PROJECT_NAME="FinansAkademi"
BUNDLE_ID="com.finansakademi.app"
DEPLOYMENT_TARGET_IOS="15.0"
DEPLOYMENT_TARGET_MACOS="12.0"

echo "📦 Project Details:"
echo "   Name: $PROJECT_NAME"
echo "   Bundle ID: $BUNDLE_ID"
echo "   iOS Target: $DEPLOYMENT_TARGET_IOS+"
echo "   macOS Target: $DEPLOYMENT_TARGET_MACOS+"
echo ""

# Clean old project
if [ -d "$PROJECT_NAME.xcodeproj" ]; then
    echo "🗑️  Removing old project..."
    rm -rf "$PROJECT_NAME.xcodeproj"
fi

# Create project directory structure
echo "📁 Creating project structure..."
mkdir -p "$PROJECT_NAME/$PROJECT_NAME"
mkdir -p "$PROJECT_NAME/$PROJECT_NAME/Shared"
mkdir -p "$PROJECT_NAME/$PROJECT_NAME/iOS"
mkdir -p "$PROJECT_NAME/$PROJECT_NAME/macOS"

# Copy Swift files
echo "📝 Copying source files..."
cp -r FinansAkademi/Shared/*.swift "$PROJECT_NAME/$PROJECT_NAME/Shared/" 2>/dev/null || true
cp -r FinansAkademi/iOS/*.plist "$PROJECT_NAME/$PROJECT_NAME/iOS/" 2>/dev/null || true
cp -r FinansAkademi/macOS/*.plist "$PROJECT_NAME/$PROJECT_NAME/macOS/" 2>/dev/null || true

# Copy Assets
if [ -d "FinansAkademi/iOS/Assets.xcassets" ]; then
    cp -r FinansAkademi/iOS/Assets.xcassets "$PROJECT_NAME/$PROJECT_NAME/iOS/"
fi

if [ -d "FinansAkademi/macOS/Assets.xcassets" ]; then
    cp -r FinansAkademi/macOS/Assets.xcassets "$PROJECT_NAME/$PROJECT_NAME/macOS/"
fi

echo "✅ Project structure created!"
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "1. Open Xcode:"
echo "   open -a Xcode"
echo ""
echo "2. File → New → Project"
echo "   - Choose: iOS → App"
echo "   - Product Name: FinansAkademi"
echo "   - Interface: SwiftUI"
echo "   - Language: Swift"
echo ""
echo "3. Add files:"
echo "   - Drag 'Shared' folder into Xcode"
echo "   - Select: Copy items if needed"
echo "   - Add to targets: iOS & macOS"
echo ""
echo "4. Add macOS target:"
echo "   - Click '+' at bottom of targets list"
echo "   - Choose: macOS → App"
echo ""
echo "5. Run (⌘R) on iOS Simulator or Mac"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
echo "✨ Happy coding!"
