# BORP design guidelines

How this app should look and feel, learned while redesigning the trail list, trail page, Get ready and
the pin flow. Read this before touching any screen. When a rule here and a habit disagree, the rule wins.

BORP is a field instrument for surveying trail access with a wheelchair in mind, often with no signal,
gloves on, in bright sun. It should feel closer to Apple Maps, Apple Health or Strava than to a dashboard,
and it should look unmistakably like BORP, not like AllTrails: our edge is _access data_, so show it where
it's used (the trail page, the survey), not crammed onto every list card.

> In this repo the prototype lives under `/prototype` (`src/app/prototype/`). Its trail photos and Apple Maps
> snapshots are neutral placeholders (`assets/placeholders/`), so where this asks for real imagery, the
> placeholders stand in until the real photos and maps are cleared to publish.

---

## 1. Show, don't tell

The single biggest difference between "crafted" and "template" here is the amount of text.

- **If the user can understand it without words, use no words.** An icon, a position, a format
  (`42 in`, `7.2%`), a picture or the content itself usually explains better than a label.
- **Before adding any label, heading or helper line, ask:** is it redundant with the icon/position/
  content? → remove it. Can a visual say it faster (map, photo, chart, number with units)? → use that.
  Still needed? → make it as short as possible.
- **No explainer sentences** under titles, inside cards or under buttons ("Trails often have no signal…",
  "Tip: …", "The last survey flagged these 3…"). If the heading already says it, the paragraph goes.
- **Never repeat what's right next to it.** A title doesn't repeat the step label; a caption doesn't
  repeat the status; the button doesn't repeat the title.
- **Don't show empty or zero noise** ("0 trails", "No photos or notes on this pin"). Hide it, or show the
  one useful action.
- **Keep words a first-time user would get lost without** (this goes into usability testing): one-line
  how-tos for first surveys, "No access data yet". Not the step count: Get ready and the trailhead show
  three bars across the page, and with only three steps "1 of 3" was obvious (VoiceOver still reads it).
- **Words that visuals leave out go to the screen reader.** Every icon-only reading or mark carries a full
  `accessibilityLabel` ("Narrowest 42 inches, worth re-checking").

## 2. Visuals carry the meaning

- **Real imagery, never decoration.** Every trail has a real photo (scenery, vibe) and a real Apple Maps
  snapshot of its route (shape, place). A picture that's the same on every row is decoration: remove it.
- **Maps say "this is about maps."** The offline download shows the actual map, faded under a veil that
  pulls back as it downloads. The survey session walks the real route on a real map.
- **Photo and map trade places on cards:** the route map sits in the photo’s corner; tapping it swaps them. On the trail page the map is its own section instead.
- **Every trail's photos swipe, on cards and the trail page,** with Airbnb's white dots (current one solid), not a
  "1 / 5" count. Arrows come out only when you reach for the photos (any touch, swipe or mouse hover, and once as
  the trail page opens) and fade after 3 idle seconds, for anyone who can't swipe reliably. They're small (28pt)
  white chevrons on a see-through dark fill, like the card heart, centred in the visible photo: white glass
  arrows competed with the page's Back and save buttons. No long press for them: a slow tap must still open
  the trail. VoiceOver gets Next/Previous photo as card actions (`src/components/PhotoPager/PhotoPager.tsx`).
- **Use a chart when it shows _where_ or _how much_ better than a number** (grade along the trail, with the
  5% guideline). Thin bars, one hue, a quiet guideline, drag to read a value. Not a chart for decoration.
- **Big number, small unit** for every measurement: `42` large, `in` small. Never a label/value table.
- Content is realistic Bay Area data (Tilden, Muir Woods, Lands End…). Anything generated for the
  prototype is marked in code comments (e.g. the grade profile) so nobody mistakes it for survey data.

## 3. Color

One neutral palette, one accent, nothing else. Tokens live in `src/styles/theme.ts`.

