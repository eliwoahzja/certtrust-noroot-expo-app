# CertTrust No-Root - Android CA Manager

A React Native + Expo application for non-rooted Android phones (package: `com.certmanager.noroot`).

## Architecture & Native Modules
- **Managed Expo Workflow**: Configured via `plugins/withNativeModules.js` using `@expo/config-plugins`.
- **Shizuku Wireless ADB Bridge**: Native module (`ShizukuExecutorModule.kt` + `CertTrustPackage.kt`) running privileged shell commands without root or PC.
- **Dynamic Permission Dialog**: Handles runtime permission requests via `Shizuku.requestPermission()`.
- **Honest Feedback**: Real exit code and output validation with fallback to Android Settings (`TRUSTED_CREDENTIALS`).

## Build Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Config Plugin & Prebuild
```bash
npx expo prebuild --platform android --clean
```

### 3. Build Standalone Installable APK via EAS
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
