// Placeholder trail database. Nothing here is real survey data.
import type { IconName } from '@/components/Icon/Icon';

/** never = no survey on record, due = last survey over 2 years old, current = surveyed in the last 2 years */
export type TrailStatus = 'never' | 'due' | 'current';

/** ok = meets the guideline, warn = worth re-checking */
export type Mark = 'ok' | 'warn';

export type Condition = {
  icon: Extract<IconName, 'width' | 'slope' | 'cross' | 'surface' | 'rock'>;
  label: string;
  value: string;
  mark: Mark;
  note?: string;
};

export type TrailheadKey = 'parking' | 'restroom' | 'sign' | 'water';
/** answer = the option the last survey picked on At the trailhead (one of TRAILHEAD_QUESTIONS' options). */
export type TrailheadItem = {
  value: string;
  detail: string;
  mark: Mark;
  answer: string;
};

export type Trail = {
  id: string;
  name: string;
  park: string;
  city: string;
  county: string;
  miles: number;
  gainFt: number;
  /** Trailhead, where distances are measured to. */
  lat: number;
  lng: number;
  surface: string;
  status: TrailStatus;
  last?: string;
  age?: string;
  seed: number;
  elevFt: number;
  water?: string;
  conditions?: Condition[];
  trailhead?: Record<TrailheadKey, TrailheadItem>;
  /** Added from the app in this session (not in the database yet). */
  isNew?: boolean;
  /** Notes typed in when the trail was added. */
  addedNotes?: string;
};

export const STATUS_LABEL: Record<TrailStatus, string> = {
  never: 'Not surveyed',
  due: 'Resurvey due',
  current: 'Up to date',
};

const width = (inches: number): Condition => ({
  icon: 'width',
  label: 'Narrowest width',
  value: `${inches} in`,
  mark: inches >= 36 ? 'ok' : 'warn',
  note: 'Min. 36 in',
});

const grade = (pct: number): Condition =>
  pct <= 5
    ? {
        icon: 'slope',
        label: 'Steepest grade',
        value: `${pct}%`,
        mark: 'ok',
        note: 'Max. 5% any length',
      }
    : {
        icon: 'slope',
        label: 'Steepest grade',
        value: `${pct}%`,
        mark: 'warn',
        note: 'Allowed up to 200 ft',
      };

const cross = (pct: number): Condition => ({
  icon: 'cross',
  label: 'Cross slope',
  value: `${pct}%`,
  mark: pct <= 5 ? 'ok' : 'warn',
  note: 'Max. 5%',
});

const surface = (
  value: string,
  note = 'Firm and stable',
  mark: Mark = 'ok',
): Condition => ({
  icon: 'surface',
  label: 'Surface',
  value,
  mark,
  note,
});

const obstacles = (
  value = 'None found',
  note?: string,
  mark: Mark = 'ok',
): Condition => ({
  icon: 'rock',
  label: 'Obstacles',
  value,
  mark,
  note,
});

const standardTrailhead: Record<TrailheadKey, TrailheadItem> = {
  parking: {
    value: '3 spaces',
    detail: '1 van accessible',
    mark: 'ok',
    answer: 'Van accessible',
  },
  restroom: {
    value: 'Accessible',
    detail: 'At trailhead',
    mark: 'ok',
    answer: 'Accessible',
  },
  sign: {
    value: 'Partial info',
    detail: 'No grade listed',
    mark: 'warn',
    answer: 'Length only',
  },
  water: {
    value: 'Fountain',
    detail: 'Seated height',
    mark: 'ok',
    answer: 'Seated height',
  },
};

