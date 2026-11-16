import type { Site } from '@/lib/sites';
import { Image, Pressable, Text } from 'react-native';
import fillerImage from '~/assets/bp-icon.png';
import styles from './styles';

type SiteCardProps = {
  site: Site;
  onPress: () => void;
};

export default function SiteCard({ site, onPress }: SiteCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Image source={fillerImage} style={styles.image} />
      <Text style={styles.name}>{site.name}</Text>
      <Text style={styles.meta}>
        lat: {site.lat} · lng: {site.lng}
      </Text>
    </Pressable>
  );
}
