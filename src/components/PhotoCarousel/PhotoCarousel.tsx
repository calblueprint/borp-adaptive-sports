// The top of the trail page: swipe through the trail's real photos, Airbnb-style, with dots for where you
// are and arrows that come out when you reach for them (see PhotoPager). Tap opens them full screen with
// each photographer's credit. Trails without photos show their Apple Maps route instead, so the top is
// never a placeholder.
import type { PhotoCredit } from '@/data/trail-photos';
import type { Trail } from '@/data/trails';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PhotoPager, usePhotoPager } from '@/components/PhotoPager/PhotoPager';
import { TrailSnapshot } from '@/components/TrailImage/TrailImage';
import { trailPhotos } from '@/data/trail-photos';
import Close from '@/icons/close.svg';
import { colors } from '@/styles/theme';
import styles from './styles';

/** `covered`: how much of the bottom the page's rounded sheet overlaps, so the dots sit above it. */
export function PhotoCarousel({
  trail,
  height,
  covered = 0,
}: {
  trail: Trail;
  height: number;
  covered?: number;
}) {
  const photos = trailPhotos(trail.id);
  const pager = usePhotoPager(photos.length, { flash: true });
  const insets = useSafeAreaInsets();
  const [viewer, setViewer] = useState<number | null>(null);

  if (!photos.length) {
    return (
      <View
        style={{ height }}
        accessible
        accessibilityLabel={`Route map of ${trail.name}`}
      >
        <TrailSnapshot trail={trail} variant="banner" />
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <PhotoPager
        photos={photos}
        pager={pager}
        covered={covered}
        coveredTop={insets.top}
        onPressPhoto={setViewer}
        photoLabel={i =>
          `Photo ${i + 1} of ${photos.length}` +
          (photos[i].credit.source ? `, by ${photos[i].credit.author}` : '')
        }
        accessibilityLabel={`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} of ${trail.name}`}
      />
      {viewer !== null ? (
        <PhotoViewer
          photos={photos}
          start={viewer}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </View>
  );
}

/** Full screen, black, swipe between photos; the credit for the one showing sits at the bottom. */
function PhotoViewer({
  photos,
  start,
  onClose,
}: {
  photos: { image: number | object; credit: PhotoCredit }[];
  start: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(start);
  const credit = photos[index].credit;
  return (
    <Modal
      visible
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait']}
    >
      <View style={styles.viewer}>
        <StatusBar style="light" />
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: start * width, y: 0 }}
          onMomentumScrollEnd={e =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          onScroll={e =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          scrollEventThrottle={64}
        >
          {photos.map((p, i) => (
            <Image
              key={i}
              source={p.image as number}
              style={{ width, height }}
              resizeMode="contain"
              accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
              accessibilityIgnoresInvertColors
            />
          ))}
        </ScrollView>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close photos"
          style={[styles.close, { top: insets.top + 8 }]}
        >
          <Close color={colors.white} />
        </Pressable>
        <View
          style={[styles.caption, { paddingBottom: insets.bottom + 16 }]}
          accessibilityLiveRegion="polite"
        >
          {photos.length > 1 ? (
            <Text style={styles.captionCount}>
              {index + 1} of {photos.length}
            </Text>
          ) : null}
          {credit.source ? (
            <Text style={styles.captionCredit}>
              {credit.author} · {credit.license} · Wikimedia Commons
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
