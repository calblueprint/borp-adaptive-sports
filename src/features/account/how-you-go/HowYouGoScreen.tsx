// How you go on trails — not in Figma yet. Everything the person has added (an everyday chair, a power
// chair for longer trails, a walker…) and which one they're using today, like picking a Wi-Fi network:
// tap a row to use it (navy check), the pencil to change or remove it. Each row leads with its kind's icon,
// since a name of their own ("Trail chair", "Old faithful") may not say what it is. Trail pages compare with the one in
// use. Picking applies at once, so there's no Save.
import type { MyAid } from '@/features/account/AccountProvider';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AID_ICON, Icon } from '@/components/Icon/Icon';
import { ListRow } from '@/components/List/List';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import {
  aidName,
  limitsLine,
  useAccount,
} from '@/features/account/AccountProvider';
import { colors, type } from '@/styles/theme';
import styles from './styles';

const edit = (id: string) =>
  router.push({
    pathname: '/prototype/account/how-you-go/[id]',
    params: { id },
  });

export default function HowYouGoScreen() {
  const { aids, mobility, pickAid } = useAccount();
  const pick = (a: MyAid) => {
    if (a.id === mobility?.id) return;
    Haptics.selectionAsync();
    pickAid(a.id);
  };
  return (
    <SubScreen title="How you go on trails">
      <View>
        {aids.map((a, i) => (
          <AidRow
            key={a.id}
            aid={a}
            on={a.id === mobility?.id}
            divider={i > 0}
            onPress={() => pick(a)}
          />
        ))}
        <ListRow
          onPress={() => edit('new')}
          accessibilityRole="button"
          divider={aids.length > 0 && 'full'}
          style={styles.row}
        >
          <View style={styles.mark} />
          <View style={styles.kind}>
            <Icon name="plus" size={22} color={colors.navy} strokeWidth={2} />
          </View>
          <Text style={styles.add}>
            {aids.length ? 'Add another' : 'Add how you go'}
          </Text>
        </ListRow>
      </View>
    </SubScreen>
  );
}

function AidRow({
  aid,
  on,
  divider,
  onPress,
}: {
  aid: MyAid;
  on: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const name = aidName(aid);
  return (
    <ListRow
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${name}, ${limitsLine(aid)}`}
      accessibilityActions={[{ name: 'edit', label: 'Edit' }]}
      onAccessibilityAction={() => edit(aid.id)}
      divider={divider && 'full'}
      style={styles.row}
    >
      <View style={styles.mark}>
        {on ? (
          <Icon name="check" size={20} color={colors.navy} strokeWidth={2.4} />
        ) : null}
      </View>
      <View style={styles.kind}>
        <Icon
          name={AID_ICON[aid.aid]}
          size={26}
          color={colors.ink}
          strokeWidth={1.6}
        />
      </View>
      <View style={styles.text}>
        <Text style={type.rowTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[type.rowDetail, styles.detail]} numberOfLines={1}>
          {limitsLine(aid)}
        </Text>
      </View>
      <Pressable
        onPress={() => edit(aid.id)}
        hitSlop={8}
        importantForAccessibility="no"
        accessibilityElementsHidden
        style={({ pressed }) => [styles.edit, pressed && styles.editPressed]}
      >
        <Icon name="edit" size={20} color={colors.navy} strokeWidth={1.8} />
      </Pressable>
    </ListRow>
  );
}
