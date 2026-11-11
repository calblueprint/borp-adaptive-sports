import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { DEMO_ACCOUNTS } from '@/data/accounts';

// Prototype-only account and settings, kept in memory (lost on reload). Nothing is sent anywhere.

export type User = {
  name: string;
  email: string;
  phone?: string;
  /** A local photo URI picked from the library, or a bundled image for the demo account. */
  photo?: string | ImageSourcePropType;
  /** Month they joined, e.g. "Oct 2026". */
  since: string;
};

export type Settings = {
  units: 'in' | 'cm';
  /** Hold photos and voice notes until Wi-Fi; the survey itself still sends on mobile data. */
  wifiOnly: boolean;
  /** Save trails within 10 mi for offline use when on Wi-Fi. */
  autoOffline: boolean;
  notifyReview: boolean;
  notifyNearby: boolean;
  /** Published surveys say "Surveyed by Jesslyn R." instead of "Volunteer survey". */
  showName: boolean;
};

/** How someone gets along a trail. Decides which readings matter to them and where their limits start. */
export type Aid =
  | 'manual'
  | 'power'
  | 'scooter'
  | 'walker'
  | 'cane'
  | 'walking'
  | 'bike'
  | 'stroller'
  | 'other';

/**
 * How the person goes on trails and their own limits, so trail pages compare readings with *theirs*
 * instead of the general guideline. Whether a trail works depends on the person, so this is theirs to
 * set; unset = guideline. No width for a cane, crutches or walking: any trail path is wide enough.
 */
export type Mobility = {
  aid: Aid;
  /** How wide the chair (walker…) itself is, inches: something they can measure. Paths need ROOM_FOR_HANDS more. */
  width?: number;
  /** Steepest grade they're comfortable with, %. */
  grade: number;
  /** Most sideways tilt they're comfortable with, %. */
  cross: number;
};

export type Limit = 'grade' | 'cross';

/** Extra path width beyond the chair for hands on the wheels or walker. PROTOTYPE value, not from BORP. */
export const ROOM_FOR_HANDS = 4;

/**
 * Slopes as three plain choices, since nobody knows their comfortable grade in percent: words with the slope
 * drawn on screen. Place names ("building ramp", "driveway crossing") and doors for width ("doors are made to
 * let everyone through") confused people in review; width is now the chair's own, measured. Values:
 * 5% is where a walkway becomes a ramp, 8.3% (1:12) the steepest ramp the ADA allows, 2% the most a
 * sidewalk may tilt; 12%, 5% and 8% are approximate.
 */
export const LIMIT_CHOICES: Record<Limit, { label: string; value: number }[]> =
  {
    grade: [
      { label: 'Gentle', value: 5 },
      { label: 'Moderate', value: 8.3 },
      { label: 'Steep', value: 12 },
    ],
    cross: [
      { label: 'Slight', value: 2 },
      { label: 'Moderate', value: 5 },
      { label: 'Strong', value: 8 },
    ],
  };

/**
 * Typical answers for each way of going, pre-picked on the screen. PROTOTYPE values, not from BORP: typical
 * widths (manual and power chairs about 26 in, scooters and walkers about 24 in); a manual chair at the
 * steepest ramp the ADA allows; power chairs climb more but tip sideways sooner than they climb;
 * scooters tip easily; walkers are narrower than chairs; canes and crutches cope with more grade; walking
 * copes with most; bikes are about handlebar-wide and struggle up steep grades more than across tilts;
 * strollers are about 24 in across the wheels and push up most grades but tip sideways like a scooter;
 * "Other" (they name it) starts at the guideline, the safe end, with a chair-like width.
 * Ordered so each row of chips ends about the same distance from the edge (one long name + one short,
 * then the three short ones): Manual wheelchair · Walker / Power wheelchair · Scooter / Cane or crutches ·
 * Walking / Stroller · Bike · Other.
 * Always one of LIMIT_CHOICES, so a newcomer sees something chosen and can just save.
 */
