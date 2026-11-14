// Shared pieces for the survey screens — not in Figma yet; styled to match the trail details screen
// (flat white, 24pt gutter, quiet captions over groups, hairlines not boxes, frosted bottom bar).
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomBar } from '@/components/BottomBar/BottomBar';
import { Frost } from '@/components/Glass/Glass';
import { GlassBackButton } from '@/components/GlassBackButton/GlassBackButton';
import { barButtonTop } from '@/components/TitleBar/TitleBar';
import { colors, type } from '@/styles/theme';
import styles from './styles';

export const HAIR = { borderColor: colors.line, borderWidth: 0.5 } as const;
export const STEPS = ['Get ready', 'At the trailhead', 'On the trail'] as const;

type ScreenProps = {
  /** 1-based step in STEPS. Leave out after the last step (Review and send). */
  step?: number;
  /** Small line above the title when there's no step label, e.g. the trail name. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Floating button top-right, e.g. help. */
  right?: ReactNode;
  /** Bottom bar: usually a Button plus a short note. */
  cta: ReactNode;
  children: ReactNode;
};

/** Scrolling survey step with a back button, a step label and a pinned bottom bar. */
export function SurveyScreen({
  step,
  eyebrow,
  title,
  subtitle,
  right,
  cta,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 64, paddingBottom: 140 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.heading}>
          {step ? <StepLabel step={step} /> : null}
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={type.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
      {/* Frosts the page as it scrolls under the status bar */}
      <Frost style={[styles.statusBand, { height: insets.top }]} />
      <GlassBackButton />
      {right ? (
        <View style={[styles.right, { top: barButtonTop(insets.top) }]}>
          {right}
        </View>
      ) : null}
      <BottomBar>{cta}</BottomBar>
    </View>
  );
}

/** Three bars across the page, filled up to this step. No "1 of 3": with three bars the count is plain to
 *  see, and the step's name is the title right under it. VoiceOver still reads the count. */
export function StepLabel({ step }: { step: number }) {
  return (
    <View
      style={styles.bars}
      accessible
      accessibilityLabel={`Step ${step} of ${STEPS.length}, ${STEPS[step - 1]}`}
    >
      {STEPS.map((s, i) => (
        <View key={s} style={[styles.bar, i < step && styles.barOn]} />
      ))}
    </View>
  );
}

export const surveyStyles = StyleSheet.create({
  ctaNote: { fontSize: 13, color: colors.secondary, textAlign: 'center' },
  meta: { fontSize: 15, lineHeight: 20, color: colors.secondary },
  faint: { fontSize: 13, color: colors.tertiary },
  link: { fontSize: 15, fontWeight: '600', color: colors.navy },
  pressed: { opacity: 0.6 },
});
