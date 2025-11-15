import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Background from './Background';
import { uploadFile } from '../services/uploadService';
import useAuthStore from '../store/authStore';

export default function DataScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuthStore();

  const handleFileUpload = async () => {
    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'text/plain',
          'text/csv',
          'text/rtf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file under 10MB.');
        return;
      }

      console.log('[DataScreen] Selected file:', {
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
      });

      // Show loading
      setIsUploading(true);
      setUploadProgress(0);

      // Upload file with progress tracking
      const uploadResult = await uploadFile(
        file.uri,
        file.name,
        file.mimeType,
        user.id,
        (progressData) => {
          // Update progress state
          const percent = Math.round(progressData.progress * 100);
          setUploadProgress(percent);
          console.log('[DataScreen] Upload progress:', percent + '%');
        }
      );

      setIsUploading(false);
      setUploadProgress(0);

      if (!uploadResult.success) {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload file');
        return;
      }

      // Show success alert
      Alert.alert(
        'File Uploaded Successfully',
        `${file.name} has been analyzed. ${uploadResult.extractedData.summary}\n\nYou can now ask questions about this data in your conversations.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('[DataScreen] Error uploading file:', error);
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Background style={styles.backgroundImage}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bar-chart-outline" size={24} color="#eaff61" />
          <Text style={styles.headerTitle}>Data</Text>
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Upload Button */}
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFileUpload}
            disabled={isUploading}
            activeOpacity={0.85}
          >
            <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.uploadButtonBlur}>
              <View style={styles.uploadButtonContent}>
                {isUploading ? (
                  <>
                    <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
                    <Text style={styles.uploadButtonText}>Upload Health Data</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#eaff61" />
                    <Text style={styles.uploadButtonText}>Upload Health Data</Text>
                  </>
                )}
              </View>
              {isUploading && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                </View>
              )}
            </BlurView>
          </TouchableOpacity>

          {/* Placeholder content */}
          <View style={styles.placeholderContainer}>
            <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.placeholderBlur}>
              <View style={styles.placeholderContent}>
                <Ionicons name="bar-chart-outline" size={64} color="#eaff61" />
                <Text style={styles.placeholderTitle}>Coming Soon</Text>
                <Text style={styles.placeholderText}>
                  This page will display your health data, charts, and analytics from your connected apps.
                </Text>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </Background>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    zIndex: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 32,
  },
  titleBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.2)',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    // Android shadow
    elevation: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 10,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  placeholderBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // iOS 26 glass UI shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    // Android shadow
    elevation: 12,
  },
  placeholderContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 48,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 24,
  },
  uploadButton: {
    marginBottom: 24,
  },
  uploadButtonBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  uploadTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  uploadProgressText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eaff61',
    minWidth: 50,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#eaff61',
    borderRadius: 2,
  },
});
