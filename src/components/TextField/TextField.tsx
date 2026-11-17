import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import EyeSlash from '@/icons/eye-slash.svg';
import Eye from '@/icons/eye.svg';
import colors from '@/styles/colors';
import styles from './styles';

type TextFieldProps = TextInputProps & {
  label: string;
  // Gray hint under the field (hidden while there's an error)
  helper?: string;
  error?: string | null;
  // Grayed out, can't be edited (e.g. the account email)
  readOnly?: boolean;
  // Password field with a show / hide eye button
  secure?: boolean;
};

// Labeled text input used across forms
function TextField({
  label,
  helper,
  error,
  readOnly = false,
  secure = false,
  editable = true,
  style,
  ...inputProps
}: TextFieldProps) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          readOnly && styles.readOnlyBox,
          !!error && styles.errorBox,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.gray}
          {...inputProps}
          editable={editable && !readOnly}
          secureTextEntry={secure && hidden}
          style={[
            styles.input,
            secure && styles.inputWithIcon,
            readOnly && styles.readOnlyText,
            style,
          ]}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setHidden(value => !value)}
            style={styles.eyeButton}
          >
            {hidden ? (
              <Eye width={24} height={24} color={colors.gray} />
            ) : (
              <EyeSlash width={24} height={24} color={colors.gray} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

export default TextField;