| Role                    | Token                                | Use                                                                                                                                 |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Primary text            | `colors.ink` (black)                 | Names, values, the one thing to read                                                                                                |
| Secondary               | `colors.secondary` (black 56%, 5:1)  | Supporting text: park, location, details                                                                                            |
| Tertiary                | `colors.tertiary` (black 45%, 3.4:1) | Captions, units, dates, "Up to date", "was 7.2%"                                                                                    |
| Quaternary              | `colors.quaternary` (black 26%)      | Chevrons, grabbers, resting glyphs (never text to read)                                                                             |
| Fill / hairline         | `colors.fill`, `colors.hairline`     | Filled controls and pressed rows (`#f2f2f2`, pressed `#e8e8e8`: true neutral, no blue cast; the old `#f2f2f4` read lilac); dividers |
| Accent                  | `colors.navy`                        | Things that need you, interactive icons, selection. Not route lines: routes are black                                               |
| Destructive / recording | `colors.error`, `RED`                | Delete, live recording only                                                                                                         |
| Saved                   | `colors.heart` (Airbnb-style red)    | A saved trail's heart fill, nothing else                                                                                            |

- **No yes/no "accessible" verdict.** Show the measurements and how they compare with the guideline;
  whether a trail works depends on the person and how they go, and volunteer surveys aren't approved yet.
- **No status hues.** No green "ok", no amber "warning", no pastel tints, no per-category colors.
  The user called them tacky, and they were.
- **Status is a word + emphasis, not hue.** "Not surveyed" / "Resurvey due" is a navy word; "Up to date"
  recedes to grey. No glyph beside it: the word already says it, and the user found the extra icons noisy.
- **Outside a guideline? Say how, in words — no warning glyph.** "Over 5%" in navy under "Steepest";
  "2.5 in high, over 2 in"; "Narrower than 36 in" on a pin. The old navy warning triangle meant three
  things at once (re-check, fails the guideline, changes requested), explained none of them, and the user
  found it confusing. Where the words already say it ("No access info", "No van space"), add nothing.
- **Never color alone.** Every state pairs color with a word and/or a glyph shape.
- **Let the greys be light enough to show hierarchy.** Black for the thing to read, then clearly lighter
  steps (close to iOS label colours). Dark greys everywhere flatten the page — the user called it out.
  Use the tokens, not one-off `rgba(0,0,0,…)` values. Secondary stays ≥ 4.5:1 for supporting text.
