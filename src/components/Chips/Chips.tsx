import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon/Icon';
import { colors } from '@/styles/theme';
import styles from './styles';

/** Single-choice chips: big filled targets (gloves, sun), black once chosen. Tap the chosen one again to
 *  clear it when the parent allows it (passes undefined). `previous` marks the option the last survey
 *  picked with a darker grey fill and a clock turning back, no ring (the black outline read heavy): pick
 *  the same one and the glyph turns white inside the black fill ("still true"); pick another and the shaded
 *  one stays beside it, so the change shows at a glance. The glyph keeps it from being grey alone. */
export function Chips({
  options,
  value,
  onChange,
  label,
  clearable,
  previous,
  icon,
}: {
  options: string[];
  value?: string;
  onChange: (v: string | undefined) => void;
  label: string;
  clearable?: boolean;
  previous?: string;
  /** A glyph before the word, for options that are easier to tell apart by picture (a walker vs a scooter). */
  icon?: (option: string, color: string) => ReactNode;
}) {
  return (
    <View
      style={styles.chips}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map(o => {
        const on = value === o;
        const last = previous === o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(on && clearable ? undefined : o)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={last ? `${o}, last survey's answer` : o}
            accessibilityHint={
              on && clearable ? 'Tap again to clear' : undefined
            }
            style={({ pressed }) => [
              styles.chip,
              (icon || last) && styles.chipWithIcon,
              pressed && styles.chipPressed,
              last && (pressed ? styles.chipLastPressed : styles.chipLast),
              on && styles.chipOn,
            ]}
          >
            {last ? (
              <Icon
                name="history"
                size={16}
                color={on ? colors.white : colors.ink}
                strokeWidth={2}
              />
            ) : null}
            {icon?.(o, on ? colors.white : colors.ink)}
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pick any number: the same chips, each one toggles on and off. */
export function MultiChips({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = values.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() =>
              onChange(on ? values.filter(v => v !== o) : [...values, o])
            }
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o}
            style={({ pressed }) => [
              styles.chip,
              pressed && styles.chipPressed,
              on && styles.chipOn,
            ]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
