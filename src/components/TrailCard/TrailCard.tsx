// A trail in the list, like an Airbnb card: swipeable photos with the route map in its corner, a save heart, and a
// white pill ("Resurvey due", like Airbnb's "Guest favourite") when the trail needs a survey; up-to-date
// trails have none, so the ones that need you stand out. Then three short lines: name, where it is and how far
// away ("14 mi away", so it can't be mistaken for the length), and the trip (length, about how long at your
// pace, surface: known even before a survey). What a surveyor picks a trail by; the access numbers and the
// last survey's month wait on the trail page.
import type { Trail } from '@/data/trails';
import { Pressable, Text, View } from 'react-native';
import { usePhotoPager } from '@/components/PhotoPager/PhotoPager';
import { PhotoHeart, useSave } from '@/components/SaveHeart/SaveHeart';
import { TrailMedia, useMediaSwap } from '@/components/TrailMedia/TrailMedia';
import { needsSurvey } from '@/components/TrailStatus/TrailStatus';
import { trailPhotos } from '@/data/trail-photos';
import { STATUS_LABEL } from '@/data/trails';
import { useAccount } from '@/features/account/AccountProvider';
import { type Distance } from '@/features/trails/LocationProvider';
import { trailTime } from '@/lib/access';
import styles from './styles';

type Props = {
  trail: Trail;
  distance: Distance;
  onPress: () => void;
};

export function TrailCard({ trail, distance, onPress }: Props) {
  const swap = useMediaSwap();
  const photos = trailPhotos(trail.id);
  const hasPhoto = photos.length > 0;
  const pager = usePhotoPager(photos.length);
  // VoiceOver can't swipe the photos inside the card, so they're actions too, like saving and the swap
  const photoActions =
    photos.length > 1 && !swap.showMap
      ? [
          ...(pager.index < photos.length - 1
            ? [{ name: 'next', label: 'Next photo' }]
            : []),
          ...(pager.index > 0
            ? [{ name: 'previous', label: 'Previous photo' }]
            : []),
        ]
      : [];
  const save = useSave(trail.id, trail.name);
  const { mobility } = useAccount();
  const status = trail.isNew
    ? `New · ${STATUS_LABEL[trail.status]}`
    : STATUS_LABEL[trail.status];
  const tag = needsSurvey(trail.status) ? status : undefined;
  const time = trailTime(trail, mobility);
  const away = distance.short === 'Here' ? 'Here' : `${distance.short} away`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${save.on ? 'Saved. ' : ''}${trail.name}, ${trail.park}, ${distance.long}. ${trail.miles} mile trail, about ${time}, ${trail.surface}. ${status}${trail.last ? `, surveyed ${trail.last}` : ''}`}
      // VoiceOver can't reach a button inside a button, so saving and the swap are actions on the card
      accessibilityActions={[
        { name: 'save', label: save.on ? 'Remove from saved' : 'Save' },
        ...(hasPhoto ? [{ name: 'swap', label: swap.label }] : []),
        ...photoActions,
      ]}
      onAccessibilityAction={e => {
        const action = e.nativeEvent.actionName;
        if (action === 'save') save.toggle();
        else if (action === 'swap') swap.toggle();
        else if (action === 'next') pager.go(pager.index + 1);
        else if (action === 'previous') pager.go(pager.index - 1);
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <TrailMedia
          trail={trail}
          swap={swap}
          pager={pager}
          onPress={onPress}
          style={styles.media}
          insetAccessible={false}
          tag={tag}
        />
        <PhotoHeart save={save} accessible={false} style={styles.heart} />
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {trail.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {trail.park} · {away}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {trail.miles} mi · {time} · {trail.surface}
        </Text>
      </View>
    </Pressable>
  );
}
