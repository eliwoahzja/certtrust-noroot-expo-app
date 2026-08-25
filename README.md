# CertTrust No-Root - Expo Android App

A React Native + Expo application for non-rooted Android phones that simplifies disabling and managing system trusted CA certificates.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Expo Dev Server
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your Android phone!

### 3. Build Standalone Installable APK (Cloud Build - No Android Studio Needed)
```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build standalone .apk file
eas build -p android --profile preview
```
EAS will generate a direct download link to install the `.apk` on any Android device without root.
