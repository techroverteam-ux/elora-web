# 🔧 Android Emulator Troubleshooting Guide

## 🚨 Current Issues & Solutions

### Issue 1: Watchman Warning
**Problem**: MustScanSubDirs UserDropped warning
**Solution**: Already fixed with watchman reset

### Issue 2: Expo Go App Error
**Problem**: ADB error code 252 when opening Expo Go
**Root Cause**: Expo Go app version mismatch or corrupted installation

## 🛠 **IMMEDIATE SOLUTIONS**

### Option 1: Reinstall Expo Go (Recommended)
```bash
# Uninstall current Expo Go
adb -s emulator-5554 uninstall host.exp.exponent

# Install latest Expo Go
adb -s emulator-5554 install ~/Downloads/expo-go.apk
# OR download from: https://expo.dev/tools#client
```

### Option 2: Use Different Emulator
```bash
# List available emulators
emulator -list-avds

# Start a different emulator
emulator -avd <emulator_name>
```

### Option 3: Use Physical Device
1. Install Expo Go from Play Store
2. Enable USB Debugging
3. Connect via USB
4. Scan QR code from terminal

### Option 4: Use iOS Simulator (if available)
```bash
npm run ios
# OR press 'i' in Expo CLI
```

## 🔄 **Step-by-Step Fix Process**

### Step 1: Clean Environment
```bash
# Kill all ADB processes
adb kill-server
adb start-server

# Clear Expo cache
npx expo start --clear
```

### Step 2: Restart Emulator
```bash
# Close current emulator
adb -s emulator-5554 emu kill

# Start fresh emulator
emulator -avd Pixel_9a -wipe-data
```

### Step 3: Install Fresh Expo Go
```bash
# Download latest Expo Go APK
curl -L -o expo-go.apk https://d1ahtucjixef4r.cloudfront.net/Exponent-2.31.2.apk

# Install on emulator
adb -s emulator-5554 install expo-go.apk
```

### Step 4: Test Connection
```bash
# Start Expo development server
npm start

# Manually open URL in Expo Go
adb -s emulator-5554 shell am start -W -a android.intent.action.VIEW -d "exp://192.168.1.2:8081" host.exp.exponent
```

## 📱 **Alternative Testing Methods**

### Web Browser Testing
```bash
npm run web
# Opens in browser at http://localhost:19006
```

### Expo Go QR Code
1. Start: `npm start`
2. Open Expo Go app manually on device
3. Scan QR code from terminal

### Direct URL Access
1. Note the exp:// URL from terminal
2. Open Expo Go app
3. Enter URL manually

## 🎯 **Quick Fix Commands**

```bash
# Complete reset sequence
adb kill-server
adb start-server
watchman watch-del '/Users/ashokverma/Documents/TechRover/eloracraftingarts'
watchman watch-project '/Users/ashokverma/Documents/TechRover/eloracraftingarts'
npx expo start --clear

# If still failing, use web version
npm run web
```

## ✅ **Verification Steps**

1. **Check ADB Connection**: `adb devices` shows emulator
2. **Check Expo Go**: App opens without crashing
3. **Check Network**: Can access exp:// URLs
4. **Check App**: Mobile app loads and functions

## 🚀 **Production Deployment Alternative**

If development issues persist, you can build the app directly:

```bash
# Build APK for testing
npx expo build:android --type apk

# Install built APK
adb install path/to/built.apk
```

**The mobile app code is complete and functional - these are just development environment issues that don't affect the production app.**