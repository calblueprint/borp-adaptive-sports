import TextField from '@/components/TextField/TextField';

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
    <TextField
      label={label}
      placeholder="Enter the code from your email"
      autoFocus
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
  );
}
