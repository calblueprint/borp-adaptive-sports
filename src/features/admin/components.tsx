import type { Tables } from '~/api/supabase/database.types';
import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Text, View } from 'react-native';
import Button from '@/components/Button/Button';
import { signAdminFile } from '~/api/supabase/queries/admin';
import { formatDate, formatValue } from './format';
import styles from './styles';

export function LoadState({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  if (loading)
    return <ActivityIndicator accessibilityLabel="Loading records" />;
  if (!error) return null;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="alert" style={styles.error}>
        Unable to load records: {error}
      </Text>
      <Button text="Try again" onPress={reload} />
    </View>
  );
}

export function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.text}>
        {formatValue(value)}
      </Text>
    </View>
  );
}

export function RecordFields({
  record,
  labels = {},
}: {
  record: object;
  labels?: Record<string, string>;
}) {
  return Object.entries(record).map(([key, value]) => (
    <Field
      key={key}
      label={
        labels[key] ??
        key.replaceAll('_', ' ').replace(/^./, first => first.toUpperCase())
      }
      value={key.endsWith('_at') ? formatDate(value) : value}
    />
  ));
}

export function PhotoCard({ photo }: { photo: Tables<'photos'> }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      setUrl(await signAdminFile('photos', photo.storage_path));
    } catch {
      setError(
        'Unable to load this photo. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.card}>
      <RecordFields record={photo} />
      {url && (
        <Image
          source={{ uri: url }}
          accessibilityLabel="Survey photo"
          resizeMode="contain"
          style={styles.photo}
          onError={() => {
            setUrl(null);
            setError(
              'This photo could not be displayed. Try loading it again.',
            );
          }}
        />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {photo.uploaded ? (
        <Button
          text={busy ? 'Loading photo…' : 'Load photo'}
          disabled={busy}
          onPress={() => void open()}
        />
      ) : (
        <Text style={styles.muted}>This photo has not been uploaded yet.</Text>
      )}
    </View>
  );
}

export function TrackButton({ path }: { path: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const open = async () => {
    setBusy(true);
    setError(false);
    try {
      await Linking.openURL(await signAdminFile('trail-tracks', path));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.section}>
      <Button
        text={busy ? 'Opening track…' : 'Open track file'}
        disabled={busy}
        onPress={() => void open()}
      />
      {error && (
        <Text style={styles.error}>
          Unable to open this track. Check your connection and try again.
        </Text>
      )}
    </View>
  );
}