export const AIDS: {
  key: Aid;
  label: string;
  /** "Within limits for your <noun>"; none for walking, which reads "for you". */
  noun?: string;
  /** How to measure its width, when it has one. */
  measure?: string;
  start: Mobility;
}[] = [
  {
    key: 'manual',
    label: 'Manual wheelchair',
    noun: 'wheelchair',
    start: { aid: 'manual', width: 26, grade: 8.3, cross: 2 },
  },
  {
    key: 'walker',
    label: 'Walker',
    noun: 'walker',
    start: { aid: 'walker', width: 24, grade: 8.3, cross: 2 },
  },
  {
    key: 'power',
    label: 'Power wheelchair',
    noun: 'power wheelchair',
    start: { aid: 'power', width: 26, grade: 12, cross: 5 },
  },
  {
    key: 'scooter',
    label: 'Scooter',
    noun: 'scooter',
    start: { aid: 'scooter', width: 24, grade: 8.3, cross: 2 },
  },
  {
    key: 'cane',
    label: 'Cane or crutches',
    noun: 'cane or crutches',
    start: { aid: 'cane', grade: 12, cross: 5 },
  },
  {
    key: 'walking',
    label: 'Walking',
    start: { aid: 'walking', grade: 12, cross: 8 },
  },
  {
    key: 'stroller',
    label: 'Stroller',
    noun: 'stroller',
    measure: 'Measure across the wheels, at the widest point.',
    start: { aid: 'stroller', width: 24, grade: 8.3, cross: 2 },
  },
  {
    key: 'bike',
    label: 'Bike',
    noun: 'bike',
    measure: 'Measure across the handlebars, end to end.',
    start: { aid: 'bike', width: 24, grade: 8.3, cross: 5 },
  },
  // No noun: it's always called by the name they type
  {
    key: 'other',
    label: 'Other',
    measure: 'Measure the widest point, side to side.',
    start: { aid: 'other', width: 26, grade: 8.3, cross: 2 },
  },
];

export const aidOf = (key: Aid) => AIDS.find(a => a.key === key)!;

/** One chair, walker… the person owns, with its own limits. Someone with an everyday chair and a power
 *  chair for longer trails keeps both and picks which one they're using. */
export type MyAid = Mobility & {
  id: string;
  /** Their own name for it ("Trail chair"); falls back to the kind. */
  name?: string;
};

export const aidName = (a: MyAid) => a.name?.trim() || aidOf(a.aid).label;

/** Who the trail page's limits are for: their own name for it, "your chair", or "you" when walking. */
export const aidFor = (a: MyAid) => {
  const noun = aidOf(a.aid).noun;
  return a.name?.trim() || (noun ? `your ${noun}` : 'you');
};

/** 8.3 stays 8.3; whole numbers drop the ".0". */
export const fmtLimit = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1);

/** "26 in wide · up to 8.3% · 2% tilt": one line that tells two chairs apart. */
export function limitsLine(m: Mobility) {
  const parts = [
    m.width !== undefined ? `${fmtLimit(m.width)} in wide` : '',
    `up to ${fmtLimit(m.grade)}%`,
    `${fmtLimit(m.cross)}% tilt`,
  ].filter(Boolean);
  const line = parts.join(' · ');
  return line[0].toUpperCase() + line.slice(1);
}

/** Where "How you go" opens: the list to pick from, or straight to adding the first one. */
export const howYouGoHref = (count: number) =>
  count
    ? ('/prototype/account/how-you-go' as const)
    : ({
        pathname: '/prototype/account/how-you-go/[id]',
        params: { id: 'new' },
      } as const);

const DEFAULT_SETTINGS: Settings = {
  units: 'in',
  wifiOnly: false,
  autoOffline: true,
  notifyReview: true,
  notifyNearby: false,
  showName: true,
};

const thisMonth = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

