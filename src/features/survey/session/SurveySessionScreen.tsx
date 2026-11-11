// On the trail (step 3 of 3) — not in Figma yet. The survey session: full-screen map with you walking
// the trail, a recording timer, and a bottom sheet with what to re-check, the pins so far (also as a
// list) and the Drop pin / voice buttons. The sheet collapses to just those buttons (drag or tap the
// grabber) for when you only want to drop pins. Dropping a pin collapses it first so you watch the pin
// land on the map, then its steps open inside the sheet (src/components/survey/pin-sheet.tsx) with the
// pin still in view. Tapping the mic records a quick voice pin to fill in later (tap again to drop it).
// What the last survey flagged sits on the map as grey spots (never navy, never your white pins): tap a
// re-check row or a spot to see where it is, and as you reach one a banner offers to pin it.
// Leaving keeps everything on the phone (paused); the trail details screen then offers "Resume survey".
// Finish is always in sight while recording (top right): it pauses and opens the wrap-up, where nothing is
// sent until Send. Pause is the clock itself (tap again to resume); paused, the capture buttons turn into Resume and Finish, and
// reaching the end of the trail pauses by itself. Coming back from the wrap-up stays paused (or opens the
// pin tapped on the wrap-up map).
import type { IconName } from '@/components/Icon/Icon';
import type { MapPin } from '@/components/SessionMap/SessionMap';
import type { PinKind } from '@/data/survey';
import type { Pin, VoiceNote } from '@/features/survey/SurveyProvider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useReducedMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  usePreventRemove,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Frost, Glass } from '@/components/Glass/Glass';
import { Icon } from '@/components/Icon/Icon';
import {
  Checked,
  EvidenceStep,
  KindStep,
  MeasureStep,
  PinView,
  useKeyboardHeight,
} from '@/components/PinSheet/PinSheet';
import { RoundButton } from '@/components/RoundButton/RoundButton';
import {
  routePoint,
  SessionMap,
  sessionMap,
  walkPosition,
} from '@/components/SessionMap/SessionMap';
import { surveyStyles } from '@/components/SurveyLayout/SurveyLayout';
import {
  RecDot,
  StopSquare,
  TapToRecord,
} from '@/components/SurveyMedia/SurveyMedia';
import { PinRow } from '@/components/SurveySummary/SurveySummary';
import {
  PIN_KINDS,
  pinIcon,
  pinMark,
  recheckCoverage,
  recheckWas,
} from '@/data/survey';
import {
  formatElapsed,
  useElapsed,
  useSurvey,
} from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import Close from '@/icons/close.svg';
import XSmall from '@/icons/x-small.svg';
import { problemSpots } from '@/lib/access';
import { colors, spring, type } from '@/styles/theme';
import styles from './styles';

type SheetStep = 'kind' | 'measure' | 'evidence' | 'view';
type Toast = {
  text: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
};

