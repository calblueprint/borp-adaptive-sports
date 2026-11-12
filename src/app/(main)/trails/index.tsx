import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import supabase from '~/api/supabase/client';

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
    <ScrollView>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or lat, lng"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && <Text>Error: {error}</Text>}
      <Text>{results.length} sites</Text>
      {results.map(site => (
        <View key={site.id} style={{ borderWidth: 1, padding: 8, margin: 8 }}>
          <Text>name: {site.name}</Text>
          <Text>lat: {site.lat}</Text>
          <Text>lng: {site.lng}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
