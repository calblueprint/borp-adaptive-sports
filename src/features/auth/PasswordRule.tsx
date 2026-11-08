import { StyleSheet, Text, View } from 'react-native';
import CheckCircle from '@/icons/check-circle.svg';
import XSmall from '@/icons/x-small.svg';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

type PasswordRuleProps = {
  text: string;
  met: boolean;
};

// One password requirement: green check when met, gray X when not
export default function PasswordRule({ text, met }: PasswordRuleProps) {
  return (
    <View style={styles.row}>
      {met ? (
        <CheckCircle width={16} height={16} color={colors.success} />
      ) : (
        <XSmall width={16} height={16} color={colors.gray} />
      )}
      <Text style={[styles.text, met && styles.met]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { ...typography.p2, color: colors.gray },
  met: { color: colors.success },
});
