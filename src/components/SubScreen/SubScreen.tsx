// Shared pieces for the profile and settings screens — not in Figma yet; styled like the trail screens
// (flat white, 24pt gutter, hairlines instead of boxes, round glass back button, large title that tucks
// into a frosted bar as you scroll, like iOS).

import type { IconName } from '@/components/Icon/Icon';
import type { ReactNode } from 'react';
import { Children } from 'react';
import { Platform, Switch, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomBar } from '@/components/BottomBar/BottomBar';
import { GlassBackButton } from '@/components/GlassBackButton/GlassBackButton';
import { Icon } from '@/components/Icon/Icon';
import { Chevron, divider, ListRow, Section } from '@/components/List/List';
import { TitleBar } from '@/components/TitleBar/TitleBar';
import { colors, layout, type } from '@/styles/theme';
import styles from './styles';

/* ---------- Screen shell ---------- */

type SubScreenProps = {
  title: string;
  subtitle?: string;
  /** Pinned bottom bar, e.g. a Save button. */
  cta?: ReactNode;
  children: ReactNode;
};

/** Pushed profile screen: round back button, large title, scrolling body. The title slides into a
 *  frosted bar once it scrolls under the back button. */
export function SubScreen({ title, subtitle, cta, children }: SubScreenProps) {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    y.set(e.contentOffset.y);
  });
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + layout.barHeight + 8,
            paddingBottom: (cta ? 120 : 48) + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.heading}>
          <Text style={type.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </Animated.ScrollView>
      <TitleBar title={title} y={y} from={20} to={52} />
      <GlassBackButton />
      {cta ? <BottomBar>{cta}</BottomBar> : null}
    </View>
  );
}

/* ---------- Grouped rows ---------- */

/** A quiet caption over rows split by hairlines, with an optional footnote. No card around it. */
export function Group({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children).filter(Boolean);
  const body = (
    <View>
      {rows.map((row, i) => (
        <View key={i} style={i > 0 && divider}>
          {row}
        </View>
      ))}
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
  return title ? (
    <Section title={title} gap={4}>
      {body}
    </Section>
  ) : (
    body
  );
}

type RowProps = {
  icon?: IconName;
  label: string;
  /** Second line under the label. */
  detail?: string;
  /** Right-aligned value, e.g. the current setting. */
  value?: string;
  onPress?: () => void;
  /** Red label for sign out / delete. */
  destructive?: boolean;
  accessibilityHint?: string;
};

export function Row({
  icon,
  label,
  detail,
  value,
  onPress,
  destructive,
  accessibilityHint,
}: RowProps) {
  const tint = destructive ? colors.error : colors.ink;
  return (
    <ListRow
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[label, value, detail].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      style={styles.row}
    >
      {icon ? (
        <Icon
          name={icon}
          size={22}
          color={destructive ? colors.error : colors.ink}
          strokeWidth={1.7}
        />
      ) : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: tint }]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress && !destructive ? <Chevron /> : null}
    </ListRow>
  );
}

type SwitchRowProps = {
  icon?: IconName;
  label: string;
  detail?: string;
  value: boolean;
  onChange: (v: boolean) => void;
};

/** The whole row toggles, not just the switch, so it's an easy target with gloves on. */
export function SwitchRow({
  icon,
  label,
  detail,
  value,
  onChange,
}: SwitchRowProps) {
  return (
    <ListRow
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={detail}
      style={styles.row}
    >
      {icon ? (
        <Icon name={icon} size={22} color={colors.ink} strokeWidth={1.7} />
      ) : null}
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.navy, false: colors.pressed }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.pressed}
        // react-native-web tints the thumb teal when on unless told otherwise
        {...(Platform.OS === 'web' &&
          ({ activeThumbColor: colors.white } as object))}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </ListRow>
  );
}
