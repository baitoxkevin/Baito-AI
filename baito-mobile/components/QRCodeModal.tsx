import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  profileData: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    icNumber: string;
  };
}

export default function QRCodeModal({ visible, onClose, profileData }: QRCodeModalProps) {
  const qrRef = useRef<any>(null);

  // Generate QR code data
  const qrData = JSON.stringify({
    id: profileData.id,
    name: profileData.fullName,
    phone: profileData.phone,
    email: profileData.email,
    ic: profileData.icNumber,
    type: 'candidate_profile',
  });

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `My Baito Profile\n\nName: ${profileData.fullName}\nPhone: ${profileData.phone}\nEmail: ${profileData.email}\n\nScan my QR code to view my full profile!`,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Profile shared successfully!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={250}
              backgroundColor="white"
              color="black"
              getRef={(ref) => (qrRef.current = ref)}
            />
          </View>

          {/* Profile Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{profileData.fullName}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#6b7280" />
              <Text style={styles.infoText}>{profileData.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#6b7280" />
              <Text style={styles.infoText}>{profileData.email}</Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsBox}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.instructionsText}>
              Show this QR code to scan and share your profile information
            </Text>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="white" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoContainer: {
    marginBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  instructionsBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  instructionsText: {
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  shareButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
