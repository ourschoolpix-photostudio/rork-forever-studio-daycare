import { TextInput, StyleSheet, TextInputProps } from 'react-native';

interface DateInputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function DateInput({
  value,
  onChangeText,
  placeholder = 'MM/DD/YYYY',
  ...props
}: DateInputProps) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^\d/]/g, '');
    let formatted = '';
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length > 0) {
      if (digits.length <= 2) {
        formatted = digits;
      } else if (digits.length <= 4) {
        formatted = `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
      } else if (digits.length <= 8) {
        formatted = `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4, 8)}`;
      }
    }
    onChangeText(formatted);
  };

  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={handleChange}
      maxLength={10}
      keyboardType="number-pad"
      placeholderTextColor="#999"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
});
