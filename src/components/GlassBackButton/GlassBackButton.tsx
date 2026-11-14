import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { RoundButton } from '@/components/RoundButton/RoundButton';
import { barButtonTop } from '@/components/TitleBar/TitleBar';
import CaretLeft from '@/icons/caret-left.svg';
import { colors } from '@/styles/theme';

/** Round glass back button, top left, for every page after sign-up. */
export function GlassBackButton({
  onPress = () => router.back(),
}: {
  onPress?: () => void;
}) {
  const { top } = useSafeAreaInsets();
  return (
    <RoundButton
      label="Back"
      onPress={onPress}
      style={{ top: barButtonTop(top), left: 16 }}
    >
      <CaretLeft color={colors.stone} />
    </RoundButton>
  );
}
