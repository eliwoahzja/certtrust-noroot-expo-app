import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CertItem {
  id: string;
  name: string;
  category: string;
  androidSystemName: string;
  alphabetSection: string;
  hash: string;
  enabled: boolean;
}

const INITIAL_CERTS: CertItem[] = [
  // [ALL AMAZON]
  { id: 'amzn-1', name: 'Amazon Root CA 1', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 1', alphabetSection: 'A', hash: '2c543f86.0', enabled: true },
  { id: 'amzn-2', name: 'Amazon Root CA 2', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 2', alphabetSection: 'A', hash: 'ce5e74ee.0', enabled: true },
  { id: 'amzn-3', name: 'Amazon Root CA 3', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 3', alphabetSection: 'A', hash: '69105f4f.0', enabled: true },
  { id: 'amzn-4', name: 'Amazon Root CA 4', category: 'Amazon', androidSystemName: 'Amazon / Amazon Root CA 4', alphabetSection: 'A', hash: '544e3a20.0', enabled: true },

  // [BALTIMORE]
  { id: 'balt-1', name: 'Baltimore CyberTrust Root', category: 'Baltimore', androidSystemName: 'Baltimore CyberTrust Root', alphabetSection: 'B', hash: '0107ee40.0', enabled: true },

  // [ALL COMODO]
  { id: 'comodo-1', name: 'AAA Certificate Services', category: 'Comodo', androidSystemName: 'Comodo CA Limited / AAA Certificate Services', alphabetSection: 'A', hash: 'd1b54434.0', enabled: true },
  { id: 'comodo-2', name: 'COMODO Certification Authority', category: 'Comodo', androidSystemName: 'COMODO CA Limited / COMODO Certification Authority', alphabetSection: 'C', hash: 'afe54378.0', enabled: true },
  { id: 'comodo-3', name: 'COMODO ECC Certification Authority', category: 'Comodo', androidSystemName: 'COMODO CA Limited / COMODO ECC Certification Authority', alphabetSection: 'C', hash: '9339512a.0', enabled: true },
  { id: 'comodo-4', name: 'COMODO RSA Certification Authority', category: 'Comodo', androidSystemName: 'COMODO CA Limited / COMODO RSA Certification Authority', alphabetSection: 'C', hash: 'd6325660.0', enabled: true },

  // [ALL DIGICERT INC]
  { id: 'digi-1', name: 'DigiCert Assured ID Root CA', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Assured ID Root CA', alphabetSection: 'D', hash: '399e7759.0', enabled: true },
  { id: 'digi-2', name: 'DigiCert Assured ID Root G2', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Assured ID Root G2', alphabetSection: 'D', hash: 'b1159c4c.0', enabled: true },
  { id: 'digi-3', name: 'DigiCert Assured ID Root G3', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Assured ID Root G3', alphabetSection: 'D', hash: '8cb5ee0f.0', enabled: true },
  { id: 'digi-4', name: 'DigiCert Global Root CA', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Global Root CA', alphabetSection: 'D', hash: '35105088.0', enabled: true },
  { id: 'digi-5', name: 'DigiCert Global Root G2', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Global Root G2', alphabetSection: 'D', hash: 'df36569e.0', enabled: true },
  { id: 'digi-6', name: 'DigiCert Global Root G3', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Global Root G3', alphabetSection: 'D', hash: '1d7556f8.0', enabled: true },
  { id: 'digi-7', name: 'DigiCert High Assurance EV Root CA', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert High Assurance EV Root CA', alphabetSection: 'D', hash: '244b5494.0', enabled: true },
  { id: 'digi-8', name: 'DigiCert Trusted Root G4', category: 'DigiCert Inc', androidSystemName: 'DigiCert Inc / DigiCert Trusted Root G4', alphabetSection: 'D', hash: 'dd8e9d41.0', enabled: true },

  // [ALL ENTRUST, INC]
  { id: 'ent-1', name: 'Entrust Root Certification Authority', category: 'Entrust, Inc', androidSystemName: 'Entrust Inc. / Entrust Root Certification Authority', alphabetSection: 'E', hash: '455f1b52.0', enabled: true },
  { id: 'ent-2', name: 'Entrust Root Certification Authority - EC1', category: 'Entrust, Inc', androidSystemName: 'Entrust Inc. / Entrust Root Certification Authority - EC1', alphabetSection: 'E', hash: 'ba894455.0', enabled: true },
  { id: 'ent-3', name: 'Entrust Root Certification Authority - G2', category: 'Entrust, Inc', androidSystemName: 'Entrust Inc. / Entrust Root Certification Authority - G2', alphabetSection: 'E', hash: '8d6437c3.0', enabled: true },

  // [ALL ENTRUST.NET]
  { id: 'entnet-1', name: 'Entrust.net Certification Authority (2048)', category: 'Entrust.net', androidSystemName: 'Entrust.net / Entrust.net Certification Authority (2048)', alphabetSection: 'E', hash: '5a3f0ff8.0', enabled: true },

  // [ALL GLOBALSIGN]
  { id: 'gs-1', name: 'GlobalSign Root R1', category: 'GlobalSign', androidSystemName: 'GlobalSign nv-sa / GlobalSign Root CA (R1)', alphabetSection: 'G', hash: 'b0ed035a.0', enabled: true },
  { id: 'gs-2', name: 'GlobalSign Root R2', category: 'GlobalSign', androidSystemName: 'GlobalSign / GlobalSign Root CA - R2', alphabetSection: 'G', hash: '75680d2e.0', enabled: true },
  { id: 'gs-3', name: 'GlobalSign Root R3', category: 'GlobalSign', androidSystemName: 'GlobalSign / GlobalSign Root CA - R3', alphabetSection: 'G', hash: 'd647e30d.0', enabled: true },
  { id: 'gs-4', name: 'GlobalSign Root ECC - R4', category: 'GlobalSign', androidSystemName: 'GlobalSign / GlobalSign ECC Root CA - R4', alphabetSection: 'G', hash: '5a2b1c8e.0', enabled: true },
  { id: 'gs-5', name: 'GlobalSign Root CA (GlobalSign nv-sa)', category: 'GlobalSign', androidSystemName: 'GlobalSign nv-sa / GlobalSign Root CA', alphabetSection: 'G', hash: '2e8714cb.0', enabled: true },

  // [GODADDY.COM, INC]
  { id: 'godaddy-1', name: 'Go Daddy Root Certificate Authority - G2', category: 'GoDaddy.com, Inc', androidSystemName: 'GoDaddy.com, Inc. / Go Daddy Root Certificate Authority - G2', alphabetSection: 'G', hash: '276a086b.0', enabled: true },

  // [ALL SSL CORPORATION]
  { id: 'ssl-1', name: 'SSL.com EV Root Certification Authority ECC', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com EV Root Certification Authority ECC', alphabetSection: 'S', hash: '48dc7396.0', enabled: true },
  { id: 'ssl-2', name: 'SSL.com EV Root Certification Authority RSA R2', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com EV Root Certification Authority RSA R2', alphabetSection: 'S', hash: '7651b327.0', enabled: true },
  { id: 'ssl-3', name: 'SSL.com Root Certification Authority ECC', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com Root Certification Authority ECC', alphabetSection: 'S', hash: '9e735d4f.0', enabled: true },
  { id: 'ssl-4', name: 'SSL.com Root Certification Authority RSA', category: 'SSL Corporation', androidSystemName: 'SSL Corporation / SSL.com Root Certification Authority RSA', alphabetSection: 'S', hash: '4cd65995.0', enabled: true },
];

export default function App() {
  const [certs, setCerts] = useState<CertItem[]>(INITIAL_CERTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');

  const total = certs.length;
  const disabledCount = certs.filter((c) => !c.enabled).length;

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

  const toggleCert = (id: string) => {
    setCerts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const markAllDisabled = () => {
    setCerts((prev) => prev.map((c) => ({ ...c, enabled: false })));
    Alert.alert('Tracker Updated', 'All 31 certificates marked as disabled.');
  };

  const markAllEnabled = () => {
    setCerts((prev) => prev.map((c) => ({ ...c, enabled: true })));
    Alert.alert('Tracker Reset', 'All 31 certificates reset to active.');
  };

  const alphabetSections = ['ALL', 'A', 'B', 'C', 'D', 'E', 'G', 'S'];

  const filteredCerts = certs.filter((c) => {
    const matchesSection = selectedSection === 'ALL' || c.alphabetSection === selectedSection;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.androidSystemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
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
        {/* Quick Launcher Card */}
        <View style={styles.actionCard}>
          <Text style={styles.cardHeader}>⚡ 1-Tap Android System Settings</Text>
          <Text style={styles.cardBody}>
            Tap below to open Android's built-in Trusted Credentials interface to disable system roots without root access.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={openAndroidCredentialsSettings}>
            <Ionicons name="shield-checkmark" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Open Android Credentials Settings</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={markAllDisabled}>
              <Ionicons name="close-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Mark All Off</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={markAllEnabled}>
              <Ionicons name="refresh" size={16} color="#34C759" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Reset All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#8E8E93" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Filter 31 CAs by name or hash..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Alphabet Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {alphabetSections.map((sec) => (
            <TouchableOpacity
              key={sec}
              onPress={() => setSelectedSection(sec)}
              style={[
                styles.filterPill,
                selectedSection === sec && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedSection === sec && styles.filterPillTextActive,
                ]}
              >
                {sec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Certificate Rows */}
        <Text style={styles.sectionHeading}>
          {filteredCerts.length} TARGET CERTIFICATES
        </Text>

        {filteredCerts.map((c) => {
          const isOff = !c.enabled;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.certRow, isOff && styles.certRowDisabled]}
              onPress={() => toggleCert(c.id)}
            >
              <View style={[styles.sectionPill, isOff && styles.sectionPillDisabled]}>
                <Text style={[styles.sectionPillText, isOff && styles.sectionPillTextDisabled]}>
                  {c.alphabetSection}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.certName}>{c.androidSystemName}</Text>
                <Text style={styles.certHash}>Hash: {c.hash} • {c.category}</Text>
              </View>

              <Switch
                value={isOff}
                onValueChange={() => toggleCert(c.id)}
                trackColor={{ false: '#39393D', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  actionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 16,
  },
  cardHeader: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 13 },
  filterScroll: { marginBottom: 16 },
  filterPill: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  filterPillActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterPillText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF' },
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
  sectionPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionPillDisabled: { backgroundColor: '#3A1414' },
  sectionPillText: { color: '#0A84FF', fontWeight: '700', fontSize: 14 },
  sectionPillTextDisabled: { color: '#FF3B30' },
  certName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  certHash: { fontSize: 11, color: '#8E8E93', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});