import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import supabase from '~/api/supabase/client';

export default function App() {
  const [status, setStatus] = useState('Checking Supabase...');

  useEffect(() => {
    (async () => {
      const { error } = await supabase.from('connection_test').select('*').limit(1);
      if (!error) setStatus('✅ Connected to Supabase');
      else if (error.code === 'PGRST205' || error.code === '42P01')
        setStatus('✅ Connected (test table not found, which is expected)');
      else setStatus(`❌ ${error.message}`);
      console.log('Supabase check:', error ?? 'ok');
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});