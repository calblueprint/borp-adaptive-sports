import { StyleSheet, Text, TextInput } from 'react-native';

export default function CodeInput({
  label,
  value,
  onChangeText,
  onSubmit,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  editable: boolean;
}) {
  return (
    <>
      <Text>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder="Enter the code from your email"
        autoFocus
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={10}
        editable={editable}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
