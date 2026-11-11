// Survey status as a word. No status hues and no glyph: the word says it, and emphasis says whether the
// trail needs you. Trails that need a survey get the navy accent; up-to-date ones recede to grey.

import type { TrailStatus } from '@/data/trails';
import type { StyleProp, TextStyle } from 'react-native';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { STATUS_LABEL } from '@/data/trails';
import { colors } from '@/styles/theme';
import styles from './styles';

/** Never surveyed or due again: the trails a surveyor is looking for. */
export const needsSurvey = (status: TrailStatus) => status !== 'current';

/** The status word: an eyebrow above the name on the trail page and in lists, the last line on a card.
 *  With `since` (the last survey's month) the date follows in grey, so a surveyor can see how stale it is. */
export function StatusLabel({
  status,
  isNew,
  since,
  style,
}: {
  status: TrailStatus;
  isNew?: boolean;
  since?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        styles.text,
        { color: needsSurvey(status) ? colors.navy : colors.secondary },
        style,
      ]}
      numberOfLines={1}
    >
      {isNew ? `New · ${STATUS_LABEL[status]}` : STATUS_LABEL[status]}
      {since ? <Text style={styles.since}> · surveyed {since}</Text> : null}
    </Text>
  );
}

/** Something BORP needs you to act on (a survey sent back with changes requested): a navy circle with "!".
 *  Only where a word sits beside it. Readings outside a guideline say so in words ("Over 5%"), not with a glyph. */
export function AttentionMark({ size = 16 }: { size?: number }) {
  return (
    <View accessible accessibilityLabel="Needs you">
      <Svg width={size} height={size} viewBox="0 0 16 16">
        <Circle cx={8} cy={8} r={7.5} fill={colors.navy} />
        <Path
          d="M8 4.4v4.4"
          stroke={colors.white}
          strokeWidth={1.7}
          strokeLinecap="round"
        />
        <Circle cx={8} cy={11.4} r={1} fill={colors.white} />
      </Svg>
    </View>
  );
}
