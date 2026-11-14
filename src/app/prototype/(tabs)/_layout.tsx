// Home and Profile as tabs. Both screens stay mounted, so switching is instant (no fade) and each keeps
// its scroll position. They share one dock that never reloads: its selection slides while the screen swaps.

import type { ComponentRef, RefObject } from 'react';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { router } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { Glass } from '@/components/Glass/Glass';
import { TAB_BAR_HEIGHT, TabBar } from '@/components/TabBar/TabBar';
import Plus from '@/icons/add.svg';
import { comingSoon } from '@/lib/comingSoon';
import { colors } from '@/styles/theme';

export default function TabsLayout() {
  const contentRef = useRef<ComponentRef<typeof View>>(null); // what the glass dock frosts on Android

  return (
    <Tabs style={styles.flex}>
      <BlurTargetView ref={contentRef} style={styles.flex}>
        <TabSlot style={styles.slot} />
      </BlurTargetView>
      {/* Declares the tabs; the dock is what you see and tap */}
      <TabList style={styles.hidden}>
        <TabTrigger name="trails" href="/prototype/trails" />
      </TabList>
      <Dock blurTarget={contentRef} />
    </Tabs>
  );
}

function Dock({
  blurTarget,
}: {
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
}) {
  // The profile tab comes with the account screens; until then Profile says so
  const current = 'home';

  return (
    <TabBar
      current={current}
      onSelect={() => comingSoon('Your profile')}
      blurTarget={blurTarget}
      accessory={
        current === 'home' ? (
          <Glass
            radius={TAB_BAR_HEIGHT / 2}
            tint={colors.navy}
            interactive
            style={styles.add}
          >
            <Pressable
              onPress={() => router.push('/prototype/add-trail')}
              accessibilityRole="button"
              accessibilityLabel="Add a new trail"
              style={styles.addHit}
            >
              <Plus width={22} height={22} color={colors.white} />
            </Pressable>
          </Glass>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // The slot grows to fit its screen by default, which leaves a list nothing to scroll in
  slot: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  hidden: { display: 'none' },
  add: { width: TAB_BAR_HEIGHT, height: TAB_BAR_HEIGHT },
  addHit: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
