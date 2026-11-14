// Phosphor-style line icons for the prototype screens, drawn to match the Figma icon set (24 grid, round
// caps). Each glyph is an .svg in src/icons; this picks one by name and sets its size, colour and weight.
import type { Aid } from '@/features/account/AccountProvider';
import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';
import Back from '@/icons/back.svg';
import Battery from '@/icons/battery.svg';
import Bell from '@/icons/bell.svg';
import Bike from '@/icons/bike.svg';
import Book from '@/icons/book.svg';
import Camera from '@/icons/camera.svg';
import Cane from '@/icons/cane.svg';
import Chat from '@/icons/chat.svg';
import Check from '@/icons/check.svg';
import Cross from '@/icons/cross.svg';
import Directions from '@/icons/directions.svg';
import Download from '@/icons/download.svg';
import Edit from '@/icons/edit.svg';
import Exclaim from '@/icons/exclaim.svg';
import Eye from '@/icons/eye.svg';
import Flag from '@/icons/flag.svg';
import Gear from '@/icons/gear.svg';
import Help from '@/icons/help.svg';
import History from '@/icons/history.svg';
import Image from '@/icons/image.svg';
import Level from '@/icons/level.svg';
import Locate from '@/icons/locate.svg';
import Lock from '@/icons/lock.svg';
import Mail from '@/icons/mail.svg';
import ManualChair from '@/icons/manual-chair.svg';
import Mic from '@/icons/mic.svg';
import More from '@/icons/more.svg';
import Next from '@/icons/next.svg';
import Parking from '@/icons/parking.svg';
import Pause from '@/icons/pause.svg';
import Person from '@/icons/person.svg';
import Pin from '@/icons/pin.svg';
import Play from '@/icons/play.svg';
import Plus from '@/icons/plus.svg';
import PowerChair from '@/icons/power-chair.svg';
import Recent from '@/icons/recent.svg';
import Restroom from '@/icons/restroom.svg';
import Rock from '@/icons/rock.svg';
import Scooter from '@/icons/scooter.svg';
import Search from '@/icons/search.svg';
import Send from '@/icons/send.svg';
import SignOut from '@/icons/sign-out.svg';
import Sign from '@/icons/sign.svg';
import Slope from '@/icons/slope.svg';
import Sort from '@/icons/sort.svg';
import Storage from '@/icons/storage.svg';
import Stroller from '@/icons/stroller.svg';
import Surface from '@/icons/surface.svg';
import Surveys from '@/icons/surveys.svg';
import Tape from '@/icons/tape.svg';
import Trails from '@/icons/trails.svg';
import Trash from '@/icons/trash.svg';
import Upload from '@/icons/upload.svg';
import Walker from '@/icons/walker.svg';
import Walking from '@/icons/walking.svg';
import Water from '@/icons/water.svg';
import Wheelchair from '@/icons/wheelchair.svg';
import Width from '@/icons/width.svg';
import X from '@/icons/x.svg';
import { colors } from '@/styles/theme';

const GLYPHS = {
  search: Search,
  pin: Pin,
  locate: Locate,
  recent: Recent,
  history: History,
  trails: Trails,
  surveys: Surveys,
  width: Width,
  slope: Slope,
  cross: Cross,
  surface: Surface,
  rock: Rock,
  parking: Parking,
  restroom: Restroom,
  sign: Sign,
  water: Water,
  mic: Mic,
  camera: Camera,
  download: Download,
  tape: Tape,
  battery: Battery,
  chat: Chat,
  pause: Pause,
  play: Play,
  help: Help,
  flag: Flag,
  trash: Trash,
  edit: Edit,
  level: Level,
  back: Back,
  sort: Sort,
  image: Image,
  gear: Gear,
  person: Person,
  next: Next,
  bell: Bell,
  signOut: SignOut,
  upload: Upload,
  lock: Lock,
  eye: Eye,
  storage: Storage,
  book: Book,
  send: Send,
  check: Check,
  x: X,
  plus: Plus,
  wheelchair: Wheelchair,
  directions: Directions,
  mail: Mail,
  exclaim: Exclaim,
  manualChair: ManualChair,
  powerChair: PowerChair,
  scooter: Scooter,
  walker: Walker,
  cane: Cane,
  walking: Walking,
  bike: Bike,
  stroller: Stroller,
  more: More,
} satisfies Record<string, FC<SvgProps>>;

export type IconName = keyof typeof GLYPHS;

/** The glyph for each way of going on trails. */
export const AID_ICON: Record<Aid, IconName> = {
  manual: 'manualChair',
  power: 'powerChair',
  scooter: 'scooter',
  walker: 'walker',
  cane: 'cane',
  walking: 'walking',
  bike: 'bike',
  stroller: 'stroller',
  other: 'more',
};

/**
 * Where a glyph looks centred, for glyphs whose drawing doesn't fill the 24 grid evenly (the cross slope
 * sits in the bottom half, the rock on a ground line). Measured from each glyph's bounds, nudged towards
 * its weight for the triangle. Glyphs not listed already look centred at 12, 12.
 */
const OPTICAL_CENTER: Partial<Record<IconName, [number, number]>> = {
  slope: [13, 14],
  cross: [12, 16],
  surface: [12, 10.75],
  rock: [12, 15],
  flag: [11.4, 12.5],
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Shift the glyph so it looks centred in a round container (pins, badges), instead of keeping its baseline. */
  optical?: boolean;
};

export function Icon({
  name,
  size = 20,
  color = colors.stone,
  strokeWidth = 1.6,
  optical = false,
}: IconProps) {
  const Glyph = GLYPHS[name];
  const [cx, cy] = (optical && OPTICAL_CENTER[name]) || [12, 12];
  return (
    <Glyph
      width={size}
      height={size}
      viewBox={`${cx - 12} ${cy - 12} 24 24`}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}

const LOCATE = 'M20.5 3.5 3.5 10.6l7.4 2.5 2.5 7.4z';
const HEART =
  'M12 20.25 4.9 13.3C3.55 11.98 2.75 10.5 2.75 8.75A4.75 4.75 0 0 1 7.5 4c1.75 0 2.95.62 4.5 2.15C13.55 4.62 14.75 4 16.5 4a4.75 4.75 0 0 1 4.75 4.75c0 1.75-.8 3.23-2.15 4.55z';

type GlyphProps = Omit<IconProps, 'name' | 'optical'>;

/** Heart for saved trails: outline to save, filled once saved. `fill` paints the inside a different colour from the outline. */
export function Heart({
  filled = false,
  fill,
  size = 20,
  color = colors.stone,
  strokeWidth = 1.7,
}: GlyphProps & { filled?: boolean; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={HEART}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={fill ?? (filled ? color : 'none')}
      />
    </Svg>
  );
}

/** Location arrow struck through, for "location is off". `knockout` is the surface colour, so the slash cuts a gap in the arrow. */
export function LocateOff({
  size = 20,
  color = colors.stone,
  knockout = colors.white,
  strokeWidth = 1.8,
}: GlyphProps & { knockout?: string }) {
  const common = {
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={LOCATE} stroke={color} {...common} />
      <Path
        d="M3.5 3.5 20.5 20.5"
        stroke={knockout}
        {...common}
        strokeWidth={strokeWidth + 3}
      />
      <Path d="M3.5 3.5 20.5 20.5" stroke={color} {...common} />
    </Svg>
  );
}
