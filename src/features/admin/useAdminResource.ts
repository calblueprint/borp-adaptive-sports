import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useAdminResource<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(value => value + 1), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setState({ data: null, loading: true, error: null });
      void load().then(
        data => {
          if (active) setState({ data, loading: false, error: null });
        },
        cause => {
          if (active)
            setState({
              data: null,
              loading: false,
              error:
                cause instanceof Error ? cause.message : 'Please try again.',
            });
        },
      );
      return () => {
        active = false;
      };
    }, [load, version]),
  );

  return { ...state, reload };
}