/** How long the sheet stays collapsed after Drop pin: long enough to watch the pin land and settle. */
const DROP_MS = 750;
/** How close (as a share of the trail) you are to a flagged spot before the "Pin it" banner shows. */
const NEAR = 0.03;
const SPOT = 'spot:'; // map ids for last survey's spots, so they never clash with pin ids

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = useTrails().getTrail(id);
  const { session, pause, resume, savePin, removePin, focusPin, setFocusPin } =
    useSurvey();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const keyboard = useKeyboardHeight();
  const elapsed = useElapsed(session);
  const [sheetHeight, setSheetHeight] = useState(360);
  const [coach, setCoach] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [voicePin, setVoicePin] = useState({ recording: false, ms: 0 });
  // Full sheet (trail, re-check, pins) or just the capture buttons
  const [expanded, setExpanded] = useState(true);
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => void (dropTimer.current && clearTimeout(dropTimer.current)),
    [],
  );

  // Drag the grabber down to collapse, up to expand; a tap toggles
  const handlePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderRelease: (_, g) => {
          if (g.dy > 24) setExpanded(false);
          else if (g.dy < -24) setExpanded(true);
          else if (Math.abs(g.dy) < 8) setExpanded(e => !e);
          else return;
          Haptics.selectionAsync();
        },
      }),
    [],
  );

  // The pin being dropped or edited lives here until it's saved
  const [step, setStep] = useState<SheetStep | null>(null);
  const [draft, setDraft] = useState<Pin | null>(null);
  const [isNew, setIsNew] = useState(false);

  const running = !!session?.resumedAt;
  const map = useMemo(() => sessionMap(id), [id]);
  const walk = useMemo(
    () => walkPosition(elapsed, map.route, map.aspect),
    [elapsed, map],
  );
  const miles = trail ? walk.progress * trail.miles : 0;
  const pins = session?.pins ?? [];
  const recheck =
    trail && session ? recheckCoverage(trail, pins, session.trailhead) : [];
  // Where on the route the last survey flagged each thing (the same spots the trail page shows)
  const spots = useMemo(
    () =>
      trail
        ? problemSpots(trail).map(s => ({
            ...s,
            ...routePoint(s.at, map.route, map.aspect),
            kind: PIN_KINDS.find(k => k.condition === s.key)?.key,
          }))
        : [],
    [trail, map],
  );
  const openSpots = spots.filter(s =>
    recheck.some(r => r.key === s.key && !r.done),
  );
  // The spot picked from its row or on the map; the map pans to it
  const [spotKey, setSpotKey] = useState<string | null>(null);
  const selectedSpot = openSpots.find(s => s.key === spotKey);
  // Spots you waved off ("×" on the banner)
  const [waved, setWaved] = useState<string[]>([]);

  // Coming back via "Resume survey" restarts the clock; coming back from the wrap-up stays paused, with
  // Resume and Finish right there
  const finishing = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (finishing.current) finishing.current = false;
      else resume();
    }, [resume]),
  );
  // The end of the trail pauses by itself, once, so Finish is the next thing you see
  const ended = walk.progress >= 1;
  const autoPaused = useRef(false);
  useEffect(() => {
    if (!ended || !running || autoPaused.current) return;
    autoPaused.current = true;
    pause();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [ended, running, pause]);
  // …and opens the pin that was tapped on the review list
  useFocusEffect(
    useCallback(() => {
      if (!focusPin) return;
      const pin = session?.pins.find(p => p.id === focusPin);
      setFocusPin(null);
      if (!pin) return;
      setCoach(false);
      setDraft(pin);
      setIsNew(false);
      setStep('view');
    }, [focusPin, session, setFocusPin]),
  );

  // Back gesture / Android back: same as the × — pause and return to the trail, nothing is lost.
  // Once the survey is sent there's nothing to keep, so it can go.
  const [leaving, setLeaving] = useState(false);
  const allowLeave = usePreventRemove(!leaving && !!session, () => exit());
  function exit() {
    pause();
    setLeaving(true);
    allowLeave();
    router.dismissTo({ pathname: '/prototype/trail/[id]', params: { id } });
  }

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((t: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  useEffect(
    () => () => void (toastTimer.current && clearTimeout(toastTimer.current)),
    [],
  );

  if (!trail || !session) return null;

  /* ---------- Pin actions ---------- */

  const newPin = (extra: Partial<Pin> = {}): Pin => ({
    id: `pin-${Date.now()}`,
    n: Math.max(0, ...pins.map(p => p.n)) + 1,
    x: walk.x,
    y: walk.y,
    mi: miles,
    photos: [],
    voice: [],
    ...extra,
  });

  // Collapse, let the pin drop where you are, then ask what it is. The map keeps the pin above the sheet.
  function dropPin(kind?: PinKind) {
    if (draft) return; // one pin at a time
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCoach(false);
    setToast(null);
    setSpotKey(null);
    setExpanded(false);
    setDraft(newPin({ kind }));
    setIsNew(true);
    setStep(null);
    if (dropTimer.current) clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(
      () => setStep(kind ? 'measure' : 'kind'),
      reduceMotion ? 0 : DROP_MS,
    );
  }

  function closeSheet() {
    if (dropTimer.current) clearTimeout(dropTimer.current);
    setStep(null);
    setDraft(null);
  }

  function openPin(pinId: string) {
    if ((step && step !== 'view') || (draft && isNew)) return; // finish the pin you're on first
    if (pinId.startsWith(SPOT)) return toggleSpot(pinId.slice(SPOT.length));
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;
    setSpotKey(null);
    setDraft(pin);
    setIsNew(false);
    setStep('view');
  }

  function save() {
    if (!draft) return;
    const before = pins.find(p => p.id === draft.id);
    savePin(draft);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeSheet();
    showToast({
      text: `Pin ${draft.n} ${isNew ? 'saved' : 'updated'}`,
      icon: pinIcon(draft.kind),
      action: {
        label: 'Undo',
        onPress: () => (before ? savePin(before) : removePin(draft.id)),
      },
    });
  }

  function remove(pin: Pin) {
    removePin(pin.id);
    closeSheet();
    showToast({
      text: `Pin ${pin.n} deleted`,
      action: { label: 'Undo', onPress: () => savePin(pin) },
    });
  }

  function saveVoicePin(note: VoiceNote) {
    const pin = newPin({ voice: [note] });
    setCoach(false);
    savePin(pin);
    showToast({
      text: `Voice pin ${pin.n} saved`,
      icon: 'mic',
      action: {
        label: 'Add details',
        onPress: () => {
          setDraft(pin);
          setIsNew(false);
          setStep('kind');
        },
      },
    });
  }

  // Show a flagged spot on the map (tap again to go back to following you)
  function toggleSpot(key: string) {
    if ((step && step !== 'view') || (draft && isNew)) return;
    Haptics.selectionAsync();
    if (step === 'view') closeSheet();
    setSpotKey(k => (k === key ? null : key));
  }

  // Leaving a step for an existing pin goes back to viewing it; for a new pin it cancels the drop
  const cancelEdit = () => (isNew ? closeSheet() : setStep('view'));
  const patch = (p: Partial<Pin>) => setDraft(d => (d ? { ...d, ...p } : d));

  /* ---------- Map ---------- */

  // Last survey's spots first, so your pins draw over them; each leaves once a pin of yours covers it
  const spotPins: MapPin[] = openSpots.map(s => ({
    id: SPOT + s.key,
    n: 0,
    x: s.x,
    y: s.y,
    icon: s.kind ? pinIcon(s.kind) : s.icon,
    last: true,
    label: `${s.title}, flagged last survey, mile ${s.mile}`,
  }));
  const mapPins: MapPin[] = [
    ...spotPins,
    ...[...pins.filter(p => p.id !== draft?.id), ...(draft ? [draft] : [])].map(
      p => ({
        id: p.id,
        n: p.n,
        x: p.x,
        y: p.y,
        icon: p.kind ? pinIcon(p.kind) : undefined,
        mark: pinMark(p),
        needsDetails: !p.kind && p.id !== draft?.id, // a pin being dropped isn't "unfinished" yet
      }),
    ),
  ];
  const activeId =
    draft?.id ?? (selectedSpot ? SPOT + selectedSpot.key : undefined);
  // Reaching a flagged spot while recording: offer to pin it right there
  const nearSpot =
    running && !step
      ? openSpots.find(
          s => Math.abs(walk.progress - s.at) <= NEAR && !waved.includes(s.key),
        )
      : undefined;

  const finish = () => {
    finishing.current = true;
    if (running) pause(); // the wrap-up shows the time so far; Back comes back paused
    closeSheet();
    router.push({ pathname: '/prototype/survey/[id]/review', params: { id } });
  };

  // Re-check rows tick off once a pin (or a trailhead answer) covers them
  const lastTime = draft?.kind
    ? recheck.find(
        r => r.key === PIN_KINDS.find(k => k.key === draft.kind)?.condition,
      )?.was
    : undefined;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SessionMap
        trailId={trail.id}
        bottom={sheetHeight + keyboard}
        you={walk}
        trace={walk.trace}
        pins={mapPins}
        activeId={activeId}
        onPinPress={openPin}
      />

      {/* Top bar */}
      <RoundButton
        label="Pause and exit"
        onPress={exit}
        style={{ top: insets.top + 6, left: 16 }}
      >
        <Close color={colors.stone} />
      </RoundButton>
      {/* The clock is the pause button, like a timer's Live Activity: ❚❚ while recording, ▶ once paused, so
          the same spot resumes (Resume in the sheet does too) */}
      <View
        pointerEvents="box-none"
        style={[styles.statusWrap, { top: insets.top + 6 }]}
      >
        <Glass radius={22} interactive style={styles.status}>
          <Pressable
            onPress={running ? pause : resume}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${running ? 'Recording' : 'Paused'}, ${formatElapsed(elapsed)}`}
            accessibilityHint={
              running ? 'Pauses the survey' : 'Resumes the survey'
            }
            style={({ pressed }) => [
              styles.statusInner,
              pressed && surveyStyles.pressed,
            ]}
          >
            {running ? <RecDot /> : null}
            <Text style={styles.statusText}>
              {running
                ? formatElapsed(elapsed)
                : `Paused · ${formatElapsed(elapsed)}`}
            </Text>
            <Icon
              name={running ? 'pause' : 'play'}
              size={18}
              color={colors.ink}
              strokeWidth={2.4}
            />
          </Pressable>
        </Glass>
      </View>
      {/* Ending is always in sight while recording; paused, it's the big Finish in the sheet instead */}
      {running ? (
        <Glass
          radius={22}
          interactive
          style={[styles.finish, { top: insets.top + 6 }]}
        >
          <Pressable
            onPress={finish}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityHint="Shows your survey before you send it"
            style={({ pressed }) => [
              styles.finishHit,
              pressed && surveyStyles.pressed,
            ]}
          >
            <Text style={styles.finishText}>Finish</Text>
          </Pressable>
        </Glass>
      ) : null}

      {toast ? (
        // Confirmation: frosted dark, with the pin's glyph so you see what was saved
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={[styles.float, { top: insets.top + 60 }]}
          accessibilityLiveRegion="polite"
        >
          <Frost tint="dark" style={styles.toast}>
            {toast.icon ? (
              <View style={styles.toastGlyph}>
                <Icon
                  name={toast.icon}
                  size={15}
                  color={colors.navy}
                  strokeWidth={2.2}
                />
              </View>
            ) : null}
            <Text style={styles.toastText}>{toast.text}</Text>
            {toast.action ? (
              <Pressable
                onPress={() => {
                  setToast(null);
                  toast.action!.onPress();
                }}
                hitSlop={12}
                accessibilityRole="button"
              >
                <Text style={styles.toastAction}>{toast.action.label}</Text>
              </Pressable>
            ) : null}
          </Frost>
        </Animated.View>
      ) : nearSpot ? (
        // At a spot the last survey flagged: one tap pins it with the kind already picked
        <Animated.View
          key={nearSpot.key}
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(160)}
          style={[styles.float, { top: insets.top + 60 }]}
          accessibilityLiveRegion="polite"
        >
          <Frost style={styles.coach}>
            <SpotGlyph
              icon={nearSpot.kind ? pinIcon(nearSpot.kind) : nearSpot.icon}
              size={30}
            />
            <View style={styles.flex}>
              <Text style={styles.coachTitle} numberOfLines={1}>
                {nearSpot.title}
              </Text>
              <Text style={styles.coachText}>Here last survey</Text>
            </View>
            {nearSpot.kind ? (
              <Pressable
                onPress={() => dropPin(nearSpot.kind)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Pin ${nearSpot.title} here`}
                style={({ pressed }) => [
                  styles.pinIt,
                  pressed && surveyStyles.pressed,
                ]}
              >
                <Text style={styles.pinItText}>Pin it</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setWaved(w => [...w, nearSpot.key])}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            >
              <XSmall width={16} height={16} color={colors.secondary} />
            </Pressable>
          </Frost>
        </Animated.View>
      ) : coach && !step ? (
        <Animated.View
          exiting={FadeOutUp.duration(160)}
          style={[styles.float, { top: insets.top + 60 }]}
        >
          <Frost style={styles.coach}>
            <Icon name="pin" size={20} color={colors.navy} strokeWidth={1.9} />
            <View style={styles.flex}>
              <Text style={styles.coachTitle}>
                Pin anything that affects access
              </Text>
              <Text style={styles.coachText}>Tap the mic to pin by voice</Text>
            </View>
            <Pressable
              onPress={() => setCoach(false)}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Dismiss tip"
            >
              <XSmall width={16} height={16} color={colors.secondary} />
            </Pressable>
          </Frost>
        </Animated.View>
      ) : ended && !running && !step ? (
        // Says why it paused; Finish is in the sheet right below
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(160)}
          style={[styles.float, { top: insets.top + 60 }]}
          accessibilityLiveRegion="polite"
        >
          <Frost style={styles.coach}>
            <Icon name="flag" size={20} color={colors.navy} strokeWidth={1.9} />
            <Text style={[styles.flex, styles.coachTitle]}>
              End of the trail
            </Text>
          </Frost>
        </Animated.View>
      ) : null}

      {/* Bottom sheet: resizes smoothly between collapsed, full and the pin steps */}
      <Animated.View
        layout={
          reduceMotion
            ? undefined
            : LinearTransition.springify(spring.glide.duration).dampingRatio(
                spring.glide.dampingRatio,
              )
        }
        style={[
          styles.sheet,
          {
            bottom: keyboard,
            paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 16),
          },
        ]}
        onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
      >
        {step ? (
          <View style={styles.handle}>
            <View style={styles.grabber} />
          </View>
        ) : (
          <View
            {...handlePan.panHandlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? 'Hide survey details' : 'Show survey details'
            }
            accessibilityState={{ expanded }}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={() => setExpanded(e => !e)}
            style={styles.handle}
          >
            <View style={styles.grabber} />
          </View>
        )}
        <Animated.View
          key={step ?? 'home'}
          entering={FadeIn.duration(180)}
          style={styles.sheetBody}
        >
          {draft && step === 'kind' ? (
            <KindStep
              pin={draft}
              onPick={kind => {
                // A different kind means a different measurement
                patch(
                  kind === draft.kind
                    ? {}
                    : { kind, value: undefined, choice: undefined },
                );
                setStep('measure');
              }}
              onClose={cancelEdit}
            />
          ) : draft && step === 'measure' ? (
            <MeasureStep
              pin={draft}
              lastTime={lastTime}
              onChange={patch}
              onBack={() => setStep('kind')}
              onNext={() => setStep('evidence')}
            />
          ) : draft && step === 'evidence' ? (
            <EvidenceStep
              pin={draft}
              onChange={patch}
              onBack={() => setStep('measure')}
              onSave={save}
            />
          ) : draft && step === 'view' ? (
            <PinView
              pin={draft}
              onEdit={() => setStep(draft.kind ? 'measure' : 'kind')}
              onDelete={() => remove(draft)}
              onClose={closeSheet}
            />
          ) : (
            <>
              {expanded ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(120)}
                  style={styles.sheetBody}
                >
                  {/* Where you are on it says the progress; the pin count is the pin list itself */}
                  <View style={styles.sheetHead}>
                    <Text style={styles.trailName} numberOfLines={1}>
                      {trail.name}
                    </Text>
                    <Text style={styles.sheetMeta}>
                      {miles.toFixed(1)} of {trail.miles} mi
                    </Text>
                  </View>
                  {recheck.some(r => !r.done) || pins.length ? (
                    <ScrollView
                      style={[
                        styles.detailsScroll,
                        { maxHeight: Math.max(150, screenH * 0.4) },
                      ]}
                      contentContainerStyle={styles.details}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Gone once everything's re-checked. A covered row's icon turns into the check and it
                        shows what you found against last time, then sinks below the ones still to do */}
                      {recheck.some(r => !r.done) ? (
                        <Animated.View exiting={FadeOut.duration(160)}>
                          <Text style={[type.caption, styles.caption]}>
                            Re-check first
                          </Text>
                          {[
                            ...recheck.filter(r => !r.done),
                            ...recheck.filter(r => r.done),
                          ].map((r, i) => {
                            const done = r.done;
                            const spot = done
                              ? undefined
                              : openSpots.find(s => s.key === r.key);
                            const on = !!spot && spot.key === selectedSpot?.key;
                            return (
                              <Animated.View
                                key={r.key}
                                layout={
                                  reduceMotion
                                    ? undefined
                                    : LinearTransition.springify(
                                        spring.glide.duration,
                                      ).dampingRatio(spring.glide.dampingRatio)
                                }
                              >
                                {/* Tapping shows where it is: the row's grey glyph is its spot on the map */}
                                <Pressable
                                  disabled={!spot}
                                  onPress={() => spot && toggleSpot(spot.key)}
                                  accessibilityRole={
                                    spot ? 'button' : undefined
                                  }
                                  accessibilityLabel={
                                    done
                                      ? `${r.label}, checked: ${r.now}, was ${recheckWas(r)}`
                                      : `${r.label}, was ${r.was}${spot ? `, mile ${spot.mile}` : ''}`
                                  }
                                  accessibilityHint={
                                    spot
                                      ? on
                                        ? 'Back to following you'
                                        : 'Shows it on the map'
                                      : undefined
                                  }
                                  accessibilityState={
                                    spot ? { selected: on } : undefined
                                  }
                                  style={({ pressed }) => [
                                    styles.row,
                                    i > 0 && !on && styles.rowDivider,
                                    (on || pressed) && styles.rowOn,
                                  ]}
                                >
                                  <View style={styles.rowGlyph}>
                                    {done ? (
                                      <Animated.View
                                        key="done"
                                        entering={ZoomIn.springify(
                                          spring.pop.duration,
                                        ).dampingRatio(spring.pop.dampingRatio)}
                                      >
                                        <Checked />
                                      </Animated.View>
                                    ) : spot ? (
                                      <SpotGlyph
                                        icon={
                                          spot.kind
                                            ? pinIcon(spot.kind)
                                            : spot.icon
                                        }
                                      />
                                    ) : (
                                      <Icon
                                        name={r.icon}
                                        size={18}
                                        color={colors.secondary}
                                        strokeWidth={1.7}
                                      />
                                    )}
                                  </View>
                                  <Text
                                    style={[
                                      styles.rowLabel,
                                      done && styles.rowDone,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {r.label}
                                  </Text>
                                  {done ? (
                                    <Text
                                      style={styles.rowFound}
                                      numberOfLines={1}
                                      ellipsizeMode="head"
                                    >
                                      <Text style={styles.rowWas}>
                                        {recheckWas(r)} →{' '}
                                      </Text>
                                      {r.now}
                                    </Text>
                                  ) : (
                                    <Text
                                      style={styles.rowWas}
                                      numberOfLines={1}
                                    >
                                      was {recheckWas(r)}
                                    </Text>
                                  )}
                                </Pressable>
                              </Animated.View>
                            );
                          })}
                        </Animated.View>
                      ) : null}

                      {/* The same pins as on the map, newest first; tapping one opens it there */}
                      {pins.length ? (
                        <View>
                          <Text style={[type.caption, styles.caption]}>
                            Pins
                          </Text>
                          {[...pins].reverse().map((p, i) => (
                            <PinRow
                              key={p.id}
                              pin={p}
                              divider={i > 0}
                              onPress={() => openPin(p.id)}
                            />
                          ))}
                        </View>
                      ) : null}
                    </ScrollView>
                  ) : null}
                </Animated.View>
              ) : null}

              {voicePin.recording ? (
                <View style={styles.recording} accessibilityLiveRegion="polite">
                  <RecDot size={10} />
                  <Text style={styles.recordingText}>
                    Recording voice pin · {formatElapsed(voicePin.ms)}
                  </Text>
                </View>
              ) : null}

              {/* Recording: capture. Paused: carry on or finish, the two things a pause is for */}
              {running ? (
                <Animated.View
                  key="capture"
                  entering={FadeIn.duration(180)}
                  style={styles.actions}
                >
                  <ActionButton
                    label="Drop pin"
                    onPress={() => dropPin()}
                    style={{ ...styles.flex, ...styles.dropPin }}
                  />
                  {/* Tap to start, tap the stop square to drop the voice pin */}
                  <TapToRecord
                    label="Record voice pin"
                    onNote={saveVoicePin}
                    onStateChange={setVoicePin}
                    style={({ pressed }) => [
                      styles.mic,
                      voicePin.recording && styles.micRec,
                      pressed && surveyStyles.pressed,
                    ]}
                  >
                    {({ recording }) =>
                      recording ? (
                        <StopSquare size={18} />
                      ) : (
                        <Icon
                          name="mic"
                          size={22}
                          color={colors.ink}
                          strokeWidth={1.8}
                        />
                      )
                    }
                  </TapToRecord>
                </Animated.View>
              ) : (
                <Animated.View
                  key="paused"
                  entering={FadeIn.duration(180)}
                  style={styles.actions}
                >
                  <ActionButton
                    label="Resume"
                    variant="soft"
                    onPress={resume}
                    style={{
                      ...styles.flex,
                      ...styles.dropPin,
                      ...styles.resume,
                    }}
                  />
                  <ActionButton
                    label="Finish"
                    onPress={finish}
                    accessibilityHint="Shows your survey before you send it"
                    style={{ ...styles.flex, ...styles.dropPin }}
                  />
                </Animated.View>
              )}
            </>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Last survey's spot as it looks on the map, small: grey disc, white glyph. */
function SpotGlyph({ icon, size = 26 }: { icon: IconName; size?: number }) {
  return (
    <View
      style={[
        styles.spotGlyph,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Icon
        name={icon}
        size={Math.round(size * 0.58)}
        color={colors.white}
        strokeWidth={2.2}
        optical
      />
    </View>
  );
}
