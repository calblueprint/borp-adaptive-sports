import type { ComponentRef, ReactNode, Ref } from 'react';
import type { TextInputProps, ViewStyle } from 'react-native';
import { Text, TextInput, View } from 'react-native';
import { colors, type } from '@/styles/theme';
import styles from './styles';

export type TextInputRef = ComponentRef<typeof TextInput>;

type FieldProps = TextInputProps & {
  label?: string;
  /** Read-only grey field (Figma: verified email on the password screen). */
  readOnly?: boolean;
  right?: ReactNode;
  containerStyle?: ViewStyle;
  /** Gap between label and input: 6 on email/password, 8 on profile. */
  labelGap?: number;
  /** Shows a red border and this message under the field. */
  error?: string;
  ref?: Ref<TextInputRef>;
};

/** A labelled text field from the sign-up screens. */
export function Field({
  label,
  readOnly,
  right,
  containerStyle,
  labelGap = 6,
  error,
  style,
  ref,
  ...input
}: FieldProps) {
  return (
    <View style={[{ gap: labelGap }, containerStyle]}>
      {label ? <Text style={[type.label, styles.label]}>{label}</Text> : null}
      <View
        style={[
          styles.input,
          readOnly && styles.inputReadonly,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          ref={ref}
          editable={!readOnly}
          placeholderTextColor={colors.muted}
          selectionColor={colors.selection}
          accessibilityLabel={label}
          style={[
            type.input,
            styles.inputText,
            readOnly && styles.inputTextReadonly,
            right ? styles.withRight : null,
            style,
          ]}
          {...input}
        />
        {right ? <View style={styles.inputRight}>{right}</View> : null}
      </View>
      {error ? (
        <Text
          style={[type.description, styles.errorText]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
