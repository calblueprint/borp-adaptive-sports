// Saved — not in Figma yet. Every trail you've saved, two across like an Airbnb wishlist, newest first.
// The profile swipes through the same cards; this is the whole set. Unsave with the heart and the rest
// slide over. Nothing left → the one useful action.
import { useWindowDimensions, View } from 'react-native';
import { EmptyState } from '@/components/List/List';
import { SavedCard } from '@/components/SavedCard/SavedCard';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import { useAccount } from '@/features/account/AccountProvider';
import { GUTTER } from '@/styles/theme';
import styles, { GAP } from './styles';

export default function SavedScreen() {
  const { saved } = useAccount();
  const { width } = useWindowDimensions();
  const card = Math.floor((width - GUTTER * 2 - GAP) / 2);
  return (
    <SubScreen title="Saved">
      {saved.length ? (
        <View style={styles.grid}>
          {saved.map(id => (
            <SavedCard key={id} trailId={id} width={card} />
          ))}
        </View>
      ) : (
        <EmptyState title="No saved trails" />
      )}
    </SubScreen>
  );
}
