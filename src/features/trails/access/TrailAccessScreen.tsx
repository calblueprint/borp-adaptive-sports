// Grade and surface — one tap from the trail page. The detail behind the three readings: where it gets
// steep (chart, drag to read), what the path is made of and what's in the way.
// No guideline table: the chart draws the 5% line, and every reading outside a guideline already says by how
// much ("2.5 in high, over 2 in").
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GradeChart } from '@/components/GradeChart/GradeChart';
import { Icon } from '@/components/Icon/Icon';
import { divider } from '@/components/List/List';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import { useTrails } from '@/features/trails/TrailsProvider';
import { keyReadings } from '@/lib/access';
import { colors } from '@/styles/theme';
import styles from './styles';

export default function TrailAccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = useTrails().getTrail(id);
  const readings = trail && keyReadings(trail);
  if (!trail || !readings) return null;
  const path = (trail.conditions ?? []).filter(
    c => c.icon === 'surface' || c.icon === 'rock',
  );

  return (
    <SubScreen
      title="Grade and surface"
      subtitle={`${trail.name} · ${trail.last} survey`}
    >
      <GradeChart trail={trail} steepest={readings.grade.value} />

      <View>
        {path.map((c, i) => (
          <View
            key={c.label}
            style={[styles.row, i > 0 && divider]}
            accessible
            accessibilityLabel={`${c.label}: ${c.value}${c.note ? `, ${c.note}` : ''}`}
          >
            <Icon
              name={c.icon}
              size={24}
              color={colors.ink}
              strokeWidth={1.5}
            />
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{c.value}</Text>
              {c.note ? (
                <Text
                  style={[
                    styles.rowDetail,
                    c.mark === 'warn' && styles.outside,
                  ]}
                >
                  {c.note}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </SubScreen>
  );
}
