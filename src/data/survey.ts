// Survey content: the first-time primer, the gear list, the trailhead questions and what to re-check.
// Guideline numbers match the notes on the trail details screen (src/data/trails.ts).
import type { IconName } from '@/components/Icon/Icon';
import type { Mark, Trail, TrailheadKey } from './trails';

/* ---------- First-time primer ---------- */

export type PrimerCard = {
  icon: IconName;
  title: string;
  body: string;
  standards?: { icon: IconName; label: string; value: string }[];
};

export const PRIMER: PrimerCard[] = [
  {
    icon: 'trails',
    title: 'Walk or roll the trail',
    body: 'Drop a pin wherever something affects access, like a narrow spot, a steep stretch or a fallen tree. Add a photo or a voice note so BORP can see what you saw.',
  },
  {
    icon: 'width',
    title: 'What we measure',
    body: 'You don’t need to be an expert. Each pin has a short how-to, and the app flags anything outside these guidelines.',
    standards: [
      { icon: 'width', label: 'Width', value: '36 in or wider' },
      { icon: 'slope', label: 'Grade', value: '5% or less' },
      { icon: 'cross', label: 'Cross slope', value: '5% or less' },
      { icon: 'surface', label: 'Surface', value: 'Firm and stable' },
      { icon: 'rock', label: 'Obstacles', value: 'Under 2 in high' },
    ],
  },
  {
    icon: 'mic',
    title: 'Talk, don’t type',
    body: 'Tap the mic to leave a voice note when your hands are busy. Everything saves to your phone, so you don’t need signal. BORP reviews your survey before it appears on Access California.',
  },
];

/* ---------- Before you go ---------- */

// Labels say it; a detail only where there's a number to know
export const GEAR: {
  key: string;
  icon: IconName;
  label: string;
  detail?: string;
}[] = [
  { key: 'tape', icon: 'tape', label: 'Tape measure' },
  {
    key: 'battery',
    icon: 'battery',
    label: 'Phone charged',
    detail: '50% or more',
  },
  { key: 'chat', icon: 'chat', label: 'Tell someone where you’re going' },
];

/** Placeholder size of a trail's offline pack: map tiles, the last survey and the how-to guides. */
export const OFFLINE_PACK_MB = 18;

/** What a first survey should cover. */
export const CAPTURE: { icon: IconName; label: string; detail: string }[] = [
  {
    icon: 'width',
    label: 'Narrowest width',
    detail: 'Measure anywhere it looks tight',
  },
  {
    icon: 'slope',
    label: 'Steepest grade',
    detail: 'Lay your phone on the path to read it',
  },
  {
    icon: 'cross',
    label: 'Cross slope',
    detail: 'How much the path tilts sideways',
  },
  {
    icon: 'surface',
    label: 'Surface',
    detail: 'Paved, gravel, dirt, boardwalk…',
  },
  {
    icon: 'rock',
    label: 'Obstacles',
    detail: 'Fallen trees, rocks, steps, ruts',
  },
];

/* ---------- Re-check list ---------- */

export type RecheckItem = {
  key: string;
  icon: IconName;
  label: string;
  was: string;
};

const TRAILHEAD_LABEL: Record<TrailheadKey, string> = {
  parking: 'Parking',
  restroom: 'Restroom',
  sign: 'Trailhead sign',
  water: 'Drinking water',
};

/** Everything the last survey flagged with a warning, trail conditions first. */
export function recheckItems(trail: Trail): RecheckItem[] {
  const items: RecheckItem[] = (trail.conditions ?? [])
    .filter(c => c.mark === 'warn')
    .map(c => ({
      key: c.label,
      icon: c.icon,
      label: c.label,
      was: c.note ? `${c.value} · ${c.note}` : c.value,
    }));
  if (trail.trailhead) {
    for (const key of Object.keys(TRAILHEAD_LABEL) as TrailheadKey[]) {
      const th = trail.trailhead[key];
      if (th.mark === 'warn')
        items.push({
          key,
          icon: key,
          label: TRAILHEAD_LABEL[key],
          was: `${th.value} · ${th.detail}`,
        });
    }
  }
  return items;
}

/* ---------- Trailhead checks ---------- */

export type TrailheadQuestion = {
  key: TrailheadKey;
  label: string;
  question: string;
  options: string[];
  /** How a non-expert can tell, shown under "How to tell". */
  howTo: string;
};

/** Last option is always "Not sure", so nobody has to guess. */
export const NOT_SURE = 'Not sure';

