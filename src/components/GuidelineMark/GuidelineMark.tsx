import type { Mark } from '@/data/trails';
import { View } from 'react-native';
import CheckCircle from '@/icons/check-circle.svg';
import { colors } from '@/styles/theme';

/** Navy check when it meets the guideline. When it doesn't, the words beside it say how ("Narrower than
 *  36 in"), so there's no warning glyph to decode. */
export function GuidelineMark({ mark }: { mark: Mark }) {
  return mark === 'ok' ? (
    <View accessible accessibilityLabel="Meets guideline">
      <CheckCircle color={colors.navy} />
    </View>
  ) : null;
}
