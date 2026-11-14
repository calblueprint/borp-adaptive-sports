import type { TextInputRef } from '@/components/Field/Field';
import type { ReactNode, Ref } from 'react';
import type { TextInputProps, ViewStyle } from 'react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import CaretDown from '@/icons/caret-down.svg';
import MagnifyingGlass from '@/icons/magnifying-glass.svg';
import XSmall from '@/icons/x-small.svg';
import { colors } from '@/styles/theme';
import styles from './styles';

type SearchBarProps = TextInputProps & {
  /** Leading icon; the magnifying glass by default. */
  icon?: ReactNode;
  /** Makes the bar a button that shows `value` with a caret, e.g. the "Near …" location bar. */
  onPress?: () => void;
  /** Trailing action. Without one, a typeable bar shows a clear button while it has text. */
  right?: ReactNode;
  containerStyle?: ViewStyle;
  /** The text input, e.g. to focus it from a search button elsewhere. */
  ref?: Ref<TextInputRef>;
};

/** Filled search field from the Trails list; also used by the location picker. */
export function SearchBar({
  icon = <MagnifyingGlass color={colors.secondary} />,
  onPress,
  right,
  containerStyle,
  value,
  onChangeText,
  accessibilityLabel,
  style,
  ref,
  ...input
}: SearchBarProps) {
  const clear =
    !onPress && value && onChangeText ? (
      <Pressable
        onPress={() => onChangeText('')}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
      >
        <XSmall color={colors.stone} />
      </Pressable>
    ) : null;
  return (
    <View style={[styles.bar, containerStyle]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [styles.pick, pressed && styles.pressed]}
        >
          {icon}
          <Text style={styles.text} numberOfLines={1}>
            {value}
          </Text>
          <CaretDown color={colors.stone} strokeWidth={1.5} />
        </Pressable>
      ) : (
        <>
          {icon}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={colors.secondary}
            selectionColor={colors.selection}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel={accessibilityLabel ?? input.placeholder}
            style={[styles.text, styles.input, style]}
            {...input}
          />
        </>
      )}
      {right ?? clear}
    </View>
  );
}
