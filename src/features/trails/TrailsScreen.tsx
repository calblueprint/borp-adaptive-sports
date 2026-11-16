import type { Site } from '@/lib/sites';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from '@/components/Header/Header';
import { useSignOut } from '@/features/auth/useSignOut';
import { searchSites } from '@/lib/sites';
import colors from '@/styles/colors';
import { fetchSites } from '~/api/supabase/queries/sites';
import SiteCard from './SiteCard';
import SiteSheet from './SiteSheet';
import styles from './styles';

export default function TrailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, busy: signingOut, error: signOutError } = useSignOut();
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Site | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    // Skip state updates if the screen unmounts before the fetch resolves
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSites()
      .then(data => {
        if (!cancelled) {
          // A slow initial fetch must not overwrite a newly created trail.
          const fetchedIds = new Set(data.map(site => site.id));
          setSites(current => [
            ...current.filter(site => !fetchedIds.has(site.id)),
            ...data,
          ]);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            'Could not load trails. Check your connection and try again.',
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reload]);

  function created(site: Site) {
    setSites(current => [site, ...current.filter(item => item.id !== site.id)]);
    setQuery('');
    setAdding(false);
    setSelected(site);
  }

  function closeSheet() {
    setAdding(false);
    setSelected(null);
  }

  const results = searchSites(sites, query);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header onBack={router.canGoBack() ? () => router.back() : undefined} />
      <ScrollView
        style={styles.page}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.accountRow}>
          <Text style={styles.searchHeading}>Find a trail</Text>
          <Pressable
            accessibilityRole="button"
            disabled={signingOut}
            accessibilityState={{ disabled: signingOut }}
            onPress={() => void signOut()}
            style={styles.accountButton}
          >
            <Text style={styles.closeText}>
              {signingOut ? 'Logging out…' : 'Log out'}
            </Text>
          </Pressable>
        </View>
        {signOutError && (
          <Text style={styles.error} accessibilityRole="alert">
            {signOutError}
          </Text>
        )}
        <TextInput
          accessibilityLabel="Search trails"
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search trails"
          placeholderTextColor={colors.gray}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator
            accessibilityLabel="Loading trails"
            color={colors.black}
          />
        )}
        {error && (
          <View style={styles.loadError}>
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setReload(value => value + 1)}
              style={styles.accountButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}
        {!loading && !error && results.length === 0 && (
          <Text style={styles.meta}>
            {query.trim()
              ? 'No trails match your search. Try another name or add a trail.'
              : 'No trails yet. Add the first trail using the + button.'}
          </Text>
        )}
        {results.map(site => (
          <SiteCard
            key={site.id}
            site={site}
            onPress={() => setSelected(site)}
          />
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a trail"
        onPress={() => {
          Keyboard.dismiss();
          setAdding(true);
        }}
        style={({ pressed }) => [
          styles.addButton,
          { bottom: insets.bottom + 20 },
          pressed && styles.addButtonPressed,
        ]}
      >
        <Text style={styles.addIcon}>+</Text>
      </Pressable>

      <SiteSheet
        site={selected}
        adding={adding}
        onCreated={created}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}
