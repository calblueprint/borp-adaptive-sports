import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Frost } from '@/components/Glass/Glass';
import styles from './styles';

/** The screen's main action, pinned to the bottom in thumb reach on a frosted bar the page reads through. */
export function BottomBar({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Frost style={[styles.bar, { paddingBottom: Math.max(bottom, 16) }, style]}>
      {children}
    </Frost>
  );
}