- **Don't use too many greys.** Black + the token steps. More tones read muddy.
- **Keep navy rare, or it turns tacky** (the user's word). On the trail page it's only the status word and
  the "Over 5%" words. Routes, the grade chart's bars, content icons and inline actions are black. The one
  exception is "Set how you go on trails" before anything's set: it's the thing on the page that needs you. Small changes in weight, size and colour did more for this page than any new element.

## 4. Type

- **Four styles a screen, at most:** title (28 semibold — bold read too thick, the user matched every title to the profile name), name/heading (17 semibold), body (15 regular),
  caption (13). Numbers that matter: 24–32 semibold, tabular, with a 15–17 unit.
- **Quiet captions, not big section headers:** 13 semibold tertiary ("At the trailhead", "Re-check first").
  The content under it is the headline.
- **Status position:** on a list card it's a white pill on the photo, like Airbnb's "Guest favourite", and
  only when the trail needs a survey; up-to-date trails have none. A 4th text line under the card read as
  awkward and easy to miss. On the trail page and in compact lists it's a small eyebrow above the name (13 medium).
- Sentence case everywhere. No ALL CAPS, no underlines (links are navy semibold text).

## 5. Layout and surfaces

- **No boxes.** No card around every piece of content, no tiles with outlines, no tinted panels.
  Group with whitespace and hairlines (`StyleSheet.hairlineWidth`, black 12%).
  A box is allowed only when it _is_ the thing (a photo, a map, a big tap target in the pin sheet).
- **Few layers.** Count the stacked bands before the content starts; if there are more than ~3
  (search, one context row, content), merge or remove. Combine related controls into one row
  (location + sort share a row).
- **No title when the content says what the page is** (the Trails list opens on "Search trails").
- 24pt gutters, 4/8pt spacing; related things close, unrelated things get real space.
- Pressed rows highlight full-bleed (`#f2f2f2`), not with opacity on text.
- Primary actions at the bottom in thumb reach, on a frosted bar.
- **No small print under the bottom button** ("Works offline", "Answer 2 more to continue", "Sent as…").
  The button stands alone; anything it can't say goes in its `accessibilityHint`.

## 6. The trail page is a system, not a poster

Each section answers one question, in the order a person asks them; one headline each, details one tap deeper.
The user found the old page (length, then gain, then readings, chart, rows, grid, history) overwhelming.

1. **What is it?** Swipeable photos (Airbnb dots, arrows when you reach for them, tap for full screen with credits); the page's white
   sheet rides up over the photo's bottom edge on 24pt rounded corners, status with the
   survey month, name, `park · 1.2 mi trail`. Nothing else.
2. **Can I do it?** The readings compared with **how you go** (Profile → How you go on trails: manual
   wheelchair, power wheelchair, scooter, walker, cane or crutches, stroller, walking, bike, or Other, which they name themselves; each fills in starting limits the person nudges).
   People can keep several (an everyday chair and a power chair for longer trails) and pick the one in use.
   **The caption is the answer and the link:** "✓ Within limits for your chair ›" or navy ✗ "Outside limits
   for your chair ›" (own name: "…for Trail chair"; walking: "…for you"), black, 13 semibold like every caption, opening the How
   you go list. Not set → a wheelchair glyph + "Set how you go on trails ›", navy 17 semibold so it's noticed
   (13 black was easy to miss), going straight to adding the first one (no list with just an Add row);
   the words compare with the guideline until then. No button beside it
   (a pull-down was tried and dropped), and no separate verdict line: a headline between caption and numbers,
   badge or not, read as an abrupt jump in size and weight. Readings that don't apply drop out (no width for a cane or walking).
   **Then the evidence.** Each reading is a number + one word line, never a second comparison line: fine ones just say what they are (Narrowest /
   Steepest / Cross slope, grey; the caption's ✓ covers them), the one that's over repeats the navy ✗ and
   says what's wrong ("✗ Too steep", also Too narrow, Tight fit, Too tilted). Tried and dropped: navy words
   alone (too quiet), a ✓ on every fine reading plus a navy pill on bad ones (no single answer; ✓/✗ pair is
   more consistent). It's "within your limits", never "you can go": the decision stays theirs. No limit numbers on screen ("Over your 8.3%" meant nothing to people
   who picked "Moderate"); VoiceOver still reads them.
3. **Where are the tricky parts, how do I get there?** One map section (a box is fine: it _is_ the map) framed
   on the route, black route (white casing) from a white trailhead dot with a black ring, a pin per flagged spot; the list under it mirrors the
   pins (same bubble, small) with dividers inset from the text, like iOS lists. Distance from you + a **Directions** pill → Apple Maps / Google Maps, which
   show the drive time from home. No small map inset on this page.
4. **What's at the start?** Parking, restroom, water, three across, as black 24pt line icons (Airbnb's amenities). Not the sign: that's for surveyors, re-checked in the survey.
5. **More** — a full-bleed chevron row to "Grade and surface" (chart with the 5% line, surface, obstacles),
   previewing the surface ("Boardwalk, gravel"), not the gain: paved vs gravel decides more than feet climbed,
   in a chair or on foot. No guideline table there: the chart and the "over 2 in" words already carry it.

**The "so what?" test:** every piece must change what someone does next (go or not, where to turn back,
where to park, bring water). "Past surveys" (date, who, pin count) failed it and was removed: the date that
matters is already on the status line, and a pin count means nothing to anyone. If history ever comes back,
it's as a change beside the reading it changed ("was 8.1%"), not as a log.

### The profile is the same system

The user found the first profile "templatey, poster, low craft" (avatar + gear, a stat row, plain lists).
It now works like the trail page (`src/features/account/home/`):

- **Your map is the hero, not a stat row.** One real Apple Maps snapshot of the Bay
  (`src/data/bay-map.ts`) with each surveyed trail as its **photo** in a
  round white-rimmed marker (Apple Photos' Places). Tap one to open that survey; the one BORP sent back
  wears the navy "!". Same parallax and stretch as the trail photo; a frosted bar with your name slides
  down once it scrolls away; settings is a glass gear (floating control).
- **You:** photo overlapping the map's bottom edge in a white ring, name (28 **semibold**: bold read too
  thick), then one line (`Volunteer since Apr 2025 · 6.5 mi surveyed`). No 3-number stat row.
- **One text system on the profile:** names 17 semibold black (15 on Saved cards), everything under them
  15 regular secondary, section titles 20 semibold black. Navy only for "Changes requested". The user
  called out mixed greys and weights (13 medium eyebrows next to 15 regular lines, 13 tertiary card meta).
  Section titles were 13 grey captions; the user asked for them bigger so "Surveys ›" and "Saved ›" are easy
  to hit with a thumb (44pt row plus hit slop).
