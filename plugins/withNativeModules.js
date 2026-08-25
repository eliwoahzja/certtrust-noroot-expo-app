const {
  withDangerousMod,
  withAppBuildGradle,
  withMainApplication,
  withAndroidManifest,
  createRunOncePlugin,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PKG_PATH = 'com/certmanager/noroot';

/**
 * 1. Copy Kotlin native source files into generated android project during prebuild
 */
const withNativeSourceFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidSrcDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        PKG_PATH
      );

      // Create destination directory
      if (!fs.existsSync(androidSrcDir)) {
        fs.mkdirSync(androidSrcDir, { recursive: true });
      }

      // Source files locations in project
      const sourceDir = path.join(projectRoot, 'native', PKG_PATH);
      const fallbackSourceDir = path.join(projectRoot, 'native');

      const kotlinFiles = [
        'ShizukuExecutorModule.kt',
        'DeviceOwnerDpcModule.kt',
        'CertTrustPackage.kt',
      ];

      for (const fileName of kotlinFiles) {
        let srcFile = path.join(sourceDir, fileName);
        if (!fs.existsSync(srcFile)) {
          srcFile = path.join(fallbackSourceDir, fileName);
        }

        if (fs.existsSync(srcFile)) {
          const destFile = path.join(androidSrcDir, fileName);
          fs.copyFileSync(srcFile, destFile);
        }
      }

      return config;
    },
  ]);
};

/**
 * 2. Add Shizuku gradle dependencies to app/build.gradle
 */
const withShizukuGradleDependencies = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    const shizukuDeps = `
    // Shizuku API (No-Root Wireless ADB Binder)
    implementation 'dev.rikka.shizuku:api:13.1.0'
    implementation 'dev.rikka.shizuku:provider:13.1.0'
`;

    if (!contents.includes('dev.rikka.shizuku:api')) {
      if (contents.includes('dependencies {')) {
        contents = contents.replace('dependencies {', `dependencies {${shizukuDeps}`);
      } else {
        contents += `\ndependencies {${shizukuDeps}\n}\n`;
      }
      config.modResults.contents = contents;
    }
    return config;
  });
};

/**
 * 3. Register CertTrustPackage in MainApplication (Kotlin & Java support)
 */
const withCertTrustPackage = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const isKotlin = config.modResults.language === 'kt' || contents.includes('class MainApplication :');

    if (!contents.includes('CertTrustPackage')) {
      if (isKotlin) {
        // Kotlin package list insertion (same package, no import needed)
        if (contents.includes('PackageList(this).packages.apply {')) {
          contents = contents.replace(
            'PackageList(this).packages.apply {',
            'PackageList(this).packages.apply {\n              add(CertTrustPackage())'
          );
        } else if (contents.includes('PackageList(this).packages')) {
          contents = contents.replace(
            'PackageList(this).packages',
            'PackageList(this).packages.apply {\n              add(CertTrustPackage())\n            }'
          );
        } else if (contents.includes('override fun getPackages(): List<ReactPackage>')) {
          contents = contents.replace(
            'override fun getPackages(): List<ReactPackage> =',
            'override fun getPackages(): List<ReactPackage> =\n            PackageList(this).packages.apply { add(CertTrustPackage()) } //'
          );
        }
      } else {
        // Java imports
        if (!contents.includes('import com.certmanager.noroot.CertTrustPackage;')) {
          contents = 'import com.certmanager.noroot.CertTrustPackage;\n' + contents;
        }
        // Java package list insertion
        if (contents.includes('new PackageList(this).getPackages()')) {
          contents = contents.replace(
            'List<ReactPackage> packages = new PackageList(this).getPackages();',
            'List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new CertTrustPackage());'
          );
        }
      }
      config.modResults.contents = contents;
    }
    return config;
  });
};

/**
 * 4. Add Shizuku permission to AndroidManifest.xml
 */
const withShizukuPermissions = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = androidManifest['uses-permission'];
    const requiredPermission = 'rikka.shizuku.permission.API_V23';

    const hasPerm = permissions.some(
      (perm) => perm.$ && perm.$['android:name'] === requiredPermission
    );

    if (!hasPerm) {
      permissions.push({
        $: {
          'android:name': requiredPermission,
        },
      });
    }

    return config;
  });
};

/**
 * 4b. Inject ShizukuProvider ContentProvider into AndroidManifest.xml
 *     Required for Shizuku binder initialization; the provider AAR does not auto-merge it.
 */
const withShizukuProvider = (config) => {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/AndroidManifest.xml'
      );
      let contents = fs.readFileSync(manifestPath, 'utf8');
      if (!contents.includes('rikka.shizuku.ShizukuProvider')) {
        const provider = `
    <provider
      android:name="rikka.shizuku.ShizukuProvider"
      android:authorities="${'${applicationId}'}.shizuku"
      android:multiprocess="false"
      android:enabled="true"
      android:exported="true"
      android:permission="android.permission.INTERACT_ACROSS_USERS_FULL" />`;
        // Insert provider just before closing </application>
        contents = contents.replace('</application>', `${provider}\n  </application>`);
        fs.writeFileSync(manifestPath, contents, 'utf8');
      }
      return config;
    },
  ]);
};

/**
 * 5. Bump minSdkVersion to 24 (required by Shizuku API 13.1.5 manifest merger)
 *    Writes into gradle.properties AND patches build.gradle after prebuild.
 */
const withMinSdk24 = (config) => {
  // 5a. Set android.minSdkVersion=24 in gradle.properties
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const propsPath = path.join(config.modRequest.platformProjectRoot, 'gradle.properties');
      let contents = fs.existsSync(propsPath) ? fs.readFileSync(propsPath, 'utf8') : '';
      const prop = 'android.minSdkVersion';
      const regex = new RegExp(`^${prop}=.*$`, 'm');
      if (regex.test(contents)) {
        contents = contents.replace(regex, `${prop}=24`);
      } else {
        contents = `${contents.trim()}\n${prop}=24\n`;
      }
      fs.writeFileSync(propsPath, contents, 'utf8');
      return config;
    },
  ]);

  // 5b. Also patch build.gradle to replace the fallback '23' with '24'
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const gradlePath = path.join(config.modRequest.platformProjectRoot, 'build.gradle');
      if (fs.existsSync(gradlePath)) {
        let contents = fs.readFileSync(gradlePath, 'utf8');
        if (contents.includes("findProperty('android.minSdkVersion') ?: '23'")) {
          contents = contents.replace("findProperty('android.minSdkVersion') ?: '23'", "findProperty('android.minSdkVersion') ?: '24'");
          fs.writeFileSync(gradlePath, contents, 'utf8');
        }
      }
      return config;
    },
  ]);

  return config;
};

const withNativeModules = (config) => {
  config = withNativeSourceFiles(config);
  config = withShizukuGradleDependencies(config);
  config = withCertTrustPackage(config);
  config = withShizukuPermissions(config);
  config = withShizukuProvider(config);
  config = withMinSdk24(config);
  return config;
};

module.exports = createRunOncePlugin(withNativeModules, 'withNativeModules', '1.2.0');