export const TRAILS: Trail[] = [
  {
    id: 'jewel-lake',
    name: 'Jewel Lake Boardwalk',
    park: 'Tilden Nature Area',
    city: 'Berkeley, CA',
    county: 'Contra Costa',
    miles: 1.2,
    gainFt: 40,
    lat: 37.9104,
    lng: -122.2667,
    surface: 'Boardwalk',
    status: 'due',
    last: 'Mar 2023',
    age: '3 years',
    seed: 4,
    elevFt: 640,
    water: 'Jewel Lake',
    conditions: [
      width(42),
      grade(7.2),
      cross(2),
      surface('Boardwalk, gravel'),
      obstacles('Fallen tree', 'Across the path, not passable', 'warn'),
    ],
    trailhead: {
      parking: {
        value: '4 spaces',
        detail: '1 van accessible',
        mark: 'ok',
        answer: 'Van accessible',
      },
      restroom: {
        value: 'Accessible',
        detail: 'At trailhead',
        mark: 'ok',
        answer: 'Accessible',
      },
      sign: {
        value: 'No access info',
        detail: 'Length only',
        mark: 'warn',
        answer: 'Length only',
      },
      water: {
        value: 'Fountain',
        detail: 'Seated height',
        mark: 'ok',
        answer: 'Seated height',
      },
    },
  },
  {
    id: 'nimitz-way',
    name: 'Nimitz Way',
    park: 'Tilden & Wildcat Canyon',
    city: 'Berkeley, CA',
    county: 'Contra Costa',
    miles: 4.1,
    gainFt: 210,
    lat: 37.9049,
    lng: -122.2447,
    surface: 'Paved',
    status: 'current',
    last: 'Jun 2025',
    age: '1 year',
    seed: 11,
    elevFt: 1480,
    conditions: [
      width(96),
      grade(4.6),
      cross(1.5),
      surface('Asphalt', 'Cracked near mile 3'),
      obstacles(),
    ],
    trailhead: {
      parking: {
        value: '2 spaces',
        detail: 'No van space',
        mark: 'warn',
        answer: 'Accessible, not van',
      },
      restroom: {
        value: 'Accessible',
        detail: 'Inspiration Point',
        mark: 'ok',
        answer: 'Accessible',
      },
      sign: {
        value: 'Full access info',
        detail: 'Grade, surface, width',
        mark: 'ok',
        answer: 'Full info',
      },
      water: {
        value: 'None',
        detail: 'Bring water',
        mark: 'warn',
        answer: 'None',
      },
    },
  },
  {
    id: 'point-pinole',
    name: 'Bay View Trail',
    park: 'Point Pinole Regional Shoreline',
    city: 'Richmond, CA',
    county: 'Contra Costa',
    miles: 2.4,
    gainFt: 35,
    lat: 37.9935,
    lng: -122.3556,
    surface: 'Gravel',
    status: 'never',
    seed: 23,
    elevFt: 40,
    water: 'San Pablo Bay',
  },
  {
    id: 'crissy-field',
    name: 'Crissy Field Promenade',
    park: 'Presidio of San Francisco',
    city: 'San Francisco, CA',
    county: 'San Francisco',
    miles: 1.3,
    gainFt: 5,
    lat: 37.8036,
    lng: -122.4637,
    surface: 'Gravel',
    status: 'current',
    last: 'Apr 2025',
    age: '1 year',
    seed: 7,
    elevFt: 10,
    water: 'Crissy Marsh',
    conditions: [
      width(120),
      grade(2.1),
      cross(1),
      surface('Compacted gravel'),
      obstacles(),
    ],
    trailhead: standardTrailhead,
  },
  {
    id: 'lands-end',
    name: 'Lands End Trail',
    park: 'Golden Gate National Rec Area',
    city: 'San Francisco, CA',
    county: 'San Francisco',
    miles: 1.5,
    gainFt: 180,
    lat: 37.7801,
    lng: -122.5111,
    surface: 'Gravel, steps',
    status: 'current',
    last: 'Jul 2025',
    age: '1 year',
    seed: 15,
    elevFt: 260,
    conditions: [
      width(60),
      grade(11.5),
      cross(3),
      surface('Gravel', 'Loose after mile 1', 'warn'),
      obstacles('Steps at mile 1.1', 'Not passable', 'warn'),
    ],
    trailhead: standardTrailhead,
  },
  {
    id: 'lake-chabot',
    name: 'West Shore Trail',
    park: 'Lake Chabot Regional Park',
    city: 'Castro Valley, CA',
    county: 'Alameda',
    miles: 2.2,
    gainFt: 95,
    lat: 37.7183,
    lng: -122.1049,
    surface: 'Paved',
    status: 'due',
    last: 'Jan 2023',
    age: '3 years',
    seed: 31,
    elevFt: 320,
    water: 'Lake Chabot',
    conditions: [
      width(72),
      grade(6.4),
      cross(2),
      surface('Asphalt'),
      obstacles(),
    ],
    trailhead: standardTrailhead,
  },
  {
    id: 'verna-dunshee',
    name: 'Verna Dunshee Trail',
    park: 'Mount Tamalpais State Park',
    city: 'Mill Valley, CA',
    county: 'Marin',
    miles: 0.7,
    gainFt: 30,
    lat: 37.9276,
    lng: -122.5781,
    surface: 'Paved',
    status: 'current',
    last: 'Aug 2025',
    age: '1 year',
    seed: 19,
    elevFt: 2480,
    conditions: [
      width(48),
      grade(4.9),
      cross(2),
      surface('Asphalt, boardwalk'),
      obstacles(),
    ],
    trailhead: standardTrailhead,
  },
  {
    id: 'muir-woods',
    name: 'Muir Woods Main Trail',
    park: 'Muir Woods National Monument',
    city: 'Mill Valley, CA',
    county: 'Marin',
    miles: 1.0,
    gainFt: 20,
    lat: 37.897,
    lng: -122.5811,
    surface: 'Boardwalk',
    status: 'due',
    last: 'Sep 2022',
    age: '4 years',
    seed: 42,
    elevFt: 160,
    conditions: [
      width(54),
      grade(3.2),
      cross(1.5),
      surface('Boardwalk'),
      obstacles(),
    ],
    trailhead: standardTrailhead,
  },
  {
    id: 'coyote-hills',
    name: 'Bayview Trail',
    park: 'Coyote Hills Regional Park',
    city: 'Fremont, CA',
    county: 'Alameda',
    miles: 3.5,
    gainFt: 60,
    lat: 37.5547,
    lng: -122.0868,
    surface: 'Paved',
    status: 'never',
    seed: 27,
    elevFt: 20,
  },
  {
    id: 'quarry-lakes',
    name: 'Quarry Lakes Loop',
    park: 'Quarry Lakes Regional Rec Area',
    city: 'Fremont, CA',
    county: 'Alameda',
    miles: 2.8,
    gainFt: 15,
    lat: 37.5786,
    lng: -122.0053,
    surface: 'Paved, gravel',
    status: 'never',
    seed: 36,
    elevFt: 70,
    water: 'Horseshoe Lake',
  },
];

export const getTrail = (id: string) => TRAILS.find(t => t.id === id);
