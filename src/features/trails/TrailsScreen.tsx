import type { Site } from '@/lib/sites';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { searchSites } from '@/lib/sites';
import colors from '@/styles/colors';
import { fetchSites } from '~/api/supabase/queries/sites';
import SiteCard from './SiteCard';
import SiteSheet from './SiteSheet';
import styles from './styles';

export default function TrailsScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Site | null>(null);

  useEffect(() => {
    // Skip state updates if the screen unmounts before the fetch resolves
    let cancelled = false;

    fetchSites()
      .then(data => {
        if (!cancelled) setSites(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const results = searchSites(sites, query);

  return (
    <>
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
          <SiteCard
            key={site.id}
            site={site}
            onPress={() => setSelected(site)}
          />
        ))}
      </ScrollView>

      <SiteSheet site={selected} onClose={() => setSelected(null)} />
    </>
  );
}