export const TRAILHEAD_QUESTIONS: TrailheadQuestion[] = [
  {
    key: 'parking',
    label: 'Parking',
    question: 'Is there accessible parking?',
    options: ['Van accessible', 'Accessible, not van', 'None', NOT_SURE],
    howTo:
      'Look for the blue wheelchair sign. A van-accessible space has an extra-wide striped aisle next to it (8 ft) and a “Van Accessible” sign.',
  },
  {
    key: 'restroom',
    label: 'Restroom',
    question: 'Is there an accessible restroom?',
    options: ['Accessible', 'Not accessible', 'None', NOT_SURE],
    howTo:
      'Accessible stalls have grab bars, a door you can open with one hand and room to turn a wheelchair around (5 ft circle).',
  },
  {
    key: 'sign',
    label: 'Trailhead sign',
    question: 'Does the sign show access info?',
    options: ['Full info', 'Length only', 'No sign', NOT_SURE],
    howTo:
      'Full info means the sign lists length, surface, steepest grade and narrowest width. Take a photo of the sign either way.',
  },
  {
    key: 'water',
    label: 'Drinking water',
    question: 'Is there drinking water?',
    options: ['Seated height', 'Standing only', 'None', NOT_SURE],
    howTo:
      'Seated height means the spout is no higher than 36 in and there’s knee space under the fountain.',
  },
];

/* ---------- Pins ---------- */

export type PinKind =
  'width' | 'grade' | 'cross' | 'surface' | 'obstacle' | 'other';

export type PinChoice = { label: string; mark?: Mark };

export type PinKindInfo = {
  key: PinKind;
  icon: IconName;
  /** Tile label on "What's here?" and the pin's name. */
  label: string;
  /** Tile hint under the label. */
  hint: string;
  /** Heading on the measure step. */
  question: string;
  /** The guideline it's checked against, if any. */
  guideline?: string;
  /** The trail condition this pin re-checks (matches Condition.label in src/data/trails.ts). */
  condition?: string;
  /** inches = typed / stepped number, level = "lay your phone on the path" reading (mocked), none = choice only. */
  measure: 'inches' | 'level' | 'none';
  /** Starting number for the stepper. */
  start?: number;
  meets?: (value: number) => boolean;
  /** Short verdict when it doesn't meet the guideline. */
  fails?: string;
  choiceLabel?: string;
  choices?: PinChoice[];
  howTo: string;
};

export const PIN_KINDS: PinKindInfo[] = [
  {
    key: 'width',
    icon: 'width',
    label: 'Narrow spot',
    hint: 'Path gets tight',
    question: 'How wide is it?',
    guideline: '36 in or wider',
    condition: 'Narrowest width',
    measure: 'inches',
    start: 36,
    meets: v => v >= 36,
    fails: 'Narrower than 36 in',
    howTo:
      'Measure the narrowest point, edge to edge, at ground level. Count only firm path, not soft edges or plants you’d brush past.',
  },
  {
    key: 'grade',
    icon: 'slope',
    label: 'Steep stretch',
    hint: 'Uphill or downhill',
    question: 'How steep is it?',
    guideline: '5% or less',
    condition: 'Steepest grade',
    measure: 'level',
    meets: v => v <= 5,
    fails: 'Steeper than 5%',
    howTo:
      'Lay your phone flat on the steepest part of the path, top edge pointing uphill. Hold still for a moment while it reads.',
  },
  {
    key: 'cross',
    icon: 'cross',
    label: 'Tilted path',
    hint: 'Leans to one side',
    question: 'How much does it tilt?',
    guideline: '5% or less',
    condition: 'Cross slope',
    measure: 'level',
    meets: v => v <= 5,
    fails: 'Tilts more than 5%',
    howTo:
      'Lay your phone flat across the path, side to side, where it leans the most. Hold still for a moment while it reads.',
  },
  {
    key: 'surface',
    icon: 'surface',
    label: 'Surface',
    hint: 'Gravel, dirt, boardwalk',
    question: 'What’s the surface like?',
    guideline: 'Firm and stable',
    condition: 'Surface',
    measure: 'none',
    choiceLabel: 'Surface',
    choices: [
      { label: 'Paved', mark: 'ok' },
      { label: 'Boardwalk', mark: 'ok' },
      { label: 'Compacted gravel', mark: 'ok' },
      { label: 'Packed dirt', mark: 'ok' },
      { label: 'Loose gravel', mark: 'warn' },
      { label: 'Sand or mud', mark: 'warn' },
    ],
    howTo:
      'Firm means a wheel doesn’t sink in. Stable means it doesn’t shift when you turn. Press your heel in and twist: if it leaves a dent or moves, it’s loose.',
  },
  {
    key: 'obstacle',
    icon: 'rock',
    label: 'Obstacle',
    hint: 'Fallen tree, rock, step, rut',
    question: 'What’s in the way?',
    guideline: 'Under 2 in high',
    condition: 'Obstacles',
    measure: 'inches',
    start: 2,
    meets: v => v < 2,
    fails: '2 in or higher',
    choiceLabel: 'Obstacle',
    choices: [
      { label: 'Fallen tree' },
      { label: 'Rock' },
      { label: 'Step' },
      { label: 'Rut' },
      { label: 'Root' },
      { label: 'Other' },
    ],
    howTo:
      'Measure from the path surface to the top of the obstacle, at its highest point. For a rut, measure how deep it is.',
  },
  {
    key: 'other',
    icon: 'flag',
    label: 'Something else',
    hint: 'Bench, gate, viewpoint',
    question: 'What did you find?',
    measure: 'none',
    choiceLabel: 'Type',
    choices: [
      { label: 'Bench' },
      { label: 'Gate' },
      { label: 'Viewpoint' },
      { label: 'Hazard', mark: 'warn' },
      { label: 'Other' },
    ],
    howTo:
      'Anything someone using a wheelchair would want to know about: a place to rest, a gate to open, a view, or something unsafe.',
  },
];

