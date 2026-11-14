import type { Trail } from '@/data/trails';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { TRAILS } from '@/data/trails';

// Prototype-only trail list: the placeholder trails plus any added in this session (kept in memory,
// lost on reload). In the real app this is the trail database.
export type NewTrail = {
  name: string;
  park: string;
  city: string;
  county: string;
  surface: string;
  miles?: number;
  notes?: string;
  /** Where the surveyor pinned the trailhead. */
  lat: number;
  lng: number;
};

type TrailsState = {
  trails: Trail[];
  getTrail: (id: string) => Trail | undefined;
  /** Adds a trail at the surveyor's current location and returns it. */
  addTrail: (input: NewTrail) => Trail;
};

const TrailsContext = createContext<TrailsState | null>(null);

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function TrailsProvider({ children }: { children: ReactNode }) {
  const [added, setAdded] = useState<Trail[]>([]);

  const addTrail = useCallback((input: NewTrail) => {
    const trail: Trail = {
      id: `${slug(input.name)}-${Date.now().toString(36)}`,
      name: input.name.trim(),
      park: input.park.trim() || input.name.trim(),
      city: input.city.trim(),
      county: input.county.trim(),
      miles: input.miles ?? 0,
      gainFt: 0, // unknown until surveyed
      lat: input.lat,
      lng: input.lng,
      surface: input.surface,
      status: 'never',
      seed: Math.floor(Math.random() * 50),
      elevFt: 0,
      addedNotes: input.notes?.trim() || undefined,
      isNew: true,
    };
    setAdded(list => [trail, ...list]);
    return trail;
  }, []);

  const value = useMemo(() => {
    const trails = [...added, ...TRAILS];
    return {
      trails,
      getTrail: (id: string) => trails.find(t => t.id === id),
      addTrail,
    };
  }, [added, addTrail]);

  return (
    <TrailsContext.Provider value={value}>{children}</TrailsContext.Provider>
  );
}

export function useTrails() {
  const ctx = useContext(TrailsContext);
  if (!ctx) throw new Error('useTrails must be used inside <TrailsProvider>');
  return ctx;
}
