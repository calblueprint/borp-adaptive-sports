import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import supabase from '~/api/supabase/client';

export default function Home() {
  const [message, setMessage] = useState('Testing Supabase...');

  useEffect(() => {
    supabase
      .from('sites')
      .select('name')
      .then(({ data, error }) => {
        if (error) setMessage(`Error: ${error.message}`);
        else setMessage(`Found ${data.length} sites: ${data.map((s) => s.name).join(', ')}`);
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text>{message}</Text>
    </View>
  );
}