// Design tokens. The auth screens came from the Figma file (BORP › "creating an account"); the rest were
// added as the app grew. Every colour in the app lives here, named by what it's for: screens and components
// never write a hex or rgba of their own (the one exception is the Google logo, whose colours are Google's).

export const colors = {
  navy: '#151752', // brand, welcome background, links
  navyPressed: '#0b0c33', // a navy button while pressed
  navyFaint: 'rgba(21,23,82,0.15)', // the empty track of a navy progress ring
  ink: '#000000', // primary text, primary button
  stone: '#343330', // icons
  muted: '#7a7b78', // subtitles, helper text
  // Text steps are black at falling opacity, so greys stay neutral and layer cleanly. Lighter steps than
  // before so the hierarchy reads at a glance (close to iOS label colours): secondary 5:1 (supporting
  // text, still AA), tertiary 3.4:1 (captions, units, dates; like iOS secondaryLabel), quaternary for
  // chevrons, placeholders and resting glyphs that aren't text to read.
  secondary: 'rgba(0,0,0,0.56)',
  tertiary: 'rgba(0,0,0,0.45)',
  quaternary: 'rgba(0,0,0,0.26)',
  hairline: 'rgba(0,0,0,0.1)',
  chartBar: 'rgba(0,0,0,0.14)', // a chart's quiet bars (inside the guideline), so the ones over it stand out in black
  // True neutral: the old #f2f2f4 leaned blue and read lilac beside warm trail photos
  fill: '#f2f2f2', // quiet filled controls: chips, steppers, search field, photo placeholders
  pressed: '#e8e8e8', // a filled control (or a map waiting to load) one step darker: pressed chips and pills
  wash: 'rgba(0,0,0,0.06)', // pressed or selected on glass, where a solid fill would hide the blur
  previous: '#dcdcdc', // the last survey's answer on a chip: a step darker than pressed, so it never looks mid-tap
  previousPressed: '#d0d0d0',
  placeholder: '#c4c4c4', // a number not read yet (the stepper and the empty slope reading)
  selection: '#747474', // text cursor and selection in fields
  avatar: '#a7a7a7', // the placeholder person in the dock before you add a photo
  line: '#bdbdbd', // input + card borders
  disabled: '#cecece', // disabled button
  fieldReadonly: '#f6f6f6',
  tint: '#f7f8ff', // soft navy panels
  ok: '#018530', // password rule met
  error: '#c4320a', // not in Figma yet: wrong-password state
  recording: '#d92d20', // live recording only: the mic, the dot, the timer
  recordingTint: '#fdecea', // behind a control while it records
  lastSurvey: '#707070', // the last survey's spots on the session map: the grey inverse of your pins
  soft: '#f9f9f9', // secondary button
  legal: '#c6c6c6', // welcome legal text
  eye: '#9b9b9b',
  white: '#ffffff',
  heart: '#ff385c', // a saved trail's heart, the one red outside recording (Airbnb-style)
  shadow: '#000000',
} as const;

/** See-through layers over photos, maps and the dark photo viewer. */
export const overlay = {
  scrim: 'rgba(0,0,0,0.35)', // the dark fill behind a white glyph on a photo: the card heart, the photo arrows
  glyphShadow: 'rgba(0,0,0,0.45)', // the drop shadow that keeps a bare white glyph readable on a photo
  backdrop: 'rgba(0,0,0,0.28)', // behind an alert
  veil: 'rgba(255,255,255,0.7)', // a white wash that fades a map or photo back (offline download, a busy form)
  dot: 'rgba(255,255,255,0.6)', // a photo dot that isn't the current one
  textOnDark: 'rgba(255,255,255,0.7)', // secondary text on black (photo credits, a chosen chip's number)
  fillOnDark: 'rgba(255,255,255,0.16)', // a button on black (the photo viewer's close)
} as const;

