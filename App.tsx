import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Linking,
  TextInput,
  NativeModules,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { ShizukuExecutor, DeviceOwnerDpc } = NativeModules;

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

export default function App() {
  const [certs, setCerts] = useState<CertItem[]>(INITIAL_CERTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [shizukuStatus, setShizukuStatus] = useState<ShizukuStatus>({ available: false, granted: false });
  const [isCheckingShizuku, setIsCheckingShizuku] = useState(true);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logDetails, setLogDetails] = useState<{ title: string; content: string; isError?: boolean }>({
    title: '',
    content: '',
  });

  const total = certs.length;
  const disabledCount = certs.filter((c) => !c.enabled).length;

  useEffect(() => {
    checkShizukuState();
  }, []);

  const checkShizukuState = async () => {
    setIsCheckingShizuku(true);
    if (ShizukuExecutor && ShizukuExecutor.checkShizukuPermission) {
      try {
        const res: ShizukuStatus = await ShizukuExecutor.checkShizukuPermission();
        setShizukuStatus(res);
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
   * Execute real certificate disable command via Shizuku shell
   * Copies CA file from /system/etc/security/cacerts/<hash> to per-user cacerts-removed
   */
  const executeDisableCert = async (hash: string): Promise<CommandResult> => {
    if (!ShizukuExecutor || !ShizukuExecutor.executeShizukuCommand) {
      return { success: false, error: 'Shizuku native module not loaded.' };
    }

    const script = `
HASH="${hash}"
SRC="/system/etc/security/cacerts/$HASH"

TARGET_DIR=""
if [ -d "/data/misc/user/0/cacerts-removed" ] && [ -w "/data/misc/user/0/cacerts-removed" ]; then
  TARGET_DIR="/data/misc/user/0/cacerts-removed"
elif [ -d "/data/misc/keychain/cacerts-removed" ] && [ -w "/data/misc/keychain/cacerts-removed" ]; then
  TARGET_DIR="/data/misc/keychain/cacerts-removed"
else
  mkdir -p /data/misc/user/0/cacerts-removed 2>/dev/null && TARGET_DIR="/data/misc/user/0/cacerts-removed"
fi

if [ -n "$TARGET_DIR" ] && [ -f "$SRC" ]; then
  cp "$SRC" "$TARGET_DIR/$HASH" && chmod 644 "$TARGET_DIR/$HASH" 2>/dev/null
  if [ -f "$TARGET_DIR/$HASH" ]; then
    echo "SUCCESS: Copied $HASH to $TARGET_DIR"
    exit 0
  fi
fi

# Fallback: device_policy service
cmd device_policy set-ca-cert-enabled "$HASH" false 2>/dev/null
if [ $? -eq 0 ]; then
  echo "SUCCESS: Disabled via device_policy"
  exit 0
fi

echo "PERMISSION_DENIED: Shell UID lacks write permission to cacerts-removed on this OEM build."
exit 1
`;

    try {
      const res: CommandResult = await ShizukuExecutor.executeShizukuCommand(script);
      return res;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Execution error' };
    }
  };

  /**
   * Execute real certificate enable/restore command via Shizuku shell
   * Removes CA file from per-user cacerts-removed
   */
  const executeEnableCert = async (hash: string): Promise<CommandResult> => {
    if (!ShizukuExecutor || !ShizukuExecutor.executeShizukuCommand) {
      return { success: false, error: 'Shizuku native module not loaded.' };
    }

    const script = `
HASH="${hash}"
REMOVED=0

if [ -f "/data/misc/user/0/cacerts-removed/$HASH" ]; then
  rm -f "/data/misc/user/0/cacerts-removed/$HASH" && REMOVED=1
fi
if [ -f "/data/misc/keychain/cacerts-removed/$HASH" ]; then
  rm -f "/data/misc/keychain/cacerts-removed/$HASH" && REMOVED=1
fi

cmd device_policy set-ca-cert-enabled "$HASH" true 2>/dev/null

if [ $REMOVED -eq 1 ] || [ $? -eq 0 ]; then
  echo "SUCCESS: Restored $HASH"
  exit 0
fi

echo "STATUS: Certificate was not found in removed directory or already enabled."
exit 0
`;

    try {
      const res: CommandResult = await ShizukuExecutor.executeShizukuCommand(script);
      return res;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Execution error' };
    }
  };

  // Toggle single cert with honest feedback & real execution
  const toggleCert = async (cert: CertItem) => {
    const willDisable = cert.enabled; // true -> turn off

    if (!shizukuStatus.granted) {
      Alert.alert(
        'Shizuku Not Active',
        'Privileged Shizuku bridge is required to execute automated shell commands.\n\nWould you like to open the manual Android Credentials Settings instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAndroidCredentialsSettings },
        ]
      );
      return;
    }

    const result = willDisable ? await executeDisableCert(cert.hash) : await executeEnableCert(cert.hash);

    if (result.success) {
      setCerts((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, enabled: !willDisable } : c))
      );
      Alert.alert(
        willDisable ? 'Certificate Disabled' : 'Certificate Enabled',
        `${cert.name} (${cert.hash}) was ${willDisable ? 'disabled' : 'restored'} successfully.`
      );
    } else {
      setLogDetails({
        title: `Failed to ${willDisable ? 'Disable' : 'Enable'} ${cert.name}`,
        content: `Command Output / Error:\n${result.error || result.output || 'Unknown error'}\n\nReason:\nShizuku operates under Android's shell UID (2000). On some OEM builds/Android versions, the shell UID cannot directly write to /data/misc/user/0/cacerts-removed.\n\nPlease use the manual fallback (Settings > Trusted Credentials) to toggle this certificate.`,
        isError: true,
      });
      setLogModalVisible(true);
    }
  };

  // Batch Disable All 31 Certificates
  const handleMarkAllDisabled = async () => {
    if (!shizukuStatus.granted) {
      Alert.alert(
        'Shizuku Required',
        'Shizuku permission is required to automate batch operations.\n\nPlease grant Shizuku permission or use the manual Android Credentials Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAndroidCredentialsSettings },
        ]
      );
      return;
    }

    setIsProcessingBatch(true);
    let successCount = 0;
    let failCount = 0;
    const failures: { name: string; error: string }[] = [];

    const targetList = certs.filter((c) => c.enabled);
    setBatchProgress({ current: 0, total: targetList.length, currentName: 'Starting batch...' });

    for (let i = 0; i < targetList.length; i++) {
      const c = targetList[i];
      setBatchProgress({ current: i + 1, total: targetList.length, currentName: c.name });

      const res = await executeDisableCert(c.hash);
      if (res.success) {
        successCount++;
        setCerts((prev) => prev.map((item) => (item.id === c.id ? { ...item, enabled: false } : item)));
      } else {
        failCount++;
        failures.push({ name: c.name, error: res.error || res.output || 'Permission denied' });
      }
    }

    setIsProcessingBatch(false);

    if (failCount === 0) {
      Alert.alert('Batch Complete', `Successfully disabled ${successCount}/${targetList.length} certificates via Shizuku.`);
    } else {
      setLogDetails({
        title: `Batch Result: ${successCount} Succeeded, ${failCount} Failed`,
        content: `Summary:\n${successCount}/${targetList.length} certificates disabled.\n${failCount} failed due to shell UID write permission limits on this OEM.\n\nFailed items:\n` +
          failures.map((f) => `• ${f.name}: ${f.error}`).join('\n') +
          `\n\nPlease use the manual fallback (Settings > Trusted credentials) for any failed certificates.`,
        isError: true,
      });
      setLogModalVisible(true);
    }
  };

  // Batch Enable All 31 Certificates
  const handleMarkAllEnabled = async () => {
    if (!shizukuStatus.granted) {
      Alert.alert('Shizuku Required', 'Shizuku permission is required for automated batch restore.');
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
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.androidSystemName.toLowerCase().includes(q) ||
      c.hash.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.navSub}>EXPO NO-ROOT MOBILE MANAGER</Text>
          <Text style={styles.navTitle}>CertTrust</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {disabledCount}/{total} Disabled
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Shizuku Bridge Status Card */}
        <View style={[styles.statusCard, shizukuStatus.granted ? styles.statusCardActive : styles.statusCardInactive]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={shizukuStatus.granted ? 'radio-button-on' : 'alert-circle'}
              size={18}
              color={shizukuStatus.granted ? '#34C759' : '#FF9500'}
            />
            <Text style={styles.statusTitle}>
              {shizukuStatus.granted
                ? `Shizuku ADB Bridge Active (UID: ${shizukuStatus.uid ?? '2000'})`
                : shizukuStatus.available
                ? 'Shizuku Running — Permission Required'
                : 'Shizuku Service Not Running'}
            </Text>
            {isCheckingShizuku && <ActivityIndicator size="small" color="#0A84FF" />}
          </View>

          <Text style={styles.statusDescription}>
            {shizukuStatus.granted
              ? 'Native binder linked. Commands execute directly on-device with shell privileges without root or PC.'
              : shizukuStatus.available
              ? 'Shizuku service is detected. Tap below to grant permission for this application.'
              : 'To enable automated 1-click toggles without PC: install the Shizuku app, pair via Developer Options > Wireless Debugging, and start the service.'}
          </Text>

          {!shizukuStatus.granted && shizukuStatus.available && (
            <TouchableOpacity style={styles.grantButton} onPress={handleRequestPermission}>
              <Ionicons name="key" size={16} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.grantButtonText}>Grant Shizuku Permission</Text>
            </TouchableOpacity>
          )}

          {!shizukuStatus.available && (
            <TouchableOpacity style={styles.outlineButton} onPress={checkShizukuState}>
              <Ionicons name="refresh" size={14} color="#0A84FF" style={{ marginRight: 6 }} />
              <Text style={styles.outlineButtonText}>Re-check Shizuku Connection</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Launcher & Fallback Card */}
        <View style={styles.actionCard}>
          <Text style={styles.cardHeader}>Android Trusted Credentials & Fallback</Text>
          <Text style={styles.cardBody}>
            Tap below to launch Android's built-in Trusted Credentials screen to toggle certificates manually without root.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={openAndroidCredentialsSettings}>
            <Ionicons name="shield-checkmark" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Open Android Credentials Settings</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, isProcessingBatch && { opacity: 0.5 }]}
              onPress={handleMarkAllDisabled}
              disabled={isProcessingBatch}
            >
              <Ionicons name="close-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Mark All Off</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, isProcessingBatch && { opacity: 0.5 }]}
              onPress={handleMarkAllEnabled}
              disabled={isProcessingBatch}
            >
              <Ionicons name="refresh" size={16} color="#34C759" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          {isProcessingBatch && (
            <View style={styles.progressBox}>
              <ActivityIndicator size="small" color="#34C759" />
              <Text style={styles.progressText}>
                Processing [{batchProgress.current}/{batchProgress.total}]: {batchProgress.currentName}
              </Text>
            </View>
          )}
        </View>

        {/* Clean Search Box (No alphabet pills) */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#8E8E93" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search 31 CAs by name, category, or hash..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Certificate List */}
        <Text style={styles.sectionHeading}>
          {filteredCerts.length} TARGET CERTIFICATES
        </Text>

        {filteredCerts.map((c) => {
          const isOff = !c.enabled;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.certRow, isOff && styles.certRowDisabled]}
              onPress={() => toggleCert(c)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.certName}>{c.androidSystemName}</Text>
                <Text style={styles.certHash}>Hash: {c.hash} • {c.category}</Text>
                <View style={styles.statusBadgeRow}>
                  <View style={[styles.dotIndicator, isOff ? styles.dotOff : styles.dotOn]} />
                  <Text style={[styles.certStatusLabel, isOff ? styles.textOff : styles.textOn]}>
                    {isOff ? 'Disabled (Untrusted)' : 'Active (System Trusted)'}
                  </Text>
                </View>
              </View>

              <Switch
                value={isOff}
                onValueChange={() => toggleCert(c)}
                trackColor={{ false: '#39393D', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Log & Diagnostic Modal */}
      <Modal visible={logModalVisible} transparent animationType="fade" onRequestClose={() => setLogModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name={logDetails.isError ? 'warning' : 'information-circle'} size={22} color={logDetails.isError ? '#FF9500' : '#0A84FF'} />
              <Text style={styles.modalTitle}>{logDetails.title}</Text>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>{logDetails.content}</Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={openAndroidCredentialsSettings}>
                <Text style={styles.modalSecondaryText}>Open Android Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setLogModalVisible(false)}>
                <Text style={styles.modalPrimaryText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1C1C1E',
  },
  navSub: { fontSize: 10, fontWeight: '700', color: '#0A84FF', letterSpacing: 0.5 },
  navTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  badge: { backgroundColor: '#1C1C1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#34C759' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusCardActive: {
    backgroundColor: '#0D2012',
    borderColor: '#1E4620',
  },
  statusCardInactive: {
    backgroundColor: '#1E180E',
    borderColor: '#3D2D10',
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  statusDescription: { fontSize: 12, color: '#C7C7CC', lineHeight: 17, marginBottom: 10 },
  grantButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    marginTop: 4,
  },
  grantButtonText: { color: '#000000', fontSize: 13, fontWeight: '700' },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    marginTop: 4,
  },
  outlineButtonText: { color: '#0A84FF', fontSize: 12, fontWeight: '600' },
  actionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 16,
  },
  cardHeader: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  cardBody: { fontSize: 13, color: '#A1A1AA', lineHeight: 18, marginBottom: 14 },
  primaryButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButtonText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
  },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  progressText: { fontSize: 12, color: '#34C759', fontWeight: '500' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  sectionHeading: { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginBottom: 10, letterSpacing: 0.5 },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  certRowDisabled: { borderColor: '#FF3B30', backgroundColor: '#200A0A' },
  certName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  certHash: { fontSize: 11, color: '#8E8E93', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: '#34C759' },
  dotOff: { backgroundColor: '#FF3B30' },
  certStatusLabel: { fontSize: 10, fontWeight: '600' },
  textOn: { color: '#34C759' },
  textOff: { color: '#FF3B30' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  modalScroll: { marginBottom: 16 },
  modalText: { fontSize: 13, color: '#D1D1D6', lineHeight: 19, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryText: { color: '#0A84FF', fontWeight: '600', fontSize: 13 },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: '#0A84FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});