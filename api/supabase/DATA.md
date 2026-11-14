# Prototype data → Supabase tables

The design prototype (`/prototype`) runs on placeholder data kept in memory: nothing is read from or
written to Supabase. This maps each prototype type to the tables in `database.types.ts`, so wiring a
screen to real data starts from here. "Gap" means the prototype shows something the schema can't hold yet.

| Prototype                   | Where it lives                           | Table                        |
| --------------------------- | ---------------------------------------- | ---------------------------- |
| `Trail`                     | `src/data/trails.ts`, `TrailsProvider`   | `sites` (+ latest `surveys`) |
| `NewTrail` (Add a trail)    | `src/features/trails/TrailsProvider.tsx` | `sites`                      |
| `User`, `Mobility`, `MyAid` | `src/features/account/AccountProvider`   | `profiles`                   |
| `Submission`                | `src/features/survey/SurveyProvider.tsx` | `surveys`                    |
| `TrailheadAnswers`          | `SurveyProvider`, `src/data/survey.ts`   | `surveys` columns            |
| `Pin`                       | `SurveyProvider`, `src/data/survey.ts`   | `survey_items`               |
| `Photo`, `Evidence.photos`  | `SurveyProvider`                         | `photos`                     |
| Session route (`route`)     | `src/data/trail-session-maps.ts`         | `trail_sessions.route`       |
| `elapsed`, `miles`          | `Submission`                             | `trail_sessions`             |

## sites

`Trail.id`, `name`, `lat`, `lng` map to `sites.id`, `name`, `lat`, `lng`. A trail added in the app
(`addTrail`) is a new `sites` row with `created_by` = the surveyor.

Gaps: `park`, `city`, `county`, `miles`, `gainFt`, `elevFt`, `surface`, `water` and the added-trail `notes`
have no column on `sites`. Some could come from the latest published survey (`trail_length_m`,
`trail_surface`) or `trail_sessions` (`elevation_gain_m`, `max_elevation_m`, `total_distance_meters`).

## surveys

One `Submission` is one `surveys` row: `trailId` → `site_id`, the signed-in user → `surveyor_id`,
`sentAt` → `submitted_at`.

- `status`: the prototype's `waiting | review | changes | published`. `waiting` (saved on the phone until
  there's signal) never reaches the server, so the server needs `review | changes | published`.
- `review.note` → `review_notes`, the coordinator → `reviewer_id`.
- Trailhead answers (`TrailheadKey`): `parking` ("Van accessible", "Accessible, not van", "None") →
  `accessible_parking_spaces` + `van_accessible`; `restroom` ("Accessible", "Not accessible", "None") →
  `accessible_restroom`.

Gaps: the trailhead `sign` ("Does the sign show access info?") and `water` ("Is there drinking water?")
answers, the "Not sure" answer, the overall wrap-up `note`, wrap-up voice notes, and the re-check answers
(`recheck`, by condition) have no column.

Trail status (`never | due | current`) and `last` survey date are derived: no published survey, an old
one, or a recent one.

## survey_items

Each `Pin` is a `survey_items` row: `n` → `item_order`, `kind` → `type`, `note` → `notes`.

Gaps:

- The reading itself: `value` (inches or %) and `choice` (e.g. "Loose gravel") need columns, e.g.
  `value numeric` and `choice text`.
- Pins are placed as `x`, `y` fractions of the session map image and `mi` along the route. Real pins
  should store `lat` / `lng` (already there) and the distance along the track.
- Voice notes on a pin (`VoiceNote`: file `uri` + `ms`) have no table; they'd need one like `photos`.

## photos

Each pin photo and trailhead photo is a `photos` row: `survey_id`, `survey_item_id` (null for a trailhead
photo), `storage_path`, and `uploaded` (false while it waits for Wi-Fi when the Wi-Fi-only setting is on).

Gap: a trailhead photo doesn't record which trailhead question (`TrailheadKey`) it belongs to.

## trail_sessions

The recorded walk: `route`, `total_distance_meters` (`Submission.miles`), `recorded_at` / `ended_at`
(`elapsed`, which excludes paused time). The prototype walks a pre-drawn route instead of recording GPS.

## profiles

`User.name`, `email`, `phone` → `name`, `email`, `phone_number`.

Gaps:

- `MyAid[]` (how you go on trails): each has `aid` (manual, power, scooter…), its own `name`, `width`
  (in), steepest `grade` and `cross` slope (%). `mobility_device` holds one string; this needs a table,
  e.g. `mobility_aids (profile_id, aid, name, width_in, max_grade, max_cross, in_use)`.
- Profile photo, `since` (month joined, could come from `created_at`).
- `Settings`: units, Wi-Fi only uploads, auto offline, notifications, show name on published surveys.
- Saved trails: needs a join table, e.g. `saved_sites (profile_id, site_id, created_at)`.

## Not in the database (on the phone only)

Offline map downloads (`OfflineStatus`), in-progress drafts, and the device location (`LocationProvider`).
