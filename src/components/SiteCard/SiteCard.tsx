import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import fillerImage from '~/assets/bp-icon.png';
import styles from './styles';

export type Site = { id: string; name: string; lat: number; lng: number };

export default function SiteCard({ site }: { site: Site }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function startSurvey() {
    setOpen(false);
    router.push({ pathname: '/survey', params: { siteId: site.id } });
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={styles.card}
      >
        <Image source={fillerImage} style={styles.image} />
        <Text style={styles.name}>{site.name}</Text>
        <Text style={styles.meta}>
          lat: {site.lat} · lng: {site.lng}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <View style={styles.sheet}>
            <Image source={fillerImage} style={styles.sheetImage} />
            <Text style={styles.sheetName}>{site.name}</Text>
            <Button text="Start survey" onPress={startSurvey} />
            <Pressable style={styles.close} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