// Anyone who opens the profile without going through sign-in (e.g. a dev jumping straight to /prototype/trails)
const DEMO_USER: User = {
  name: DEMO_ACCOUNTS[0].name,
  email: DEMO_ACCOUNTS[0].email,
  phone: '+1 510 555 0142',
  photo: DEMO_ACCOUNTS[0].photo,
  since: 'Apr 2025',
};
// Trails the demo account has saved for later, so the profile shows its Saved row
const DEMO_SAVED = [
  'lands-end',
  'muir-woods',
  'lake-chabot',
  'jewel-lake',
  'coyote-hills',
];

/** For <Image source>: a picked photo is a URI, a bundled one is already a source. */
// Checks for a string, not a number: on web a bundled image isn't always a number
export const photoSource = (
  photo: string | ImageSourcePropType,
): ImageSourcePropType => (typeof photo === 'string' ? { uri: photo } : photo);

type AccountState = {
  user: User;
  /** Called at the end of sign-in / sign-up. */
  signIn: (user: Omit<User, 'since'> & { since?: string }) => void;
  updateUser: (patch: Partial<User>) => void;
  signOut: () => void;
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Trail ids saved for later, newest first; listed in the profile. */
  saved: string[];
  toggleSaved: (trailId: string) => void;
  /** Every chair, walker… they've added. */
  aids: MyAid[];
  /** The one they're using now; undefined until they add one, and trail pages compare with the guideline. */
  mobility?: MyAid;
  /** Adds (and starts using) a new one, or updates one by id. */
  saveAid: (aid: MyAid) => void;
  /** Removes one; if it was in use, the next one takes over. */
  removeAid: (id: string) => void;
  pickAid: (id: string) => void;
};

const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(DEMO_USER);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<string[]>(DEMO_SAVED);
  const [aids, setAids] = useState<MyAid[]>([]);
  const [inUse, setInUse] = useState<string>();

  const signIn = useCallback<AccountState['signIn']>(
    u => setUser({ since: thisMonth(), ...u }),
    [],
  );
  const updateUser = useCallback(
    (patch: Partial<User>) => setUser(u => ({ ...u, ...patch })),
    [],
  );
  const signOut = useCallback(() => {
    setUser(DEMO_USER);
    setSettings(DEFAULT_SETTINGS);
    setSaved(DEMO_SAVED);
    setAids([]);
    setInUse(undefined);
  }, []);
  const toggleSaved = useCallback(
    (id: string) =>
      setSaved(s => (s.includes(id) ? s.filter(x => x !== id) : [id, ...s])),
    [],
  );
  const setSetting = useCallback<AccountState['setSetting']>(
    (key, value) => setSettings(s => ({ ...s, [key]: value })),
    [],
  );
  const saveAid = useCallback(
    (aid: MyAid) => {
      if (aids.some(a => a.id === aid.id))
        return setAids(aids.map(a => (a.id === aid.id ? aid : a)));
      setAids([...aids, aid]);
      setInUse(aid.id);
    },
    [aids],
  );
  const removeAid = useCallback(
    (id: string) => {
      const rest = aids.filter(a => a.id !== id);
      setAids(rest);
      if (inUse === id) setInUse(rest[0]?.id);
    },
    [aids, inUse],
  );
  const mobility = aids.find(a => a.id === inUse);

  const value = useMemo(
    () => ({
      user,
      signIn,
      updateUser,
      signOut,
      settings,
      setSetting,
      saved,
      toggleSaved,
      aids,
      mobility,
      saveAid,
      removeAid,
      pickAid: setInUse,
    }),
    [
      user,
      signIn,
      updateUser,
      signOut,
      settings,
      setSetting,
      saved,
      toggleSaved,
      aids,
      mobility,
      saveAid,
      removeAid,
    ],
  );
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside <AccountProvider>');
  return ctx;
}

/** "Jesslyn Ruswan" → "JR" */
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
