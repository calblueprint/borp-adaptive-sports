import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import colors from '@/styles/colors';
import { fetchAdminSites } from '~/api/supabase/queries/admin';
import { LoadState } from './components';
import { matchesSite } from './format';
import styles from './styles';
import { useAdminResource } from './useAdminResource';

export default function AdminSitesScreen() {
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useAdminResource(fetchAdminSites);
  const sites = data?.filter(site => matchesSite(site.name, query)) ?? [];

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      data={sites}
      keyExtractor={site => site.id}
      ListHeaderComponent={
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.title}>
            Admin dashboard
          </Text>
          <Text style={styles.text}>Find a site to view its surveys.</Text>
          <TextInput
            style={styles.search}
            accessibilityLabel="Search sites by name"
            placeholder="Search sites by name"
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <LoadState loading={loading} error={error} reload={reload} />
          {data && (
            <Text style={styles.muted}>
              {sites.length} {sites.length === 1 ? 'site' : 'sites'} found
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <Text style={styles.text}>
            {data?.length ? 'No sites match your search.' : 'No sites yet.'}
          </Text>
        ) : undefined
      }
      renderItem={({ item: site }) => (
        <Link
          href={{
            pathname: '/admin/sites/[siteId]',
            params: { siteId: site.id },
          }}
          asChild
        >
          <Pressable accessibilityRole="link" style={styles.card}>
            <Text style={styles.heading}>{site.name}</Text>
            <Text style={styles.muted}>
              {site.lat}, {site.lng}
            </Text>
            <Text style={styles.link}>View surveys</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
