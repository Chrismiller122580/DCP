import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';

const API_BASE = 'http://localhost:4000'; // In real device use your Codespace forwarded URL or LAN IP
const DEV_KEY = 'dcp_dev_1234567890';

interface ParsedPayment {
  destination: string;
  tag?: number;
  amount?: string;
  uri: string;
}

export default function DCPPayScreen() {
  const [uriInput, setUriInput] = useState('');
  const [parsed, setParsed] = useState<ParsedPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  function parsePaymentUri(text: string) {
    // Supports xrpl:ADDRESS?amount=XX&dt=YYY or bitcoin: etc. or plain address
    const trimmed = text.trim();
    let destination = trimmed;
    let amount: string | undefined;
    let tag: number | undefined;

    try {
      if (trimmed.includes(':')) {
        const [scheme, rest] = trimmed.split(':');
        const urlLike = rest.includes('?') ? `https://example.com/${rest}` : `https://example.com/${rest}`;
        const url = new URL(urlLike);
        destination = url.pathname.replace('/', '');
        const params = new URLSearchParams(url.search);
        amount = params.get('amount') || undefined;
        const dt = params.get('dt') || params.get('tag');
        if (dt) tag = parseInt(dt, 10);
      }
    } catch {
      // fallback for simple cases
    }

    return { destination, amount, tag, uri: trimmed };
  }

  function loadFromInput() {
    if (!uriInput) {
      // Demo: use a recent invoice style (user can paste from dashboard)
      setUriInput('xrpl:rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh?amount=7.5&dt=508859070');
      return;
    }
    const p = parsePaymentUri(uriInput);
    setParsed(p);
    setIsScanning(false);
  }

  function onBarcodeScanned({ data }: { data: string }) {
    setIsScanning(false);
    setUriInput(data);
    const p = parsePaymentUri(data);
    setParsed(p);
  }

  async function simulatePay() {
    if (!parsed?.tag && !parsed?.destination) {
      Alert.alert('No payment details', 'Please scan or load a payment with tag or address from the dashboard QR.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {};
      if (parsed.tag) payload.destinationTag = parsed.tag;
      // Fallback: use invoiceId if we had it, but for mobile we use tag or just let backend handle

      const res = await fetch(`${API_BASE}/v1/dev/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': DEV_KEY,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed');

      const entry = {
        id: Date.now(),
        amount: parsed.amount || '?',
        tag: parsed.tag || 'n/a',
        tx: json.simulatedTxHash,
        time: new Date().toLocaleTimeString(),
      };
      setHistory((h) => [entry, ...h].slice(0, 8));

      Alert.alert('Payment simulated!', `Details sent • tx ${json.simulatedTxHash?.slice(0, 10)}...\n\nListener (for XRPL) will confirm shortly.`);
      
      // Reliability: poll for status update (in case of real confirmation)
      if (parsed.tag) {
        // Reliability: poll for real confirmation from listener/reconciliation
        const poll = setInterval(async () => {
          try {
            // In real: GET /invoices with tag or address filter (add endpoint if needed)
            const check = await fetch(`${API_BASE}/v1/invoices`, { headers: { 'X-API-Key': DEV_KEY } });
            if (check.ok) {
              const list = await check.json();
              const updated = list.find((i: any) => i.destinationTag == parsed.tag && i.status === 'paid');
              if (updated) {
                Alert.alert('Confirmed on-chain!', `Invoice paid via listener. Tx: ${updated.txHash?.slice(0,12)}`);
                clearInterval(poll);
              }
            }
          } catch {}
        }, 5000);
        setTimeout(() => clearInterval(poll), 60000); // stop after 1min
      }
      // clear for next
      setParsed(null);
      setUriInput('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandBanner}>
        <View style={styles.brandHeader}>
          <Image source={require('@/assets/images/icon.png')} style={styles.brandIcon} />
          <View>
            <Image source={require('@/assets/images/dcp-logo-100.png')} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandTagline}>Scan • Pay • Get Paid</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Direct Connect Pay — Customer Wallet</Text>

        {/* Pay Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pay an Invoice</Text>

          {isScanning ? (
            <View style={{ height: 280, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              {hasPermission === null ? (
                <Text style={styles.detailText}>Requesting camera permission...</Text>
              ) : hasPermission === false ? (
                <Text style={styles.detailText}>No access to camera. Use paste instead.</Text>
              ) : (
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={onBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                />
              )}
              <TouchableOpacity style={[styles.button, { margin: 12 }]} onPress={() => setIsScanning(false)}>
                <Text style={styles.buttonText}>Cancel Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Scan QR or Paste Payment URI (from merchant dashboard)</Text>
              <TextInput
                style={styles.input}
                placeholder="xrpl:rHb9CJ... ?amount=12.5&dt=373390764"
                value={uriInput}
                onChangeText={setUriInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={loadFromInput}>
                  <Text style={styles.buttonText}>Load / Demo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => setIsScanning(true)}>
                  <Text style={styles.buttonText}>📷 Scan QR</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {parsed && !isScanning && (
            <View style={styles.details}>
              <Text style={styles.detailText}>To: {parsed.destination.slice(0, 20)}...</Text>
              {parsed.amount && <Text style={styles.detailText}>Amount: {parsed.amount} XRP</Text>}
              {parsed.tag && <Text style={styles.detailText}>Destination Tag: {parsed.tag}</Text>}

              <TouchableOpacity
                style={[styles.payButton, loading && { opacity: 0.6 }]}
                onPress={simulatePay}
                disabled={loading}
              >
                <Text style={styles.payButtonText}>
                  {loading ? 'Sending on Testnet...' : 'Simulate Pay (sends real testnet tx)'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.hint}>This triggers the XRPL listener → invoice auto-confirmed + webhook</Text>
            </View>
          )}
        </View>

        {/* History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Payments (local)</Text>
          {history.length === 0 && (
            <Text style={styles.empty}>Pay something above — simulated txs will appear here.</Text>
          )}
          {history.map((h) => (
            <View key={h.id} style={styles.historyRow}>
              <Text style={styles.historyText}>{h.amount} XRP • tag {h.tag}</Text>
              <Text style={styles.historySub}>{h.time} • {h.tx?.slice(0, 12)}…</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Production: deep link to wallet (Xumm, Phantom, etc.) for real non-custodial pay. Listener + retried webhooks guarantee delivery.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const DCP_TEAL = '#4ECDC4';
const DCP_CYAN = '#00A8E8';
const DCP_BLUE = '#0077B6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0b' },
  brandBanner: {
    backgroundColor: DCP_BLUE,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: DCP_TEAL,
  },
  content: { padding: 20, gap: 20 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  brandIcon: { width: 56, height: 56, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  brandLogo: { width: 140, height: 42 },
  brandTagline: { color: DCP_TEAL, fontSize: 13, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  subtitle: { color: DCP_TEAL, textAlign: 'center', marginBottom: 4, fontWeight: '500', fontSize: 14 },
  card: { backgroundColor: 'rgba(24, 24, 27, 0.95)', borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(78, 205, 196, 0.2)' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  label: { color: 'rgba(170, 170, 170, 0.85)', fontSize: 13 },
  input: {
    backgroundColor: 'rgba(34, 34, 34, 0.75)',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.4)',
  },
  button: {
    backgroundColor: 'rgba(0, 119, 182, 0.35)',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.35)',
  },
  buttonText: { color: DCP_TEAL, fontWeight: '600' },
  payButton: {
    backgroundColor: DCP_TEAL,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: { color: '#042f2e', fontWeight: '700', fontSize: 16 },
  details: { marginTop: 8, gap: 6 },
  detailText: { color: '#ddd', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  hint: { color: 'rgba(102, 102, 102, 0.8)', fontSize: 12, marginTop: 4 },
  historyRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(51, 51, 51, 0.5)' },
  historyText: { color: '#fff' },
  historySub: { color: 'rgba(119, 119, 119, 0.8)', fontSize: 12 },
  empty: { color: 'rgba(102, 102, 102, 0.7)', fontStyle: 'italic' },
  footer: { color: 'rgba(85, 85, 85, 0.7)', fontSize: 12, textAlign: 'center', marginTop: 12 },
});
