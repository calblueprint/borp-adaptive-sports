// Groups and rows, shared by every screen. No boxes: a caption, rows and hairlines (DESIGN.md › Layout).
import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Icon } from '@/components/Icon/Icon';
import { colors, type } from '@/styles/theme';
import styles from './styles';

/** A hairline across the top of whatever it styles: rows in a list, a bar's edge. */
export const divider = {
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: colors.hairline,
} as const;

/* ---------- Section ---------- */

type SectionProps = {
  title: string;
  /** caption: a quiet 13pt grey caption over its content (most screens). heading: 20pt black (the profile). */
  variant?: 'caption' | 'heading';
  /** Makes the title a link with a chevron, opening its own page: black, like every tappable word. */
  onPress?: () => void;
  accessibilityHint?: string;
  /** A glyph before a linked title. */
  lead?: ReactNode;
  /** A link that asks something of you ("Set how you go on trails"): navy and a size up, so it isn't missed. */
  invite?: boolean;
  /** Grey words at the right end of the title, e.g. a count. */
  aside?: string;
  /** Space between the title and the content. */
  gap?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** A title over its content. The content is the headline, so the title stays quiet. */
export function Section({
  title,
  variant = 'caption',
  onPress,
  accessibilityHint,
  lead,
  invite,
  aside,
  gap = 8,
  style,
  children,
}: SectionProps) {
  const heading = variant === 'heading';
  const titleStyle = [
    heading ? type.sectionHeading : type.caption,
    onPress && styles.link,
    invite && styles.invite,
  ];
  return (
    <View style={[{ gap }, style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [
            styles.head,
            (heading || invite) && styles.headTall,
            invite && styles.headInvite,
            pressed && styles.pressed,
          ]}
        >
          {lead}
          <Text style={titleStyle}>{title}</Text>
          <Icon
            name="next"
            size={heading ? 16 : invite ? 14 : 12}
            color={invite ? colors.navy : colors.ink}
            strokeWidth={2.4}
          />
        </Pressable>
      ) : (
        <View
          style={[styles.head, styles.headSpread, heading && styles.headTall]}
        >
          <Text style={titleStyle} accessibilityRole="header">
            {title}
          </Text>
          {aside ? <Text style={styles.aside}>{aside}</Text> : null}
        </View>
      )}
      {children}
    </View>
  );
}

/* ---------- Rows ---------- */

type ListRowProps = Omit<PressableProps, 'style' | 'children'> & {
  /** A hairline above the row. inset: inside the gutter, like iOS lists. full: edge to edge. */
  divider?: 'inset' | 'full' | false;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** A row that runs full bleed, so its pressed highlight goes edge to edge while its content stays in the
 *  gutter. Lay out whatever goes inside; the row only brings the bleed, the press and the divider. */
export function ListRow({
  divider: line,
  style,
  children,
  ...rest
}: ListRowProps) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        styles.row,
        line === 'full' && divider,
        pressed && styles.rowPressed,
        style,
      ]}
    >
      {line === 'inset' ? <View style={styles.insetDivider} /> : null}
      {children}
    </Pressable>
  );
}

/** The chevron at the end of a row that opens a page. */
export function Chevron() {
  return (
    <Icon name="next" size={16} color={colors.quaternary} strokeWidth={2} />
  );
}

/* ---------- Empty ---------- */

type EmptyStateProps = {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** An empty list: one line and the one useful action, never "0 trails". */
export function EmptyState({
  title,
  action = 'Find a trail',
  onAction = () => router.navigate('/prototype/trails'),
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.empty, style]}>
      <Text style={type.emptyTitle}>{title}</Text>
      <ActionButton label={action} size="large" onPress={onAction} />
    </View>
  );
}
