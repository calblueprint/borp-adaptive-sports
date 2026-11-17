import { Pressable, Text, View } from 'react-native';
import { MOBILITY_OPTIONS } from '@/lib/profiles';
import styles from './styles';

type MobilityChipsProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  // Lets the user tap the selected chip again to clear it
  clearable?: boolean;
  disabled?: boolean;
};

// Single-choice chips for how someone gets around on trails
export default function MobilityChips({
  value,
  onChange,
  clearable = false,
  disabled = false,
}: MobilityChipsProps) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {MOBILITY_OPTIONS.map(option => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(selected && clearable ? null : option)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