export const pinKind = (key: PinKind) => PIN_KINDS.find(k => k.key === key)!;

/** The glyph a pin shows on the map and in lists: its kind, or a mic for a quick voice pin. */
export const pinIcon = (kind?: PinKind): IconName =>
  kind ? pinKind(kind).icon : 'mic';

/** The parts of a pin that decide how it's judged. */
export type PinReading = { kind?: PinKind; value?: number; choice?: string };

/** ok / warn against the guideline; undefined when there's nothing to judge yet (or nothing to judge at all). */
export function pinMark({ kind, value, choice }: PinReading): Mark | undefined {
  if (!kind) return undefined;
  const k = pinKind(kind);
  if (k.measure !== 'none')
    return value === undefined ? undefined : k.meets!(value) ? 'ok' : 'warn';
  return k.choices?.find(c => c.label === choice)?.mark;
}

export function formatPinValue({ kind, value, choice }: PinReading) {
  if (!kind) return 'Needs details';
  const k = pinKind(kind);
  const num =
    value === undefined
      ? undefined
      : k.measure === 'level'
        ? `${value.toFixed(1)}%`
        : `${value} in`;
  const parts = [choice, num].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return k.measure === 'none' ? 'Not set' : 'Not measured';
}

/** Pin kinds the last survey flagged, so "What's here?" can point them out. */
export function recheckKinds(trail: Trail): PinKind[] {
  const flagged = new Set(recheckItems(trail).map(r => r.key));
  return PIN_KINDS.filter(k => k.condition && flagged.has(k.condition)).map(
    k => k.key,
  );
}

/* ---------- Re-check coverage ---------- */

/** The re-check list, each item with what this survey found (`now`) once a measured pin or a trailhead
 *  answer covers it. Several pins of one kind: the worst reading wins (narrowest, steepest, highest). */
export function recheckCoverage(
  trail: Trail,
  pins: PinReading[],
  trailhead: Partial<Record<TrailheadKey, string>>,
) {
  const found = new Map<string, string>(
    Object.entries(trailhead).filter((e): e is [string, string] => !!e[1]),
  );
  for (const k of PIN_KINDS) {
    if (!k.condition) continue;
    const measured = pins.filter(p => p.kind === k.key && pinMark(p));
    if (!measured.length) continue;
    const worst = measured.reduce((a, b) =>
      (
        k.key === 'width'
          ? (b.value ?? Infinity) < (a.value ?? Infinity)
          : (b.value ?? -Infinity) > (a.value ?? -Infinity)
      )
        ? b
        : a,
    );
    found.set(k.condition, formatPinValue(worst));
  }
  return recheckItems(trail).map(r => ({
    ...r,
    now: found.get(r.key),
    done: found.has(r.key),
  }));
}

/** The short "was" value: "Fallen tree", not "Fallen tree · Across the path, not passable". */
export const recheckWas = (r: RecheckItem) => r.was.split(' · ')[0];

/** One-tap answers on the wrap-up for something the last survey flagged that this one didn't pin. A thing
 *  on the path can be gone; a slope or a surface can only look the same (or go unchecked). */
export function recheckAnswers(r: RecheckItem) {
  return r.key === 'Obstacles'
    ? ['Still there', 'Gone', DIDNT_CHECK]
    : ['Same as before', DIDNT_CHECK];
}
export const DIDNT_CHECK = 'Didn’t check';
