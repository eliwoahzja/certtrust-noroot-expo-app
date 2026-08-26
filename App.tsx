import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Linking,
  TextInput,
  NativeModules,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { ShizukuExecutor, DeviceOwnerDpc } = NativeModules;
const { width: SCREEN_W } = Dimensions.get('window');

const MAKER = 'eliwoahzja';
const MAKER_GITHUB = 'https://github.com/eliwoahzja';
const APP_VERSION = '2.1.0';
const GITHUB_REPO = 'eliwoahzja/certtrust-noroot-expo-app';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface CertItem {
  id: string;
  name: string;
  category: string;
  androidSystemName: string;
  hash: string;
  enabled: boolean;
}

interface ShizukuStatus {
  available: boolean;
  granted: boolean;
  uid?: number;
  version?: number;
  isRoot?: boolean;
  message?: string;
}

interface CertCapability {
  sdkInt: number;
  manufacturer: string;
  model: string;
  cacertsRemovedWritable: boolean;
  cacertsRemovedPath: string;
  cmdDevicePolicyAvailable: boolean;
  mountRemountCapable: boolean;
  canDisableCerts: boolean;
}

interface CommandResult {
  success: boolean;
  exitCode?: number;
  output?: string;
  error?: string;
}

const INITIAL_CERTS: CertItem[] = [
  // [ALL AMAZON]
  { id: 'amzn-1', name: 'Amazon Root CA 1', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 1', hash: '2c543f86.0', enabled: true },
  { id: 'amzn-2', name: 'Amazon Root CA 2', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 2', hash: 'ce5e74ee.0', enabled: true },
  { id: 'amzn-3', name: 'Amazon Root CA 3', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 3', hash: '69105f4f.0', enabled: true },
  { id: 'amzn-4', name: 'Amazon Root CA 4', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 4', hash: '544e3a20.0', enabled: true },

  // [BALTIMORE]
  { id: 'balt-1', name: 'Baltimore CyberTrust Root', category: 'Baltimore', androidSystemName: 'Baltimore CyberTrust Root', hash: '0107ee40.0', enabled: true },

  // [ALL COMODO]
  { id: 'comodo-1', name: 'AAA Certificate Services', category: 'Comodo', androidSystemName: 'Comodo CA Limited / AAA Certificate Services', hash: 'd1b54434.0', enabled: true },
  { id: 'comodo-2', name: 'COMODO Certification Authority', category: 'Comodo', androidSystemName: 'COMODO CA Limited / COMODO Certification Authority', hash: 'afe54378.0', enabled: true },
  { id: 'comodo-3', name: 'COMODO ECC Certification Authority', category: 'Comodo', androidSystemName: 'COMODO CA Limited / COMODO ECC Certification Authority', hash: '9339512a.0', enabled: true },
  { id: 'comodo-4', name: 'COMODO RSA Certification Authority', category: 'Comodo', androidSystemName: 'COMODO CA Limited / COMODO RSA Certification Authority', hash: 'd6325660.0', enabled: true },

  // [ALL DIGICERT INC]
  { id: 'digi-1', name: 'DigiCert Assured ID Root CA', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Assured ID Root CA', hash: '399e7759.0', enabled: true },
  { id: 'digi-2', name: 'DigiCert Assured ID Root G2', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Assured ID Root G2', hash: 'b1159c4c.0', enabled: true },
  { id: 'digi-3', name: 'DigiCert Assured ID Root G3', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Assured ID Root G3', hash: '8cb5ee0f.0', enabled: true },
  { id: 'digi-4', name: 'DigiCert Global Root CA', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Global Root CA', hash: '35105088.0', enabled: true },
  { id: 'digi-5', name: 'DigiCert Global Root G2', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Global Root G2', hash: 'df36569e.0', enabled: true },
  { id: 'digi-6', name: 'DigiCert Global Root G3', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Global Root G3', hash: '1d7556f8.0', enabled: true },
  { id: 'digi-7', name: 'DigiCert High Assurance EV Root CA', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert High Assurance EV Root CA', hash: '244b5494.0', enabled: true },
  { id: 'digi-8', name: 'DigiCert Trusted Root G4', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Trusted Root G4', hash: 'dd8e9d41.0', enabled: true },

  // [ALL ENTRUST, INC]
  { id: 'ent-1', name: 'Entrust Root Certification Authority', category: 'Entrust, Inc', androidSystemName: 'Entrust Inc. / Entrust Root Certification Authority', hash: '455f1b52.0', enabled: true },
  { id: 'ent-2', name: 'Entrust Root Certification Authority - EC1', category: 'Entrust, Inc', androidSystemName: 'Entrust Inc. / Entrust Root Certification Authority - EC1', hash: 'ba894455.0', enabled: true },
  { id: 'ent-3', name: 'Entrust Root Certification Authority - G2', category: 'Entrust, Inc', androidSystemName: 'Entrust Inc. / Entrust Root Certification Authority - G2', hash: '8d6437c3.0', enabled: true },

  // [ALL ENTRUST.NET]
  { id: 'entnet-1', name: 'Entrust.net Certification Authority (2048)', category: 'Entrust.net', androidSystemName: 'Entrust.net / Entrust.net Certification Authority (2048)', hash: '5a3f0ff8.0', enabled: true },

  // [ALL GLOBALSIGN]
  { id: 'gs-1', name: 'GlobalSign Root R1', category: 'GlobalSign', androidSystemName: 'GlobalSign nv-sa / GlobalSign Root CA (R1)', hash: 'b0ed035a.0', enabled: true },
  { id: 'gs-2', name: 'GlobalSign Root R2', category: 'GlobalSign', androidSystemName: 'GlobalSign / GlobalSign Root CA - R2', hash: '75680d2e.0', enabled: true },
  { id: 'gs-3', name: 'GlobalSign Root R3', category: 'GlobalSign', androidSystemName: 'GlobalSign / GlobalSign Root CA - R3', hash: 'd647e30d.0', enabled: true },
  { id: 'gs-4', name: 'GlobalSign Root ECC - R4', category: 'GlobalSign', androidSystemName: 'GlobalSign / GlobalSign ECC Root CA - R4', hash: '5a2b1c8e.0', enabled: true },
  { id: 'gs-5', name: 'GlobalSign Root CA (GlobalSign nv-sa)', category: 'GlobalSign', androidSystemName: 'GlobalSign nv-sa / GlobalSign Root CA', hash: '2e8714cb.0', enabled: true },

  // [GODADDY.COM, INC]
  { id: 'godaddy-1', name: 'Go Daddy Root Certificate Authority - G2', category: 'GoDaddy.com, Inc', androidSystemName: 'GoDaddy.com, Inc. / Go Daddy Root Certificate Authority - G2', hash: '276a086b.0', enabled: true },

  // [ALL SSL CORPORATION]
  { id: 'ssl-1', name: 'SSL.com EV Root Certification Authority ECC', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com EV Root Certification Authority ECC', hash: '48dc7396.0', enabled: true },
  { id: 'ssl-2', name: 'SSL.com EV Root Certification Authority RSA R2', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com EV Root Certification Authority RSA R2', hash: '7651b327.0', enabled: true },
  { id: 'ssl-3', name: 'SSL.com Root Certification Authority ECC', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com Root Certification Authority ECC', hash: '9e735d4f.0', enabled: true },
  { id: 'ssl-4', name: 'SSL.com Root Certification Authority RSA', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com Root Certification Authority RSA', hash: '4cd65995.0', enabled: true },
];

/**
 * Strip raw shell dumps (usage text, stack traces) down to a single
 * human-readable line so popups never show walls of terminal output.
 */
const sanitizeError = (raw?: string): string => {
  if (!raw) return 'Unknown error';
  let msg = raw;
  // Cut everything from the usage/help dump onwards
  for (const marker of ['Usage:', 'usage:', 'Prints this help', 'at com.', 'Exception:']) {
    const idx = msg.indexOf(marker);
    if (idx > -1) msg = msg.slice(0, idx);
  }
  msg = msg.trim();
  if (/unknown command/i.test(msg)) return 'Command not supported on this device (OEM restriction).';
  if (/permission denied|lacks write permission|not permitted/i.test(msg)) return 'Shell user lacks permission to modify the certificate store on this OEM build.';
  if (/UNSUPPORTED/i.test(msg)) return 'Automated certificate management is not supported on this device.';
  const firstLine = msg.split('\n').map((l) => l.trim()).filter(Boolean)[0];
  return firstLine || 'Unknown error';
};

// Pressable card with springy press animation
function PressCard({
  onPress,
  style,
  children,
  disabled,
}: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animate(0.97)}
      onPressOut={() => animate(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function App() {
  const [certs, setCerts] = useState<CertItem[]>(INITIAL_CERTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [shizukuStatus, setShizukuStatus] = useState<ShizukuStatus>({ available: false, granted: false });
  const [isCheckingShizuku, setIsCheckingShizuku] = useState(true);
  const [certCapability, setCertCapability] = useState<CertCapability | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [aboutVisible, setAboutVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; downloadUrl: string; releaseUrl: string; notes: string } | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(true);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logDetails, setLogDetails] = useState<{ title: string; content: string; isError?: boolean }>({
    title: '',
    content: '',
  });

  const total = certs.length;
  const disabledCount = certs.filter((c) => !c.enabled).length;
  const activeCount = total - disabledCount;
  const categories = ['All', ...Array.from(new Set(INITIAL_CERTS.map((c) => c.category)))];

  useEffect(() => {
    checkShizukuState();
    checkForUpdates();
  }, []);

  const checkShizukuState = async () => {
    setIsCheckingShizuku(true);
    if (ShizukuExecutor && ShizukuExecutor.checkShizukuPermission) {
      try {
        const res: ShizukuStatus = await ShizukuExecutor.checkShizukuPermission();
        setShizukuStatus(res);
        if (res.available && res.granted && ShizukuExecutor.checkCertManagementCapability) {
          try {
            const cap: CertCapability = await ShizukuExecutor.checkCertManagementCapability();
            setCertCapability(cap);
          } catch (capErr: any) {
            setCertCapability({
              sdkInt: 0, manufacturer: 'unknown', model: 'unknown',
              cacertsRemovedWritable: false, cacertsRemovedPath: '',
              cmdDevicePolicyAvailable: false, mountRemountCapable: false,
              canDisableCerts: false,
            });
          }
        }
      } catch (err: any) {
        setShizukuStatus({ available: false, granted: false, message: err?.message || 'Failed to inspect Shizuku binder' });
      }
    } else {
      setShizukuStatus({
        available: false,
        granted: false,
        message: 'Native Shizuku module not loaded (running in Expo Go or non-Android environment).',
      });
    }
    setIsCheckingShizuku(false);
  };

  const handleRequestPermission = async () => {
    if (!ShizukuExecutor || !ShizukuExecutor.requestShizukuPermission) {
      Alert.alert('Native Module Not Available', 'ShizukuExecutor native bridge is only available in standalone builds.');
      return;
    }
    try {
      const res = await ShizukuExecutor.requestShizukuPermission();
      if (res && res.granted) {
        Alert.alert('Permission Granted', 'Shizuku wireless ADB bridge is now connected and ready.');
        checkShizukuState();
      } else {
        Alert.alert('Permission Denied', 'Shizuku access was not granted.');
        checkShizukuState();
      }
    } catch (err: any) {
      Alert.alert('Permission Request Error', err?.message || 'Failed to trigger Shizuku permission dialog.');
      checkShizukuState();
    }
  };

  /**
   * Compare two semver-like version strings (e.g. "2.1.0" vs "2.0.0").
   * Returns true if `latest` is strictly newer than `current`.
   */
  const isNewerVersion = (current: string, latest: string): boolean => {
    const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const [cMaj, cMin = 0, cPat = 0] = parse(current);
    const [lMaj, lMin = 0, lPat = 0] = parse(latest);
    if (lMaj !== cMaj) return lMaj > cMaj;
    if (lMin !== cMin) return lMin > cMin;
    return lPat > cPat;
  };

  const checkForUpdates = async () => {
    try {
      const res = await fetch(GITHUB_API);
      if (!res.ok) return;
      const data = await res.json();
      const latestVersion = data.tag_name?.replace(/^v/, '');
      if (!latestVersion || !isNewerVersion(APP_VERSION, latestVersion)) {
        setIsCheckingUpdate(false);
        return;
      }
      // Find the APK asset
      const apkAsset = (data.assets || []).find((a: any) =>
        a.name?.endsWith('.apk') || a.content_type?.includes('android')
      );
      setUpdateInfo({
        version: latestVersion,
        downloadUrl: apkAsset?.browser_download_url || data.html_url,
        releaseUrl: data.html_url,
        notes: data.body?.trim() || '',
      });
    } catch {
      // Silently ignore network errors — update check is non-critical
    }
    setIsCheckingUpdate(false);
  };

  const openAndroidCredentialsSettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await Linking.sendIntent('android.settings.SECURITY_SETTINGS');
      } catch (e) {
        try {
          await Linking.openURL('intent:#Intent;action=com.android.settings.TRUSTED_CREDENTIALS;end');
        } catch (err) {
          await Linking.openSettings();
        }
      }
    } else {
      Alert.alert('Non-Android Device', 'This quick launcher directs to Android OS Trusted Credentials.');
    }
  };

  /**
   * Execute real certificate disable command via Shizuku shell.
   */
  const executeDisableCert = async (hash: string): Promise<CommandResult> => {
    if (!ShizukuExecutor || !ShizukuExecutor.executeShizukuCommand) {
      return { success: false, error: 'Shizuku native module not loaded.' };
    }

    const removedDir = certCapability?.cacertsRemovedPath || '/data/misc/user/0/cacerts-removed';
    const canUseRemoved = certCapability?.cacertsRemovedWritable ?? true;
    const canUseDpc = certCapability?.cmdDevicePolicyAvailable ?? false;

    let script: string;
    if (canUseRemoved) {
      script = `HASH="${hash}"; SRC="/system/etc/security/cacerts/$HASH"; if [ -f "$SRC" ]; then cp "$SRC" "${removedDir}/$HASH" && chmod 644 "${removedDir}/$HASH" 2>/dev/null; if [ -f "${removedDir}/$HASH" ]; then echo "SUCCESS: Disabled via ${removedDir}"; exit 0; fi; fi; echo "FAIL"; exit 1`;
    } else if (canUseDpc) {
      script = `cmd device_policy set-ca-cert-enabled "${hash}" false 2>/dev/null && echo "SUCCESS: Disabled via device_policy" && exit 0; echo "FAIL"; exit 1`;
    } else {
      script = `HASH="${hash}"
SRC="/system/etc/security/cacerts/$HASH"

# Approach 1: Write to cacerts-removed (standard no-root approach)
for d in /data/misc/user/0/cacerts-removed /data/misc/keychain/cacerts-removed; do
  if [ -d "$d" ] && [ -w "$d" ]; then
    if [ -f "$SRC" ]; then
      cp "$SRC" "$d/$HASH" && chmod 644 "$d/$HASH" 2>/dev/null
      if [ -f "$d/$HASH" ]; then echo "SUCCESS: Disabled via $d"; exit 0; fi
    fi
  fi
done

# Approach 2: Create cacerts-removed dir and try again
mkdir -p /data/misc/user/0/cacerts-removed 2>/dev/null
if [ -d /data/misc/user/0/cacerts-removed ] && [ -w /data/misc/user/0/cacerts-removed ] && [ -f "$SRC" ]; then
  cp "$SRC" /data/misc/user/0/cacerts-removed/$HASH && chmod 644 /data/misc/user/0/cacerts-removed/$HASH 2>/dev/null
  if [ -f /data/misc/user/0/cacerts-removed/$HASH ]; then echo "SUCCESS: Disabled via newly created dir"; exit 0; fi
fi

# Approach 3: cmd device_policy (Android 14+)
cmd device_policy set-ca-cert-enabled "$HASH" false 2>/dev/null
if [ $? -eq 0 ]; then echo "SUCCESS: Disabled via device_policy"; exit 0; fi
cmd devicepolicy set-ca-cert-enabled "$HASH" false 2>/dev/null
if [ $? -eq 0 ]; then echo "SUCCESS: Disabled via devicepolicy"; exit 0; fi

# Approach 4: Try to remount /system and write directly
mount -o rw,remount / 2>/dev/null
if [ $? -eq 0 ]; then
  if [ -f "$SRC" ]; then
    mv "$SRC" "$SRC.disabled" 2>/dev/null && echo "SUCCESS: Disabled via system remount"; exit 0
  fi
  mount -o ro,remount / 2>/dev/null
fi

echo "UNSUPPORTED: This device's OEM restricts automated certificate management."
exit 1
`;
    }

    try {
      const res: CommandResult = await ShizukuExecutor.executeShizukuCommand(script);
      return res;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Execution error' };
    }
  };

  /**
   * Execute real certificate enable/restore command via Shizuku shell.
   */
  const executeEnableCert = async (hash: string): Promise<CommandResult> => {
    if (!ShizukuExecutor || !ShizukuExecutor.executeShizukuCommand) {
      return { success: false, error: 'Shizuku native module not loaded.' };
    }

    const removedDir = certCapability?.cacertsRemovedPath || '/data/misc/user/0/cacerts-removed';
    const canUseRemoved = certCapability?.cacertsRemovedWritable ?? true;
    const canUseDpc = certCapability?.cmdDevicePolicyAvailable ?? false;

    let script: string;
    if (canUseRemoved) {
      script = `HASH="${hash}"; REMOVED=0; for d in ${removedDir} /data/misc/user/0/cacerts-removed /data/misc/keychain/cacerts-removed; do if [ -f "$d/$HASH" ]; then rm -f "$d/$HASH" && REMOVED=1; fi; done; if [ $REMOVED -eq 1 ]; then echo "SUCCESS: Restored $HASH"; exit 0; fi; echo "STATUS: Already enabled"; exit 0`;
    } else if (canUseDpc) {
      script = `cmd device_policy set-ca-cert-enabled "${hash}" true 2>/dev/null; echo "SUCCESS: Restored via device_policy"; exit 0`;
    } else {
      script = `HASH="${hash}"
REMOVED=0

for d in /data/misc/user/0/cacerts-removed /data/misc/keychain/cacerts-removed; do
  if [ -f "$d/$HASH" ]; then
    rm -f "$d/$HASH" && REMOVED=1
  fi
done

cmd device_policy set-ca-cert-enabled "$HASH" true 2>/dev/null
DPC_OK=$?

if [ "$REMOVED" = "0" ] && [ $DPC_OK -ne 0 ]; then
  mount -o rw,remount / 2>/dev/null
  if [ -f /system/etc/security/cacerts/$HASH.disabled ]; then
    mv /system/etc/security/cacerts/$HASH.disabled /system/etc/security/cacerts/$HASH 2>/dev/null
    mount -o ro,remount / 2>/dev/null
    echo "SUCCESS: Restored $HASH from system"
    exit 0
  fi
  mount -o ro,remount / 2>/dev/null
fi

if [ "$REMOVED" = "1" ] || [ $DPC_OK -eq 0 ]; then
  echo "SUCCESS: Restored $HASH"
  exit 0
fi

echo "STATUS: Certificate was not found in removed directory or already enabled."
exit 0
`;
    }

    try {
      const res: CommandResult = await ShizukuExecutor.executeShizukuCommand(script);
      return res;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Execution error' };
    }
  };

  const showUnsupportedSheet = (title: string, detail?: string) => {
    setLogDetails({
      title,
      content:
        `${detail ? detail + '\n\n' : ''}` +
        `Your device's OEM restricts shell-level (UID 2000) certificate changes.\n\n` +
        `Use Android's built-in Trusted Credentials screen to toggle certificates manually — tap "Open Android Settings" below.`,
      isError: true,
    });
    setLogModalVisible(true);
  };

  // Toggle single cert with honest feedback & real execution
  const toggleCert = async (cert: CertItem) => {
    const willDisable = cert.enabled;

    if (!shizukuStatus.granted) {
      Alert.alert(
        'Shizuku Not Active',
        'The Shizuku bridge is required for automated toggles.\n\nOpen the manual Android Trusted Credentials screen instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAndroidCredentialsSettings },
        ]
      );
      return;
    }

    if (certCapability && !certCapability.canDisableCerts) {
      showUnsupportedSheet(
        'Automation Not Available',
        `${certCapability.manufacturer} ${certCapability.model} (Android ${certCapability.sdkInt})`
      );
      return;
    }

    const result = willDisable ? await executeDisableCert(cert.hash) : await executeEnableCert(cert.hash);

    if (result.success) {
      setCerts((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, enabled: !willDisable } : c))
      );
    } else {
      setLogDetails({
        title: `Cannot ${willDisable ? 'Disable' : 'Enable'} ${cert.name}`,
        content: sanitizeError(result.error || result.output),
        isError: true,
      });
      setLogModalVisible(true);
    }
  };

  // Batch Disable All
  const handleMarkAllDisabled = () => {
    if (!shizukuStatus.granted) {
      Alert.alert(
        'Shizuku Required',
        'Shizuku permission is required to automate batch operations.\n\nOpen the manual Android settings instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAndroidCredentialsSettings },
        ]
      );
      return;
    }

    if (certCapability && !certCapability.canDisableCerts) {
      showUnsupportedSheet(
        'Automation Not Available',
        `${certCapability.manufacturer} ${certCapability.model} (Android ${certCapability.sdkInt})`
      );
      return;
    }

    const targetCount = certs.filter((c) => c.enabled).length;
    Alert.alert(
      'Disable All Certificates?',
      `This will attempt to disable ${targetCount} trusted root CAs via Shizuku. Apps may lose network access until restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable All', style: 'destructive', onPress: runBatchDisable },
      ]
    );
  };

  const runBatchDisable = async () => {
    setIsProcessingBatch(true);
    let successCount = 0;
    let failCount = 0;
    const failures: { name: string; error: string }[] = [];

    const targetList = certs.filter((c) => c.enabled);
    setBatchProgress({ current: 0, total: targetList.length, currentName: 'Starting batch...' });

    let abortBatch = false;

    for (let i = 0; i < targetList.length; i++) {
      const c = targetList[i];
      setBatchProgress({ current: i + 1, total: targetList.length, currentName: c.name });

      const res = await executeDisableCert(c.hash);
      if (res.success) {
        successCount++;
        setCerts((prev) => prev.map((item) => (item.id === c.id ? { ...item, enabled: false } : item)));
      } else {
        failCount++;
        failures.push({ name: c.name, error: sanitizeError(res.error || res.output) });

        // Abort early — if the first cert fails, the approach is broken on this device
        if (i === 0) {
          abortBatch = true;
          break;
        }
      }
    }

    setIsProcessingBatch(false);

    if (abortBatch) {
      showUnsupportedSheet('Automation Stopped', `Test on "${failures[0]?.name}": ${failures[0]?.error}`);
    } else if (failCount === 0) {
      Alert.alert('Batch Complete', `Successfully disabled ${successCount}/${targetList.length} certificates via Shizuku.`);
    } else {
      setLogDetails({
        title: `Batch Result: ${successCount} Succeeded, ${failCount} Failed`,
        content:
          `${successCount}/${targetList.length} certificates disabled.\n\nFailed items:\n` +
          failures.map((f) => `• ${f.name} — ${f.error}`).join('\n') +
          `\n\nUse Android's Trusted Credentials screen for the failed certificates.`,
        isError: true,
      });
      setLogModalVisible(true);
    }
  };

  // Batch Enable All
  const handleMarkAllEnabled = async () => {
    if (!shizukuStatus.granted) {
      Alert.alert('Shizuku Required', 'Shizuku permission is required for automated batch restore.');
      return;
    }

    if (certCapability && !certCapability.canDisableCerts) {
      showUnsupportedSheet(
        'Automation Not Available',
        `${certCapability.manufacturer} ${certCapability.model} restricts automated certificate management.`
      );
      return;
    }

    setIsProcessingBatch(true);
    let successCount = 0;
    let failCount = 0;

    const targetList = certs.filter((c) => !c.enabled);
    setBatchProgress({ current: 0, total: targetList.length, currentName: 'Restoring all...' });

    for (let i = 0; i < targetList.length; i++) {
      const c = targetList[i];
      setBatchProgress({ current: i + 1, total: targetList.length, currentName: c.name });

      const res = await executeEnableCert(c.hash);
      if (res.success) {
        successCount++;
        setCerts((prev) => prev.map((item) => (item.id === c.id ? { ...item, enabled: true } : item)));
      } else {
        failCount++;
      }
    }

    setIsProcessingBatch(false);
    Alert.alert('Reset Complete', `Restored ${successCount}/${targetList.length} certificates to active.`);
  };

  const filteredCerts = certs.filter((c) => {
    if (activeCategory !== 'All' && c.category !== activeCategory) return false;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.androidSystemName.toLowerCase().includes(q) ||
      c.hash.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  const progressPct = batchProgress.total > 0 ? batchProgress.current / batchProgress.total : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#052E1B" />
          </View>
          <View>
            <Text style={styles.navSub}>NO-ROOT CERT MANAGER</Text>
            <Text style={styles.navTitle}>CertTrust</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setAboutVisible(true)}>
            <Ionicons name="person-circle-outline" size={26} color="#A7F3D0" />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{disabledCount}/{total} off</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#134E33' }]}>
            <Text style={[styles.statValue, { color: '#34D399' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#5F1F2B' }]}>
            <Text style={[styles.statValue, { color: '#FB7185' }]}>{disabledCount}</Text>
            <Text style={styles.statLabel}>Disabled</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#1E3A5F' }]}>
            <Text style={[styles.statValue, { color: '#60A5FA' }]}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Update Available Banner */}
        {updateInfo && (
          <PressCard
            style={styles.updateBanner}
            onPress={() => {
              Alert.alert(
                `Update Available: v${updateInfo.version}`,
                `You are on v${APP_VERSION}. A newer version (${updateInfo.version}) is available with improvements and fixes.\n\nTap "Download" to get the latest release from GitHub.`,
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Download v' + updateInfo.version,
                    onPress: () => Linking.openURL(updateInfo.downloadUrl).catch(() => Linking.openURL(updateInfo.releaseUrl)),
                  },
                ]
              );
            }}
          >
            <View style={styles.updateIconBox}>
              <Ionicons name="arrow-up-circle" size={22} color="#052E1B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.updateTitle}>Update Available · v{updateInfo.version}</Text>
              <Text style={styles.updateSub} numberOfLines={1}>Tap to download the latest version</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#34D399" />
          </PressCard>
        )}

        {isCheckingUpdate && (
          <View style={styles.updateChecking}>
            <ActivityIndicator size="small" color="#34D399" />
            <Text style={styles.updateCheckingText}>Checking for updates…</Text>
          </View>
        )}

        {/* Shizuku Bridge Status Card */}
        <View style={[styles.statusCard, shizukuStatus.granted ? styles.statusCardActive : styles.statusCardInactive]}>
          <View style={styles.statusHeader}>
            <View style={[styles.pulseDot, { backgroundColor: shizukuStatus.granted ? '#34D399' : '#FBBF24' }]} />
            <Text style={styles.statusTitle} numberOfLines={2}>
              {shizukuStatus.granted
                ? `Shizuku Bridge Active · UID ${shizukuStatus.uid ?? '2000'}`
                : shizukuStatus.available
                ? 'Shizuku Running — Permission Required'
                : 'Shizuku Service Not Running'}
            </Text>
            {isCheckingShizuku && <ActivityIndicator size="small" color="#34D399" />}
          </View>

          <Text style={styles.statusDescription}>
            {shizukuStatus.granted
              ? certCapability
                ? certCapability.canDisableCerts
                  ? `${certCapability.manufacturer} ${certCapability.model} · Android ${certCapability.sdkInt} · automation ready`
                  : `${certCapability.manufacturer} ${certCapability.model} (Android ${certCapability.sdkInt}) blocks automated cert changes — use manual settings below.`
                : 'Connected. Checking device compatibility…'
              : shizukuStatus.available
              ? 'Shizuku detected. Grant permission to unlock one-tap automation.'
              : 'Install the Shizuku app, pair via Developer Options → Wireless Debugging, and start the service.'}
          </Text>

          {!shizukuStatus.granted && shizukuStatus.available && (
            <TouchableOpacity style={styles.grantButton} onPress={handleRequestPermission}>
              <Ionicons name="key" size={16} color="#052E1B" style={{ marginRight: 6 }} />
              <Text style={styles.grantButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          )}

          {!shizukuStatus.available && (
            <TouchableOpacity style={styles.outlineButton} onPress={checkShizukuState}>
              <Ionicons name="refresh" size={14} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.outlineButtonText}>Re-check Connection</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Card */}
        <View style={styles.actionCard}>
          <Text style={styles.cardHeader}>Quick Actions</Text>

          <PressCard style={styles.primaryButton} onPress={openAndroidCredentialsSettings}>
            <Ionicons name="settings-outline" size={18} color="#052E1B" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Open Trusted Credentials</Text>
          </PressCard>

          {(!certCapability || certCapability.canDisableCerts) && (
            <View style={styles.buttonRow}>
              <PressCard
                style={[styles.secondaryButton, isProcessingBatch && { opacity: 0.5 }]}
                onPress={handleMarkAllDisabled}
                disabled={isProcessingBatch}
              >
                <Ionicons name="power" size={15} color="#FB7185" style={{ marginRight: 6 }} />
                <Text style={[styles.secondaryButtonText, { color: '#FB7185' }]}>Mark All Off</Text>
              </PressCard>

              <PressCard
                style={[styles.secondaryButton, isProcessingBatch && { opacity: 0.5 }]}
                onPress={handleMarkAllEnabled}
                disabled={isProcessingBatch}
              >
                <Ionicons name="refresh" size={15} color="#34D399" style={{ marginRight: 6 }} />
                <Text style={[styles.secondaryButtonText, { color: '#34D399' }]}>Reset All</Text>
              </PressCard>
            </View>
          )}

          {isProcessingBatch && (
            <View style={styles.progressBox}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
              </View>
              <Text style={styles.progressText} numberOfLines={1}>
                {batchProgress.current}/{batchProgress.total} · {batchProgress.currentName}
              </Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by name, CA, or hash…"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}>
                <View style={[styles.chip, isActive && styles.chipActive]}>
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Certificate List */}
        <Text style={styles.sectionHeading}>
          {filteredCerts.length} CERTIFICATE{filteredCerts.length !== 1 ? 'S' : ''}
          {activeCategory !== 'All' ? ` · ${activeCategory}` : ''}
        </Text>

        {filteredCerts.map((c) => {
          const isOff = !c.enabled;
          return (
            <PressCard key={c.id} style={[styles.certRow, isOff && styles.certRowDisabled]} onPress={() => toggleCert(c)}>
              <View style={styles.certIconBox}>
                <Ionicons
                  name={isOff ? 'close-circle' : 'checkmark-circle'}
                  size={22}
                  color={isOff ? '#FB7185' : '#34D399'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certName} numberOfLines={2}>{c.name}</Text>
                <Text style={styles.certHash}>{c.hash} · {c.category}</Text>
                <Text style={[styles.certStatusLabel, { color: isOff ? '#FB7185' : '#34D399' }]}>
                  {isOff ? 'Disabled (Untrusted)' : 'Active (System Trusted)'}
                </Text>
              </View>
              <Switch
                value={isOff}
                onValueChange={() => toggleCert(c)}
                trackColor={{ false: '#374151', true: '#9F1239' }}
                thumbColor={isOff ? '#FB7185' : '#34D399'}
              />
            </PressCard>
          );
        })}

        {filteredCerts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color="#4B5563" />
            <Text style={styles.emptyText}>No certificates match your search</Text>
          </View>
        )}

        {/* Footer credit */}
        <TouchableOpacity style={styles.footer} onPress={() => setAboutVisible(true)}>
          <Text style={styles.footerText}>Crafted with 💚 by {MAKER}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Log & Diagnostic Modal */}
      <Modal visible={logModalVisible} transparent animationType="fade" onRequestClose={() => setLogModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name={logDetails.isError ? 'warning' : 'information-circle'} size={22} color={logDetails.isError ? '#FBBF24' : '#34D399'} />
              <Text style={styles.modalTitle}>{logDetails.title}</Text>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>{logDetails.content}</Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={openAndroidCredentialsSettings}>
                <Text style={styles.modalSecondaryText}>Open Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setLogModalVisible(false)}>
                <Text style={styles.modalPrimaryText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Modal */}
      {updateInfo && (
        <Modal visible={false} transparent animationType="fade">
          {/* This modal is triggered via Alert above — kept for programmatic use if needed */}
        </Modal>
      )}

      {/* About Modal */}
      <Modal visible={aboutVisible} transparent animationType="fade" onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.aboutCard]}>
            <View style={styles.aboutLogo}>
              <Ionicons name="shield-checkmark" size={34} color="#34D399" />
            </View>
            <Text style={styles.aboutTitle}>CertTrust</Text>
            <Text style={styles.aboutVersion}>v{APP_VERSION} · No-Root Certificate Manager</Text>

            <View style={styles.aboutDivider} />

            <Text style={styles.aboutMadeBy}>Handcrafted by</Text>
            <TouchableOpacity onPress={() => Linking.openURL(MAKER_GITHUB).catch(() => {})}>
              <View style={styles.makerBadge}>
                <Ionicons name="logo-github" size={18} color="#E5E7EB" />
                <Text style={styles.makerName}>{MAKER}</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.aboutBlurb}>
              Manage Android trusted root certificates without root — powered by the Shizuku wireless ADB bridge. Built with React Native & Expo.
            </Text>

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalPrimaryText}>Nice ✌️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#151B23',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navSub: { fontSize: 9, fontWeight: '700', color: '#34D399', letterSpacing: 1.2 },
  navTitle: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 2 },
  badge: { backgroundColor: '#151B23', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#1F2A37' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  scrollContent: { padding: 16, paddingBottom: 48 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2, letterSpacing: 0.5 },
  statusCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 14 },
  statusCardActive: { backgroundColor: '#0C1F17', borderColor: '#1B4332' },
  statusCardInactive: { backgroundColor: '#1C160C', borderColor: '#4A3413' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', flex: 1 },
  statusDescription: { fontSize: 12, color: '#9CA3AF', lineHeight: 17, marginBottom: 10 },
  grantButton: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
  },
  grantButtonText: { color: '#052E1B', fontSize: 13, fontWeight: '800' },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 12,
    backgroundColor: '#151B23',
    borderWidth: 1,
    borderColor: '#1F2A37',
  },
  outlineButtonText: { color: '#34D399', fontSize: 12, fontWeight: '700' },
  actionCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2A37',
    marginBottom: 14,
  },
  cardHeader: { fontSize: 15, fontWeight: '800', color: '#F9FAFB', marginBottom: 12 },
  primaryButton: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    marginBottom: 10,
  },
  primaryButtonText: { color: '#052E1B', fontSize: 14, fontWeight: '800' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    backgroundColor: '#151B23',
    borderWidth: 1,
    borderColor: '#1F2A37',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '700' },
  progressBox: { marginTop: 14 },
  progressTrack: {
    height: 6,
    backgroundColor: '#1F2A37',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: 6, backgroundColor: '#34D399', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#34D399', fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#1F2A37',
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: '#F9FAFB', fontSize: 14 },
  chipRow: { paddingVertical: 4, marginBottom: 10, gap: 8, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2A37',
  },
  chipActive: { backgroundColor: '#34D399', borderColor: '#34D399' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  chipTextActive: { color: '#052E1B' },
  sectionHeading: { fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 10, letterSpacing: 1 },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1F2A37',
  },
  certRowDisabled: { borderColor: '#7F1D1D', backgroundColor: '#1A1114' },
  certIconBox: { width: 34, alignItems: 'center', marginRight: 10 },
  certName: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  certHash: { fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  certStatusLabel: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#6B7280', fontSize: 13, marginTop: 8 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111827',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2A37',
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#F9FAFB', flex: 1 },
  modalScroll: { marginBottom: 16, maxHeight: 300 },
  modalText: { fontSize: 13, color: '#D1D5DB', lineHeight: 19 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: '#1F2A37',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalSecondaryText: { color: '#34D399', fontWeight: '700', fontSize: 13 },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalPrimaryText: { color: '#052E1B', fontWeight: '800', fontSize: 13 },
  aboutCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  aboutLogo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#0C1F17',
    borderWidth: 1,
    borderColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  aboutTitle: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  aboutVersion: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  aboutDivider: { width: '100%', height: 1, backgroundColor: '#1F2A37', marginVertical: 18 },
  aboutMadeBy: { fontSize: 11, color: '#6B7280', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  makerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#151B23',
    borderWidth: 1,
    borderColor: '#1F2A37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  makerName: { color: '#F9FAFB', fontSize: 15, fontWeight: '800' },
  aboutBlurb: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 16,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  updateIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0C1F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateTitle: { fontSize: 14, fontWeight: '800', color: '#052E1B' },
  updateSub: { fontSize: 11, color: '#065F46', marginTop: 1, fontWeight: '600' },
  updateChecking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  updateCheckingText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});
