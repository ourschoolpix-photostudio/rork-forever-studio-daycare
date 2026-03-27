import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useData, EmailTemplate } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

export default function EmailTemplatesScreen() {
  const { emailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } = useData();
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');



  const sortedTemplates = useMemo(() => {
    return [...emailTemplates].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }, [emailTemplates]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, EmailTemplate[]> = {};
    sortedTemplates.forEach((template) => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [sortedTemplates]);

  const handleSave = async () => {
    if (!category.trim() || !name.trim() || !subject.trim()) {
      Alert.alert('Error', 'Please fill in Category, Template Name, and Subject');
      return;
    }

    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, {
          user_id: user?.id || '',
          category: category.trim(),
          name: name.trim(),
          subject: subject.trim(),
          body: body.trim(),
        });
        Alert.alert('Success', 'Template updated');
      } else {
        await addEmailTemplate({
          user_id: user?.id || '',
          category: category.trim(),
          name: name.trim(),
          subject: subject.trim(),
          body: body.trim(),
        });
        Alert.alert('Success', 'Template created');
      }
      setIsFormVisible(false);
      setEditingTemplate(null);
      setCategory('');
      setName('');
      setSubject('');
      setBody('');
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save template');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setCategory(template.category);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setIsFormVisible(true);
  };

  const handleDelete = (template: EmailTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmailTemplate(template.id);
              Alert.alert('Success', 'Template deleted');
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  if (isFormVisible) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Stack.Screen options={{ title: editingTemplate ? 'Edit Template' : 'New Template' }} />
        <ScrollView style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Template Info</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Welcome, Follow-up, Reminder"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Template Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Welcome Email"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Content</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject Line</Text>
              <TextInput
                style={styles.input}
                placeholder="Email subject"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Body</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Email body text..."
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsFormVisible(false);
                setEditingTemplate(null);
                setCategory('');
                setName('');
                setSubject('');
                setBody('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Template</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Email Templates',
          headerRight: () => (
            <Pressable 
              style={{ paddingRight: 12 }}
              onPress={() => {
                setEditingTemplate(null);
                setCategory('');
                setName('');
                setSubject('');
                setBody('');
                setIsFormVisible(true);
              }}
            >
              <Ionicons name="add" size={28} color="#0066cc" />
            </Pressable>
          ),
        }} 
      />
      <ScrollView style={styles.listContainer}>
        {Object.keys(groupedTemplates).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No email templates yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first template</Text>
          </View>
        ) : (
          Object.entries(groupedTemplates).map(([categoryName, templates]) => (
            <View key={categoryName} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{categoryName}</Text>
              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  style={styles.templateCard}
                  onPress={() => handleEdit(template)}
                >
                  <View style={styles.templateCardHeader}>
                    <View style={styles.templateCardLeft}>
                      <Ionicons name="mail" size={20} color="#0066cc" />
                      <View style={styles.templateCardInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateSubject} numberOfLines={1}>
                          {template.subject}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.templateCardActions}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(template);
                        }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                      </Pressable>
                    </View>
                  </View>
                  {template.body ? (
                    <Text style={styles.templateBody} numberOfLines={2}>
                      {template.body}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  templateCardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  templateCardInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  templateSubject: {
    fontSize: 14,
    color: '#666',
  },
  templateBody: {
    fontSize: 13,
    color: '#999',
    marginTop: 12,
    lineHeight: 18,
  },
  templateCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 150,
    paddingTop: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 24,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#0066cc',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