- **Order:** you, then How you go on trails (every trail page compares with it), then Surveys, then Saved.
- **Surveys: what needs you first** (paused survey with Resume), then newest first. Trail name, then the
  status as the last line (`In review · Oct 25`), **no status glyphs** (no clock, check or "!" beside it: the
  word says it). "Changes requested" is navy with the start of BORP's note under it instead of the date.
  The profile shows the first three; once there are more, "Surveys ›" opens them all (`src/features/account/surveys/`).
- **How you go on trails:** only the one in use (`Everyday chair` / `Fits 32 in · up to 8.3% · 2% tilt`),
  one row, led by its kind's black line icon (manual wheelchair, power wheelchair, scooter, walker, cane, stroller, walking, bike, ••• for Other:
  `AID_ICON`), since a name of their own ("Trail chair") may not say what it is. Tap → a list of everything
  they've added, each with its icon, like Wi-Fi networks: tap a row to use it (navy check),
  the pencil to edit, "Add another" at the end. The edit page has an optional name (tells two chairs apart)
  and Remove. **Limits are everyday comparisons, not numbers:** nobody (least of all a new volunteer) knows
  their comfortable grade in percent. Width asks for the chair's (walker's) **own** width, a fact they can
  measure (? → "Measure the widest point, usually wheel to wheel"), prefilled with a typical one; trails add
  room for hands. Slopes are Gentle / Moderate / Steep and Slight / Moderate / Strong, each over the slope
  drawn as the survey's Level line (1% ≈ 2°), number small underneath. Tried and rejected: place names
  ("building ramp", "driveway crossing", "grassy bank") and doors for width ("doors let everyone through"). Picking the chair type pre-picks typical answers, so Save works right away.
  No steppers. Nothing set → one row, + "Add yours", straight to the edit page.
