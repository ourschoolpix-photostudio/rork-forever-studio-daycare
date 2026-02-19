import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, parsePrice } from '@/utils/priceFormatter';

interface EditAlaCarteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (itemData: { id: string; name: string; price: number; cost?: number; type?: string }) => void;
  editingItem?: any;
}

export default function EditAlaCarteModal({ visible, onClose, onSave, editingItem }: EditAlaCarteModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(formatPrice(editingItem.price));
    }
  }, [editingItem]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }

    setSubmitting(true);
    try {
      onSave({
        id: editingItem.id,
        name: name.trim(),
        price: parsePrice(price),
        cost: editingItem.cost,
        type: editingItem.type || 'ala-carte',
      });
      setName('');
      setPrice('');
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPrice('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#1a1a1a" />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={name}
              onChangeText={setName}
              editable={!submitting}
            />

            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              editable={!submitting}
            />
          </View>

          <Pressable
            style={[styles.submitButton, (submitting) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Saving...' : 'Save Item'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