/** The glass and frost materials (src/components/Glass/Glass.tsx). */
export const material = {
  glassFallback: '#f0f0f0', // glass with Reduce Transparency on, matching the original Figma pill
  glassRim: 'rgba(255,255,255,0.7)', // a light rim so a frosted edge reads against white
  frostLight: 'rgba(255,255,255,0.97)', // a light bar where there's no blur
  frostDark: 'rgba(0,0,0,0.5)', // a dark label where there's no blur
  frostDarkSolid: 'rgba(20,20,20,0.88)', // a dark label with Reduce Transparency on
  frostDarkTint: 'rgba(0,0,0,0.38)', // over the dark blur, so white text reads on a bright photo
} as const;

/** iOS's own colours, for the prototype's stand-in system location alert (src/features/trails/location-access). */
export const ios = {
  blue: '#0a84ff',
  alert: '#f6f6f6',
  alertText: 'rgba(0,0,0,0.75)',
  alertButton: 'rgba(120,120,128,0.14)',
  alertButtonPressed: 'rgba(120,120,128,0.26)',
  badge: 'rgba(255,255,255,0.92)',
  mapLand: '#eef0eb',
  mapPark: '#d8ead0',
  mapHighway: '#fde7a7',
} as const;

// Added for the trail screens (not in the auth Figma frames yet): map colours.
export const trailColors = {
  mapLand: '#f2f4ef',
  mapLine: '#dde2d6', // contour
  mapIndex: '#cdd4c5', // every 5th contour
  mapWood: '#e5ecdd',
  mapWater: '#d6e6ee',
  mapLabel: '#858c80',
  mapWaterLabel: '#6f8f9e',
} as const;

// SF Pro is the iOS system font, so no fontFamily is needed there.
// Figma weights 510 / 590 map to the nearest available system weights.
export const type = {
  // The app's text system (DESIGN.md › Type)
  /** Page title and the trail or person's name: 28 semibold (bold read too thick). */
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.ink,
  },
  /** The frosted bar's title once the page title scrolls away. */
  barTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  /** Quiet caption over a group: the content under it is the headline. */
  caption: { fontSize: 13, fontWeight: '600', color: colors.tertiary },
  /** Section titles on the profile: big enough to hit with a thumb where they're links. */
  sectionHeading: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  /** An empty list's one line, above its one action. */
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  /** A row's name: a trail, a chair, a survey. */
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.ink,
  },
  /** The line under a row's name. */
  rowDetail: { fontSize: 15, lineHeight: 20, color: colors.secondary },

  // The auth screens, measured from Figma
  sectionTitle: { fontSize: 28, fontWeight: '600' },
  subheader: { fontSize: 14, fontWeight: '400', color: colors.muted },
  label: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
  input: { fontSize: 15, fontWeight: '400' },
  description: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.2,
    color: colors.muted,
  },
  button: { fontSize: 15, fontWeight: '500' },
} as const;

/** Side padding of every screen after sign-up (the auth screens use layout.authGutter). */
export const GUTTER = 24;

// Layout constants measured from the 402pt-wide Figma frames.
export const layout = {
  authGutter: 22, // auth screens' side padding
  navInset: 16, // back / close button inset
  headerTop: 73 - 62, // nav button top, below the 62pt status bar
  contentTop: 160 - 62, // title block top, below the status bar
  fieldHeight: 47,
  buttonHeight: 47.41,
  /** Compact top bar under the status bar: a 44pt round button with 6pt above and below. */
  barHeight: 56,
} as const;

/** Shadows, by what casts them. Spread one into a style; override the offset if it casts upward. */
export const shadow = {
  /** Floating glass and sheets: soft and wide. */
  float: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  /** Something resting on a photo or map: the inset route map, the photo markers on your map, your photo. */
  raised: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  /** A pin on the map: small and close. */
  pin: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
} as const;

/**
 * Springs. Bounce once, and only when something arrives (a pin lands, a check appears, a menu opens);
 * anything that slides or resizes glides in with no overshoot. Reanimated 4's defaults are heavy
 * (mass 4, stiffness 900), so a spring given only `damping` wobbles ten times or more: use these instead.
 * withSpring(to, spring.pop) · ZoomIn.springify(spring.pop.duration).dampingRatio(spring.pop.dampingRatio)
 */
export const spring = {
  /** One small overshoot, then still. */
  pop: { dampingRatio: 0.65, duration: 420 },
  /** Settles without overshooting. */
  glide: { dampingRatio: 1, duration: 380 },
} as const;
