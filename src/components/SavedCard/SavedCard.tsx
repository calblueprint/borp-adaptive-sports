// A saved trail as an Airbnb wishlist card: square photo with the bare heart to unsave, name, how far.
// Swiped through on the profile, two across on the Saved page. Unsaving it lets the rest slide over.
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { router } from 'expo-router';
import { PhotoHeart, useSave } from '@/components/SaveHeart/SaveHeart';
import { TrailSnapshot } from '@/components/TrailImage/TrailImage';
import { TRAIL_PHOTOS } from '@/data/trail-photos';
import { useLocation } from '@/features/trails/LocationProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { spring } from '@/styles/theme';
import styles from './styles';

export function SavedCard({
  trailId,
  width,
}: {
  trailId: string;
  width: number;
}) {
  const trail = useTrails().getTrail(trailId);
  const { distanceTo } = useLocation();
  const save = useSave(trailId, trail?.name ?? 'trail');
  if (!trail) return null;
  const photo = TRAIL_PHOTOS[trail.id]?.image;
  const d = distanceTo(trail);
  const away = d.short === 'Here' ? 'Here' : `${d.short} away`;
  return (
    <Animated.View
      layout={LinearTransition.springify(spring.glide.duration).dampingRatio(
        spring.glide.dampingRatio,
      )}
      exiting={FadeOut.duration(180)}
      style={{ width }}
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/prototype/trail/[id]',
            params: { id: trail.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${trail.name}, ${trail.park}, ${trail.miles} mile trail, ${away}`}
        accessibilityActions={[{ name: 'unsave', label: save.label }]}
        onAccessibilityAction={save.toggle}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.photo, { width, height: width }]}>
          {photo ? (
            <Image
              source={photo}
              style={styles.fill}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <TrailSnapshot trail={trail} variant="thumb" />
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {trail.name}
        </Text>
        {/* The park is often too long for a card; the trail page has it */}
        <Text style={styles.meta} numberOfLines={1}>
          {trail.miles} mi trail · {away}
        </Text>
      </Pressable>
      <PhotoHeart save={save} accessible={false} style={styles.heart} />
    </Animated.View>
  );
}
