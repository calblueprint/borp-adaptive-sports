import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

interface Trail {
  id: number;
  tags?: {
    name?: string;
    surface?: string;
    bicycle?: string;
  };
  center?: {
    lat: number;
    lon: number;
  };
}

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrails() {
      try {
        const query = `
            [out:json];
            relation(451971);
            out center tags;
          `;
        const response = await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            body: query,
          },
        );
        if (!response.ok) {
          throw new Error('Failed to fetch trail data from Overpass API');
        }
        const data = await response.json();
        setTrails(data.elements || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchTrails();
  }, []);

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading direct trail ID...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <Text>Trail Information Database</Text>
      <Text>Querying exact OSM ID: 451971</Text>

      {trails.length === 0 ? (
        <Text>No trail found for that ID.</Text>
      ) : (
        trails.map(trail => (
          <View key={trail.id}>
            <Text>Name: {trail.tags?.name || 'Unnamed Trail'}</Text>
            <Text>Latitude: {trail.center?.lat ?? 'N/A'}</Text>
            <Text>Longitude: {trail.center?.lon ?? 'N/A'}</Text>
            <Text>OSM ID: {trail.id}</Text>
            {trail.tags?.surface && <Text>Surface: {trail.tags.surface}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}
