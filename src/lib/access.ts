// The access numbers from a trail's last survey, shown on the trail page: compared with the person's own
// limits (Profile → How you go on trails) when they've set them, else with the guideline. And where along the trail the problems are.
import type { Condition, Trail } from '@/data/trails';
import type { Mobility } from '@/features/account/AccountProvider';
import { steepestAt } from '@/components/GradeChart/GradeChart';
import { type IconName } from '@/components/Icon/Icon';
import { ROOM_FOR_HANDS } from '@/features/account/AccountProvider';

/** Narrowest width, steepest grade and cross slope — the readings a wheelchair user checks first. */
export function keyReadings(trail: Trail) {
  const find = (icon: Condition['icon']) =>
    trail.conditions?.find(c => c.icon === icon);
  const width = find('width');
  const grade = find('slope');
  const cross = find('cross');
  return width && grade && cross ? { width, grade, cross } : null;
}

/** "42 in" → ["42", "in"], "7.2%" → ["7.2", "%"]: the number is set large, the unit small. */
export function splitUnit(value: string): [string, string] {
  const m = value.match(/^([\d.]+)\s*(.*)$/);
  return m ? [m[1], m[2]] : [value, ''];
}

/** How a reading falls outside its guideline, in words: "Under 36 in", "Over 5%". Nothing when it meets it. */
export function outsideGuideline(c: Condition) {
  if (c.mark !== 'warn') return null;
  if (c.icon === 'width') return 'Under 36 in';
  if (c.icon === 'slope' || c.icon === 'cross') return 'Over 5%';
  return null;
}

/** How a reading compares, in words: with your limits if set ("Over your 6%", "Room for 26 in"), else
 *  with the guideline ("Over 5%", nothing when it meets it). `outside` = navy emphasis. */
export function compareReading(
  c: Condition,
  mine?: Mobility,
): { text: string; outside: boolean } | null {
  const n = parseFloat(c.value);
  if (!mine) {
    const text = outsideGuideline(c);
    return text ? { text, outside: true } : null;
  }
  if (c.icon === 'width') {
    if (mine.width === undefined) return null;
    // The chair's own width, plus room for hands on the wheels: just the chair fitting is "tight". The
    // caption above already says "Checked for your chair", so the words don't repeat it.
    const w = `${mine.width} in`;
    if (n >= mine.width + ROOM_FOR_HANDS)
      return { text: `Room for ${w}`, outside: false };
    return n >= mine.width
      ? { text: `Tight for ${w}`, outside: true }
      : { text: `Under ${w}`, outside: true };
  }
  const limit =
    c.icon === 'slope' ? mine.grade : c.icon === 'cross' ? mine.cross : null;
  if (limit === null) return null;
  return n <= limit
    ? { text: `Within your ${limit}%`, outside: false }
    : { text: `Over your ${limit}%`, outside: true };
}

/** The one word line under a reading on the trail page: what it is ("Steepest") while it's within your
 *  limits (or the guideline), what's wrong ("Too steep", navy) once it isn't. Words, not your limit in
 *  numbers: people pick Gentle / Moderate / Steep and don't know their limit as a percent. The numbers
 *  stay in `compareReading`, for the screen reader. */
export function readingWord(
  c: Condition,
  mine?: Mobility,
): { word: string; outside: boolean } {
  const vs = compareReading(c, mine);
  const outside = !!vs?.outside;
  if (c.icon === 'width') {
    // Just the chair fits, without room for hands: tight, not too narrow
    const tight = !!mine?.width && parseFloat(c.value) >= mine.width;
    return {
      word: !outside ? 'Narrowest' : tight ? 'Tight fit' : 'Too narrow',
      outside,
    };
  }
  if (c.icon === 'slope')
    return { word: outside ? 'Too steep' : 'Steepest', outside };
  return { word: outside ? 'Too tilted' : 'Cross slope', outside }; // short enough for a pill in a third of the width
}

export type ProblemSpot = {
  key: string;
  icon: IconName;
  title: string;
  detail: string;
  at: number;
  mile: number;
};

/** "Steps at mile 1.1" → 1.1 */
const mileIn = (text?: string) => {
  const m = text?.match(/mile (\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : undefined;
};

/**
 * What the last survey flagged, placed along the route (0–1 from the trailhead) for the map. A mile in
 * the reading's words wins; the steepest stretch matches the grade chart; anything else is PROTOTYPE
 * placement from the trail's seed, since the placeholder data has no pin positions.
 */
export function problemSpots(trail: Trail): ProblemSpot[] {
  const readings = keyReadings(trail);
  const spots: ProblemSpot[] = [];
  (trail.conditions ?? []).forEach((c, i) => {
    if (c.mark !== 'warn') return;
    const said = mileIn(c.value) ?? mileIn(c.note);
    const at =
      said !== undefined
        ? Math.min(0.98, said / trail.miles)
        : c.icon === 'slope' && readings
          ? steepestAt(trail, readings.grade.value)
          : ((trail.seed * 37 + i * 23) % 80) / 100 + 0.1;
    // The mile has its own column, so "Steps at mile 1.1" becomes "Steps"
    const title =
      c.icon === 'slope'
        ? 'Steepest stretch'
        : c.icon === 'width'
          ? 'Narrowest spot'
          : c.icon === 'cross'
            ? 'Most tilted stretch'
            : c.value.replace(/\s+(at|after|near) mile [\d.]+$/, '');
    const detail =
      c.icon === 'surface' || c.icon === 'rock'
        ? (c.note ?? '')
        : `${c.value}${outsideGuideline(c) ? `, ${outsideGuideline(c)!.toLowerCase()}` : ''}`;
    spots.push({
      key: c.label,
      icon: c.icon,
      title,
      detail,
      at,
      mile: Math.round(at * trail.miles * 10) / 10,
    });
  });
  return spots.sort((a, b) => a.at - b.at);
}

/** Rough trail pace, mph on the flat, and extra minutes per 100 ft of climbing, by how someone goes.
 *  Placeholder figures for the prototype, not measured: real ones should come from finished surveys. */
const PACE: Record<
  Mobility['aid'] | 'default',
  { mph: number; climb: number }
> = {
  manual: { mph: 1.8, climb: 6 },
  power: { mph: 3, climb: 2 },
  scooter: { mph: 3.5, climb: 2 },
  walker: { mph: 1.2, climb: 6 },
  cane: { mph: 1.5, climb: 5 },
  walking: { mph: 2.5, climb: 3 },
  bike: { mph: 7, climb: 2 },
  stroller: { mph: 2.2, climb: 4 },
  other: { mph: 2, climb: 5 },
  default: { mph: 2, climb: 5 },
};

/** About how long the whole trail takes at your pace (How you go), else a typical one: "40 min", "1 h 20 min".
 *  Rounded to 5 minutes (10 past an hour), since it's an estimate. */
export function trailTime(trail: Trail, mine?: Mobility) {
  const pace = PACE[mine?.aid ?? 'default'];
  const raw = (trail.miles / pace.mph) * 60 + (trail.gainFt / 100) * pace.climb;
  const step = raw < 60 ? 5 : 10;
  const m = Math.max(5, Math.round(raw / step) * step);
  return m < 60
    ? `${m} min`
    : `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')} min` : ''}`;
}
