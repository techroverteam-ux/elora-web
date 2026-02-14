# 📱 Android API Standards for Mobile Development

## 🎯 **Recommended API Levels for React Native/Expo**

### **Standard APIs for Mobile Apps:**
- **API 30 (Android 11)** - Most compatible
- **API 31 (Android 12)** - Good balance
- **API 33 (Android 13)** - Modern features
- **API 34 (Android 14)** - Latest stable

### **For Expo/React Native Development:**
```bash
# Download API 33 (Recommended)
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-33;google_apis_playstore;arm64-v8a"

# Or API 30 (Most Compatible)
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-30;google_apis_playstore;arm64-v8a"
```

## 🔧 **Quick Setup Commands**

### **1. Install API 33 (Recommended)**
```bash
# Install system image
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-33;google_apis_playstore;arm64-v8a"

# Create AVD
echo 'no' | ~/Library/Android/sdk/cmdline-tools/latest/bin/avdmanager create avd -n EloraMobile -k "system-images;android-33;google_apis_playstore;arm64-v8a" -d "pixel_6"

# Start emulator
~/Library/Android/sdk/emulator/emulator -avd EloraMobile
```

### **2. Alternative: Use Android Studio**
1. Open Android Studio
2. Tools → AVD Manager
3. Create Virtual Device
4. Choose Pixel 6
5. Download API 33 system image
6. Create AVD

## 📊 **API Level Comparison**

| API Level | Android Version | Usage | Best For |
|-----------|----------------|-------|----------|
| API 30 | Android 11 | 85%+ | Maximum compatibility |
| API 31 | Android 12 | 80%+ | Good balance |
| API 33 | Android 13 | 70%+ | Modern features |
| API 34 | Android 14 | 50%+ | Latest features |

## ✅ **For Your Elora Mobile App:**
**Use API 33 (Android 13)** - Best balance of:
- Modern features
- Good device coverage
- Expo compatibility
- React Native support

## 🚀 **Quick Start:**
```bash
# If you have Android Studio, use it to create emulator
# Otherwise, install API 33 manually and create AVD
```