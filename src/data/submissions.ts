// Placeholder survey history for the demo account (Jesslyn Ruswan), so the profile has something to show.
// Dates line up with src/data/trails.ts: the published Crissy Field, Nimitz Way and Verna Dunshee surveys
// are those trails' 2025 volunteer surveys; the two recent ones are on never-surveyed trails because they
// aren't published yet.
import type { Pin, Submission } from '@/features/survey/SurveyProvider';
import type { PinKind } from './survey';
import { PIN_PHOTOS } from './pin-photos';
import { SESSION_SIZE, TRAIL_SESSION_MAPS } from './trail-session-maps';

/** The point `t` (0–1) of the way along a trail's session-map route, so demo pins sit on the trail. */
function alongRoute(trailId: string, t: number): { x: number; y: number } {
  const route = TRAIL_SESSION_MAPS[trailId]?.route;
  if (!route?.length) return { x: 0.2 + 0.6 * t, y: 0.8 - 0.6 * t };
  const aspect = SESSION_SIZE.height / SESSION_SIZE.width;
  const seg = route
    .slice(1)
    .map(([x, y], i) =>
      Math.hypot(x - route[i][0], (y - route[i][1]) * aspect),
    );
  let left = t * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i]) {
      const f = seg[i] ? left / seg[i] : 0;
      return {
        x: route[i][0] + (route[i + 1][0] - route[i][0]) * f,
        y: route[i][1] + (route[i + 1][1] - route[i][1]) * f,
      };
    }
    left -= seg[i];
  }
  const [x, y] = route[route.length - 1];
  return { x, y };
}

/**
 * Pins spread along the trail, cycling through the kinds with a few outside the guidelines. `extra`
 * adds to pin n: the photos taken there, or a different answer.
 */
function pins(
  trailId: string,
  count: number,
  miles: number,
  flagged: number[],
  extra: Record<number, Partial<Pin>> = {},
): Pin[] {
  const kinds: { kind: PinKind; ok: Partial<Pin>; warn: Partial<Pin> }[] = [
    { kind: 'width', ok: { value: 44 }, warn: { value: 31 } },
    {
      kind: 'surface',
      ok: { choice: 'Compacted gravel' },
      warn: { choice: 'Loose gravel' },
    },
    { kind: 'grade', ok: { value: 3.4 }, warn: { value: 8.1 } },
    {
      kind: 'obstacle',
      ok: { choice: 'Root', value: 1 },
      warn: { choice: 'Rock', value: 3 },
    },
    { kind: 'cross', ok: { value: 2.1 }, warn: { value: 6.5 } },
    { kind: 'other', ok: { choice: 'Bench' }, warn: { choice: 'Gate' } },
  ];
  return Array.from({ length: count }, (_, i) => {
    const k = kinds[i % kinds.length];
    const t = (i + 1) / (count + 1);
    return {
      id: `p${i + 1}`,
      n: i + 1,
      ...alongRoute(trailId, t),
      mi: +(t * miles).toFixed(2),
      kind: k.kind,
      ...(flagged.includes(i + 1) ? k.warn : k.ok),
      photos: [],
      voice: [],
      ...extra[i + 1],
    };
  });
}

const photo = (key: keyof typeof PIN_PHOTOS) => ({
  photos: [PIN_PHOTOS[key].image],
});

const day = (iso: string) => new Date(`${iso}T12:00:00`).getTime();
const MIN = 60_000;

export const PAST_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-quarry',
    trailId: 'quarry-lakes',
    sentAt: day('2026-10-25'),
    status: 'review',
    elapsed: 61 * MIN,
    miles: 2.8,
    trailhead: {
      parking: 'Van accessible',
      restroom: 'Accessible',
      sign: 'Length only',
      water: 'Standing only',
    },
    pins: pins('quarry-lakes', 9, 2.8, [3, 7], {
      3: photo('uphill'),
      4: photo('roots'),
      7: photo('narrowMakiki'),
    }),
    note: 'Busy with bikes on the weekend. Roots across the path near the north end, pin 4.',
    voice: [],
  },
  {
    id: 'sub-pinole',
    trailId: 'point-pinole',
    sentAt: day('2026-10-19'),
    status: 'changes',
    elapsed: 52 * MIN,
    miles: 2.4,
    trailhead: {
      parking: 'Accessible, not van',
      restroom: 'Not accessible',
      sign: 'No sign',
      water: 'None',
    },
    pins: pins('point-pinole', 7, 2.4, [1, 3], {
      1: photo('narrowChampoeg'),
      3: photo('steepTrack'),
      6: { choice: 'Gate', ...photo('gate') },
    }),
    voice: [],
    review: {
      at: day('2026-10-22'),
      note: 'Thanks Jesslyn! Pin 1 says 31 in wide, which would make the trail inaccessible. Could you re-measure it next time you’re out, and add a photo with the tape in it?',
    },
  },
  {
    id: 'sub-verna',
    trailId: 'verna-dunshee',
    sentAt: day('2025-08-17'),
    status: 'published',
    elapsed: 31 * MIN,
    miles: 0.7,
    trailhead: {
      parking: 'Van accessible',
      restroom: 'Accessible',
      sign: 'Length only',
      water: 'Seated height',
    },
    pins: pins('verna-dunshee', 6, 0.7, [3]),
    voice: [],
    review: {
      at: day('2025-08-22'),
      note: 'Thanks, published to Access California.',
    },
  },
  {
    id: 'sub-nimitz',
    trailId: 'nimitz-way',
    sentAt: day('2025-06-14'),
    status: 'published',
    elapsed: 94 * MIN,
    miles: 4.1,
    trailhead: {
      parking: 'Accessible, not van',
      restroom: 'Accessible',
      sign: 'Full info',
      water: 'None',
    },
    pins: pins('nimitz-way', 11, 4.1, [5]),
    note: 'Cracked asphalt around mile 3, pin 5.',
    voice: [],
    review: {
      at: day('2025-06-20'),
      note: 'Published to Access California. Thanks for the note on the cracks.',
    },
  },
  {
    id: 'sub-crissy',
    trailId: 'crissy-field',
    sentAt: day('2025-04-27'),
    status: 'published',
    elapsed: 48 * MIN,
    miles: 1.3,
    trailhead: {
      parking: 'Van accessible',
      restroom: 'Accessible',
      sign: 'Full info',
      water: 'Seated height',
    },
    pins: pins('crissy-field', 15, 1.3, [2, 9], {
      2: photo('looseGravel'),
      9: photo('hillside'),
    }),
    voice: [],
    review: {
      at: day('2025-05-03'),
      note: 'Great survey, published to Access California.',
    },
  },
];
