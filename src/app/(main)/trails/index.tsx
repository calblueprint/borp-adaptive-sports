import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';
import supabase from '~/api/supabase/client';
import fillerImage from '~/assets/bp-icon.png';

type Site = { id: string; name: string; lat: number; lng: number };

const COORDS = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function search(sites: Site[], query: string): Site[] {
  const q = query.trim();
  if (!q) return sites;

  const match = q.match(COORDS);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return [...sites]
      .sort(
        (a, b) =>
          distanceKm(lat, lng, a.lat, a.lng) -
          distanceKm(lat, lng, b.lat, b.lng),
      )
      .slice(0, 3);
  }

  try {
    const re = new RegExp(q, 'i');
    return sites.filter(site => re.test(site.name));
  } catch {
    return [];
  }
}

export default function TrailsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadSites() {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, lat, lng');
      if (error) setError(error.message);
      else setSites(data ?? []);
    }
    loadSites();
  }, []);

  const results = search(sites, query);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search trails"
        placeholderTextColor={colors.gray}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && <Text style={styles.error}>Error: {error}</Text>}
      {results.map(site => (
        <View key={site.id} style={styles.card}>
          <Image source={fillerImage} style={styles.image} />
          <Text style={styles.name}>{site.name}</Text>
          <Text style={styles.meta}>
            lat: {site.lat} · lng: {site.lng}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white },
  content: { padding: 16, gap: 16 },
  search: {
    ...typography.p1,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  error: { ...typography.p2, color: colors.red },
  card: { gap: 6 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  name: { ...typography.p1, fontWeight: '600', color: colors.black },
  meta: { ...typography.p2, color: colors.gray },
});
