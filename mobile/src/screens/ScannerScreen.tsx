import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScannerScreen({ onClose }: { onClose: () => void }) {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      // Expected QR Data format from mock data: "TICKET_{eventId}_{userId}" or a UUID.
      // For this MVP, we query event_registrations for qr_code_data = data
      
      const { data: registration, error: fetchError } = await supabase
        .from('event_registrations')
        .select('*, users(name), events(title)')
        .eq('qr_code_data', data)
        .single();

      if (fetchError || !registration) {
        Alert.alert(
          'Invalid Ticket ❌', 
          'This QR code does not match any valid registration in the system.',
          [{ text: 'Scan Again', onPress: () => setScanned(false) }]
        );
        setProcessing(false);
        return;
      }

      if (registration.check_in_status) {
        Alert.alert(
          'Already Checked In ⚠️', 
          `${registration.users?.name} already checked in at ${new Date(registration.check_in_time).toLocaleTimeString()}`,
          [{ text: 'Scan Again', onPress: () => setScanned(false) }]
        );
        setProcessing(false);
        return;
      }

      // Mark as checked in
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          check_in_status: true,
          check_in_time: new Date().toISOString(),
          checked_in_by: user?.id
        })
        .eq('registration_id', registration.registration_id);

      if (updateError) throw updateError;

      Alert.alert(
        'Check-In Successful ✅', 
        `Verified: ${registration.users?.name}\nEvent: ${registration.events?.title}`,
        [{ text: 'Next Ticket', onPress: () => setScanned(false) }]
      );

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to process ticket. Please try again.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: theme.bg }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, marginBottom: 20 }}>We need your permission to use the camera.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay UI */}
      <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Ticket</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scannerFrame}>
          <View style={styles.scanTarget} />
        </View>

        <View style={styles.footer}>
          {processing ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.statusText}>Verifying Ticket...</Text>
            </View>
          ) : (
            <Text style={styles.instruction}>Align QR code within the frame</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  scannerFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4ADE80',
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
    paddingBottom: 80,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  }
});
