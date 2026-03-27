import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, parsePrice } from '@/utils/priceFormatter';

interface SheetSize {
  size: string;
  qty: string;
}

interface AddPackageModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (packageData: { id: string; name: string; price: number; cost: number; type: 'multi-pose' | 'single-pose' | 'ala-carte' | 'specialty' | 'digital-package' | 'build-your-own' | 'wall-portrait'; numberOfPoses?: number; sheetSizes?: SheetSize[] }) => void;
  editingItem?: any;
  onEdit?: (packageData: { id: string; name: string; price: number; cost: number; type: 'multi-pose' | 'single-pose' | 'ala-carte' | 'specialty' | 'digital-package' | 'build-your-own' | 'wall-portrait'; numberOfPoses?: number; sheetSizes?: SheetSize[] }) => void;
}

export default function AddPackageModal({ visible, onClose, onAdd, editingItem, onEdit }: AddPackageModalProps) {
  const [selectedType, setSelectedType] = useState<'multi-pose' | 'single-pose' | 'ala-carte' | 'specialty' | 'digital-package' | 'build-your-own' | 'wall-portrait' | null>(null);
  const [packageName, setPackageName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [numberOfPoses, setNumberOfPoses] = useState('');
  const [sheetSizes, setSheetSizes] = useState<SheetSize[]>([
    { size: '8x10', qty: '' },
    { size: '5x7', qty: '' },
    { size: '3.5x5', qty: '' },
    { size: 'Wallets', qty: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!editingItem;

  useEffect(() => {
    if (isEditing && editingItem) {
      setSelectedType(editingItem.type);
      setPackageName(editingItem.name);
      setPrice(formatPrice(editingItem.price || 0));
      setCost(formatPrice(editingItem.cost || 0));
      if (editingItem.numberOfPoses) {
        setNumberOfPoses(editingItem.numberOfPoses.toString());
      }
      if (editingItem.sheetSizes && editingItem.sheetSizes.length > 0) {
        const sheetMap: { [key: string]: string } = {};
        editingItem.sheetSizes.forEach((s: SheetSize) => {
          sheetMap[s.size] = String(s.qty || '');
        });
        setSheetSizes([
          { size: '8x10', qty: sheetMap['8x10'] || '' },
          { size: '5x7', qty: sheetMap['5x7'] || '' },
          { size: '3.5x5', qty: sheetMap['3.5x5'] || '' },
          { size: 'Wallets', qty: sheetMap['Wallets'] || '' },
        ]);
      } else {
        setSheetSizes([
          { size: '8x10', qty: '' },
          { size: '5x7', qty: '' },
          { size: '3.5x5', qty: '' },
          { size: 'Wallets', qty: '' },
        ]);
      }
    }
  }, [isEditing, editingItem]);

  const handleAdd = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a package type');
      return;
    }
    if (!packageName.trim() || !price.trim() || !cost.trim()) {
      Alert.alert('Error', 'Package name, price, and cost are required');
      return;
    }

    setSubmitting(true);
    try {
      const packageData = {
        id: isEditing ? editingItem.id : `pkg-${Date.now()}`,
        name: packageName,
        price: parsePrice(price),
        cost: parsePrice(cost),
        type: selectedType,
        numberOfPoses: selectedType === 'multi-pose' ? parseInt(numberOfPoses) : undefined,
        sheetSizes: sheetSizes,
      };

      if (isEditing && onEdit) {
        onEdit(packageData);
        setPackageName('');
        setPrice('');
        setCost('');
        setNumberOfPoses('');
        setSheetSizes([
          { size: '8x10', qty: '' },
          { size: '5x7', qty: '' },
          { size: '3.5x5', qty: '' },
          { size: 'Wallets', qty: '' },
        ]);
        setSelectedType(null);
        onClose();
      } else {
        onAdd(packageData);
        setPackageName('');
        setPrice('');
        setCost('');
        setNumberOfPoses('');
        setSheetSizes([
          { size: '8x10', qty: '' },
          { size: '5x7', qty: '' },
          { size: '3.5x5', qty: '' },
          { size: 'Wallets', qty: '' },
        ]);
        setSelectedType(null);
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add package');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalSheets = () => {
    const qty8x10 = parseFloat(sheetSizes[0].qty) || 0;
    const qty5x7 = parseFloat(sheetSizes[1].qty) || 0;
    const qty3_5x5 = parseFloat(sheetSizes[2].qty) || 0;
    const qtyWallets = parseFloat(sheetSizes[3].qty) || 0;

    const sheetsPerImage = (qty8x10 / 1) + (qty5x7 / 2) + (qty3_5x5 / 4) + (qtyWallets / 8);
    const poses = selectedType === 'multi-pose' ? (parseFloat(numberOfPoses) || 0) : 1;
    const totalSheets = sheetsPerImage * poses;

    if (totalSheets === 0) return '0';
    
    return Number.isInteger(totalSheets) ? totalSheets.toString() : totalSheets.toFixed(1);
  };

  const handleClose = () => {
    setPackageName('');
    setPrice('');
    setCost('');
    setNumberOfPoses('');
    setSheetSizes([
      { size: '8x10', qty: '' },
      { size: '5x7', qty: '' },
      { size: '3.5x5', qty: '' },
      { size: 'Wallets', qty: '' },
    ]);
    setSelectedType(null);
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
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Package' : 'Add Package'}</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={16} color="white" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Multi Pose Packages</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'multi-pose' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('multi-pose')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'multi-pose' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'multi-pose' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>Multi Pose Package</Text>
                    <Text style={styles.packageTypeDesc}>Multiple poses in one package</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Single Pose Packages</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'single-pose' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('single-pose')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'single-pose' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'single-pose' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>Single Pose Package</Text>
                    <Text style={styles.packageTypeDesc}>One pose per package</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>A La Carte</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'ala-carte' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('ala-carte')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'ala-carte' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'ala-carte' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>A La Carte Item</Text>
                    <Text style={styles.packageTypeDesc}>Individual item</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specialty Item</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'specialty' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('specialty')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'specialty' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'specialty' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>Specialty Item</Text>
                    <Text style={styles.packageTypeDesc}>Special offer</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Digital</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'digital-package' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('digital-package')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'digital-package' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'digital-package' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>Digital Package</Text>
                    <Text style={styles.packageTypeDesc}>Digital files</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'build-your-own' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('build-your-own')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'build-your-own' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'build-your-own' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>Build Your Own</Text>
                    <Text style={styles.packageTypeDesc}>Custom package</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prints</Text>
              <Pressable
                style={[
                  styles.packageButton,
                  selectedType === 'wall-portrait' && styles.packageButtonSelected,
                ]}
                onPress={() => setSelectedType('wall-portrait')}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={selectedType === 'wall-portrait' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedType === 'wall-portrait' ? '#0066cc' : '#ccc'}
                  />
                  <View style={styles.buttonText}>
                    <Text style={styles.packageTypeName}>Wall Portrait</Text>
                    <Text style={styles.packageTypeDesc}>Wall art</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {selectedType && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>{selectedType === 'multi-pose' || selectedType === 'single-pose' ? 'Package Details' : 'Item Details'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={selectedType === 'multi-pose' || selectedType === 'single-pose' ? "Package Name (e.g., Premium Package)" : "Item Name"}
                  value={packageName}
                  onChangeText={(text) => setPackageName(text.replace(/\b\w/g, (char) => char.toUpperCase()))}
                  editable={!submitting}
                  autoCapitalize="words"
                />
                {selectedType === 'multi-pose' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Number of Poses"
                    value={numberOfPoses}
                    onChangeText={setNumberOfPoses}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    editable={!submitting}
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  editable={!submitting}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Cost"
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  editable={!submitting}
                />
              </View>
            )}

            {(selectedType === 'multi-pose' || selectedType === 'single-pose' || selectedType === 'ala-carte' || selectedType === 'specialty' || selectedType === 'digital-package' || selectedType === 'build-your-own' || selectedType === 'wall-portrait') && (
              <View style={styles.sheetSizesSection}>
                <Text style={styles.detailsTitle}>Sheet Sizes</Text>
                {sheetSizes.map((item, index) => (
                  <View key={item.size} style={styles.sheetSizeRow}>
                    <Text style={styles.sheetSizeLabel}>{item.size}</Text>
                    <TextInput
                      style={styles.qtyInput}
                      placeholder="Qty"
                      value={item.qty}
                      onChangeText={(value) => {
                        const updated = [...sheetSizes];
                        updated[index].qty = value;
                        setSheetSizes(updated);
                      }}
                      keyboardType="number-pad"
                      editable={!submitting}
                    />
                  </View>
                ))}
                
                <View style={styles.totalSheetsContainer}>
                  <Text style={styles.totalSheetsLabel}>Total Sheets</Text>
                  <Text style={styles.totalSheetsValue}>{calculateTotalSheets()}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <Pressable
            style={[styles.submitButton, (submitting || !selectedType) && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={submitting || !selectedType}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Item' : 'Add Item')}
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
    maxHeight: '90%',
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packageButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  packageButtonSelected: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    flex: 1,
  },
  packageTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  packageTypeDesc: {
    fontSize: 12,
    color: '#999',
  },
  detailsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sheetSizesSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sheetSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetSizeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  qtyInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    width: 80,
  },
  totalSheetsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSheetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalSheetsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066cc',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
