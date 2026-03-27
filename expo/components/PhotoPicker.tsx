import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface PhotoPickerProps {
  photoUri?: string;
  onPhotoSelected: (uri: string) => void;
  width?: number | string;
  height?: number;
}

export default function PhotoPicker({ photoUri, onPhotoSelected, width = '100%', height = 120 }: PhotoPickerProps) {
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              onPhotoSelected(reader.result as string);
              setLoading(false);
            };
            reader.readAsDataURL(file);
          } else {
            setLoading(false);
          }
        };
        input.click();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error('[PhotoPicker] Error:', err);
      Alert.alert('Error', 'Failed to pick photo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoSelected('');
  };

  const hasValidPhoto = photoUri && 
    typeof photoUri === 'string' && 
    photoUri.trim() !== '' && 
    photoUri !== 'undefined' && 
    photoUri !== 'null' && 
    photoUri !== 'data:' &&
    !photoUri.startsWith('data:,');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo</Text>

      {hasValidPhoto ? (
        <View style={[styles.photoContainer, { width, height }]}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
          <Pressable
            style={styles.removeButton}
            onPress={handleRemovePhoto}
          >
            <View style={styles.removeCircle}>
              <Ionicons name="close" size={14} color="white" />
            </View>
          </Pressable>
          <Pressable
            style={styles.changeButton}
            onPress={handlePickPhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="camera" size={16} color="white" />
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.photoPlaceholder, { width, height }]}
          onPress={handlePickPhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#0066cc" />
          ) : (
            <>
              <Ionicons name="image" size={40} color="#ccc" />
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
    backgroundColor: '#f9f9f9',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  removeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