- **Saved: Airbnb wishlist cards** — square photos you swipe through, bare heart to unsave,
  `1.5 mi trail · 14 mi away` (the park name is too long for a card).
  The "Saved ›" title is the link (black with a chevron, like the trail page's caption links) to the
  Saved page: the same cards two across, newest first (`src/features/account/saved/`).
- **Sub-screens** (`SubScreen`): 32 bold large title that tucks into a frosted bar on scroll; settings are
  quiet captions over hairline rows, no outlined cards, one short detail line only where a first-timer would
  guess wrong.
- **A survey you sent:** the three steps (black dots: white check when done, white "!" at the same weight
  when BORP asked for a change, black ring for now; no navy) with BORP's note as a grey message bubble on the step it came with
  (a person talking: the bubble _is_ the thing), then the route with your pins and the list mirroring it,
  then trailhead answers as icon + answer (no label column). `2.4 mi · 52 min · 7 pins` under the title.

## 7. Components (reuse these)

- **Never write a colour, shadow or side padding in a screen.** Colours are named by role in `src/styles/theme.ts`
  (`colors`, `overlay` for layers on photos, `material` for glass, `ios` for the fake system alert), shadows are
  `shadow.float / raised / pin`, text styles are `type.title / caption / rowTitle / rowDetail…`, padding is `GUTTER`.
  A new colour gets a token with a comment saying what it's for. The one exception is the Google logo.
- **Screen chrome** (`src/components/`): `GlassBackButton`, `TitleBar` (the frosted title that slides down
  on scroll), `BottomBar` (the frosted bar for the main action). `SubScreen` and `SurveyLayout` are built from them.
- **Lists** (`src/components/List/List.tsx`): `Section` (`variant` caption | heading; `onPress` makes the title a
  link; `invite`, `lead`, `aside`), `ListRow` (full-bleed row with the pressed fill; `divider` inset | full),
  `Chevron`, `divider` (hairline style), `EmptyState` (one line + one big button).
- **`ActionButton`** has `variant` (primary | soft) and `size` (regular | large: the 56pt bottom and capture button).
  A one-off copy of any of these in a screen is a bug: it drifts, and the Figma export can't connect it.
- **`TrailCard` / `TrailMedia`** — photo with route-map inset (tap to swap), a bare save heart top-right (white
  outline, see-through dark fill, drop shadow, red once saved, no circle behind it, like Airbnb), the status as a white pill top-left (dark text, soft shadow: `Resurvey due`, `Not surveyed`, `New · Not
surveyed`) only when the trail needs a survey, then three short lines like an Airbnb card: name,
  `park · 14 mi away`, `1.2 mi · 40 min · Boardwalk` (length, about how long at your How you go pace, surface:
  known even before a survey). "away" keeps the two distances apart; the user found two bare "mi" confusing. The last
  survey's month waits on the trail page. **No access readings on the card** (no `42 in · 7.2%`, no "No access data yet"): icons like ⟷
  and ⊿ didn't explain themselves. The readings live on the trail page.
- **`StatusLabel`** — the status word; navy when it needs a survey, grey when up to date. No glyph. Pass
  `since` to add "· surveyed Mar 2023" in grey (trail page). Cards show the status as a photo pill instead.
- **`GuidelineMark`** — navy check for meets it; nothing when it doesn't (the verdict words say how).
  **`AttentionMark`** (navy circle "!") is only for a survey BORP sent back: its marker on the profile map.
  Its step in a sent survey uses the black step dot with an `exclaim` glyph instead, so it matches the
  check beside it (the old mark's "!" was visibly heavier). Not beside the "Changes requested" word in lists: the navy word is enough.
- **`Frost`** (bars, labels, sticky headers, toasts) and **`Glass`** (floating controls, tab bar).
  `RoundButton` is a 44pt glass circle.
- **Buttons:** primary = black pill (56pt for capture actions: Start survey, Drop pin, Next, Save pin);
  secondary = `PillButton`, grey fill + **black** label, the same fill as chips (Download, Resume, Turn On —
  never a navy label on a filled button); tertiary = navy text; quiet = grey text ("Couldn't measure").
  Every button has pressed, disabled and loading states. A bottom button waiting on steps passes
  `progress`: it fills as they get done and its label counts them ("2 of 4 answered") until it unlocks.
- **Chips** — single choice, black once chosen (`MultiChips` when more than one can be true, e.g. a trail's surfaces). Chips are always
  their natural width, same padding everywhere (never stretched to fill a row). With long labels ("Manual wheelchair"), order the
  options so each row ends about the same distance from the edge, rather than one short row and one full one. "Other" opens a text field right under the chips. Pass `clearable` so tapping the chosen one clears it. On a
  resurvey pass `previous`: the option the last survey picked is shaded a darker grey (`#dcdcdc`, no ring:
  the black outline read heavy) with a clock-turning-back glyph, so it's never grey alone. No "Last time"
  caption on the chip; instead one line under the step title on a resurvey-due trail ("The last survey's
  answers are shaded."), since a first-timer can't guess what the shading means. Pick the same one and the
  glyph turns white in the fill; pick another and the shaded one stays beside it, so the change shows. Help for a question is a ? beside its name that opens a one-line how-to,
  not a "How to tell" link.
- **Checklists** (Bring) — a ticked item is struck through and greyed, like a done reminder.
- **Pins** — two states, one look. **At rest** a 42pt white circle (black rim, black glyph for the pin kind,
  soft shadow) sits right on the spot. **Selected** the same white circle lifts off the spot and a small solid
  black triangle appears under it, pointing down at a black dot (white ring) left on the exact spot, with a
  few points of air between. It doesn't change colour or size: the lift, the triangle and the dot say "this
  one" (the user preferred the white bubble to a black selected fill). One bounce (`spring.pop`), a jump with
  Reduce Motion. Black "!" badge when it fails; dashed rim and a mic while it still needs details. Arrives by
  dropping onto its spot. Lists that mirror the map keep the small speech bubble (circle + triangle,
  `PinBubble`), and a pin row shows its photo at the end instead of "1 photo". The trail page opens with its
  first spot selected. Glyphs in pins are optically centred (`<Icon optical />`): cross slope, rock, grade,
  surface and flag don't fill their 24 grid evenly, so frame-centred looks off.
- **Last survey's spots** (survey session) — what the last survey flagged sits on the map where it was, as
  the inverse of your pins: a solid grey circle (`LAST_SURVEY`, #707070) with a white glyph, never navy.
  Selected, it lifts into the same bubble + tail. It leaves once a pin of yours covers it. Its re-check
  row leads with the same grey disc, so row and map read as one thing; tapping either shows it on the map
  (tap again to follow you). Reaching one while recording brings a frosted banner (`Steepest stretch` /
  `Here last survey` / black **Pin it** / ×) that drops a pin with the kind already picked. "What's here?"
  tiles carry no "Re-check" labels: the map already says it.
- **Slope reading** — like Apple's Level: the big number, then one thick black line that tilts with the
  reading (exaggerated, uphill lifts the right end). No phone drawing, no bubble, no box. Before a reading
  the number is a greyed `0.0%` (the stepper's placeholder grey), not a dash: you see where the number lands.
- **Voice notes are tap to start, tap to stop** (`TapToRecord`), never press and hold: holding is hard with
  gloves or an unsteady hand, and a slip cut the note short. Recording, the mic turns red with a white stop
  square and a live time; leaving mid-note keeps it. Photo, library and voice are three equal tiles in a row
  on "Show what you saw" (library used to be a navy link under two tiles).
- **Dock** (iOS 26 style) — Home/Profile in one glass pill, centred (in reach of either thumb, the same spot
  on every tab), with a sliding selection and filled icon. On Trails, the navy-tinted glass `+` sits apart at
  the right, so it reads as an action, not a third tab. It's
  **always open**: it never shrinks on scroll, since a dock that hides itself confuses people new to the app.
  Home and Profile are real tabs (`src/app/prototype/(tabs)/`): the screen swaps instantly, no fade, while the
  selection slides; each tab keeps its scroll position.
- **Search** is pinned and the list scrolls under it, so it's a floating control: **glass, the same as the
  dock**. Under it, the list's controls are **plain words** (below). Floating = glass, on the page = words: no
  second material to match or clash. It never scrolls away and comes back as a different control.
  (Tried, all on 2026-11-04: grey search over the fade read as a second floating bar in another material;
  glass search + grey pills didn't match; all glass was heavy; grey search + grey pills on a solid white bar
  was the standard and clearer for first-timers, but the user preferred the look of glass + words. Known
  trade-off: bare words are a weaker tap cue, so watch for it in usability tests.)
- **One row of pull-down words under search, not bands of controls**: tappable black words with a `⌄`, no
  fill (like the sort label in Mail or Photos), for place (`◎ Berkeley ⌄`), which trails (`All trails ⌄`) and
  order (`⇅ Nearest ⌄`). All three behave the same: no black capsule when the filter narrows the list (the
  user wanted it to match the sort dropdown); the word ("Resurvey due") already says what's showing. The row scrolls sideways if it runs out of room. Each opens a glass pull-down
  from its button with a check by the current option — not an action sheet, not an always-open segmented
  control.
- **Controls morph with what you're doing.** Once the row slides under the search field, the status
  filter docks into the search row as a glass chip ("Resurvey due ⌄", plain glass like the search field)
  while the field narrows to make room — one pinned row, not two. The chip opens the same pull-down.
  Picking a filter while docked starts the results right under the row. Nothing found → "Add "…" as a
  new trail". Jumps instead of springs with Reduce Motion.
- **The filter applies while searching** (search within "Resurvey due"). An empty result says so and
  offers "Search all trails" before "Add … as a new trail".
- **No "Suggested" trail.** Once every trail that needs a survey wears its status on the photo, Nearest
  already makes the closest one stand out; a "Suggested" pill would compete with the status pill, and
  moving one card out of distance order reads as a sort bug. (Tried before: a lone card between search
  and the filter read as a glitching list item; a "Suggested" pill plus a 4th status line was awkward.)
- **Saving a trail** is a heart, the familiar pattern (Airbnb, AllTrails): on every card's photo and as a
  glass button on the trail page across from Back. Saved fills red (`colors.heart`). It pops once (up
  and back, no wobble) and ticks when saved.
  Saved trails are listed in Profile. On cards VoiceOver gets "Save" as a card action.
- **Offline download lives in Get ready only**, where a survey starts. It isn't on the list or the trail
  page: browsing doesn't need it, so no "Downloaded" labels on cards.
- **The pinned row** floats over a soft white fade (iOS 26 Photos-style scroll edge) that appears once
  content scrolls under it, not a frosted band or a solid bar with a hairline.
- **Map sheets** (survey session) collapse to just the capture buttons (drag or tap the grabber). Actions
  that change the map (Drop pin) collapse the sheet first so you see the change, then ask for details.
- **Lists mirror the map**: anything placed on a map (pins) is also listed in the sheet, tap to open it.
- **Sheets breathe.** One text system in the session and pin sheets: title 20 semibold, rows / meta /
  guideline / verdict 15, captions 13 semibold (no 14s). 56pt rows, 32 between groups, 24 inside a step;
  related lines (guideline + last time) sit 4 apart as one group. The user found 48pt rows and 8–16 gaps dense.
- **Re-check rows show what you found, not "Checked".** Open rows show where (above); once a pin or trailhead
  answer covers one, its icon turns into the navy check and the row reads `No access info → Full info` (old grey, new black), then sinks
  below the open ones. The list leaves once everything's re-checked.
- **Finish is always in sight.** While recording, a glass "Finish" pill sits top right (it used to hide behind
  Pause, and the user couldn't find it); it pauses and opens the wrap-up, where nothing is sent until Send.
  The clock capsule is the pause button (● 12:03 ❚❚, like a timer's Live Activity); paused it reads
  `Paused · 12:03 ▶` and the same tap resumes. Paused, Drop pin + mic
  turn into Resume + Finish and the top pill steps aside, so Finish is never on screen twice; the end of
  the trail pauses by itself.
- **The wrap-up asks only what's open.** Trail name, `1.2 mi · 42 min · 5 pins`, the route map with the pins,
  then one-tap answers for what the last survey flagged that no pin covered (`Still there · Gone · Didn't
check`; a missing pin can mean it's fixed), voice pins without details, an optional note. Send fills up as
  the answers come in. No stats row, no repeat of the trailhead answers, no "send anyway?" alert.

## 8. Motion and feedback

- Motion explains a change: the pin drops, squashes and settles; the tab pill slides; photo and map
  cross-fade; the offline veil pulls back; a dismissed reminder collapses (no jump).
- Springs for things that move, short eased timing (~200–320ms) for fades. Nothing loops except
  "you are here" and live recording.
- **Bounce once, never wobble.** Use the `spring` tokens in `src/styles/theme.ts`: `pop` (one small overshoot) only
  when something arrives (a pin lands, a check appears, a menu opens); `glide` (no overshoot) for anything
  that slides or resizes (sheets, reordering rows). Never pass a bare `damping`: Reanimated 4's heavy
  defaults turn it into ten-plus wobbles, which the user found distracting.
- Haptics: selection tick for choices and swaps, medium impact for dropping a pin, success on save.
- **Respect Reduce Motion** (`useReducedMotion`): jump or fade instead.
- iOS details: don't fade a blur (slide it); don't set opacity < 1 on Liquid Glass (change fill instead);
  shadows go on an outer view when the inner view clips.

## 9. Accessibility and touch

- Tap targets ≥ 48pt; main capture actions ≥ 56pt.
- Nested buttons are unreachable in VoiceOver: offer them as `accessibilityActions` on the parent.
- Sheets are swipeable but keep a "Cancel"/close button for VoiceOver.

## 10. Offline and trust

- Offline, saving and syncing should feel calm: show state with a picture and a number
  (map veil, "7 of 18 MB", "Map downloaded" in Get ready), not warnings.
- Everything works without signal; say so once, briefly ("Works offline").

## 11. Before calling a screen done

1. Screenshot it (Expo web via Playwright works; also check the phone). Look at it critically.
2. Count text: can any label, helper line or heading go? Is anything said twice?
3. Count boxes, greys, type styles, accent uses. Fewer.
4. Is every state clear without color? Is anything decorative?
5. Would a senior designer at Apple or Airbnb ship it? If an element exists "because apps usually
   have it", remove it or justify it.
6. `npx tsc --noEmit` and `npx expo lint` pass.

## Things that made it look AI-made (never again)

Dot-inside-pill tags · a random color per category · green/amber status · icons in pastel circles ·
a helper sentence on every element · label/value rows · stat boxes with dividers · every section in a
rounded card · a heading over every group · stacked control bands before the content · seven type
styles on one screen · bold navy links everywhere · underlined links · "0 trails" · two controls that do
the same thing · a title that repeats the step label · the same placeholder image on every row ·
gradients, glows, emoji as icons · fake-sounding data · one warning glyph standing for several meanings ·
a navy label on a filled button.
