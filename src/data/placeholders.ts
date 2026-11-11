// Neutral stand-ins for the prototype's trail photos and Apple Maps snapshots, which can't be published
// here. Each keeps the original's shape, so layouts built around them still fit.
import avatar from '~/assets/placeholders/avatar.png';
import mapBanner from '~/assets/placeholders/map-banner.png';
import mapBay from '~/assets/placeholders/map-bay.png';
import mapCard from '~/assets/placeholders/map-card.png';
import mapSession from '~/assets/placeholders/map-session.png';
import mapThumb from '~/assets/placeholders/map-thumb.png';
import photoPortrait from '~/assets/placeholders/photo-3x4.png';
import photoWide from '~/assets/placeholders/photo-4x3.png';
import photo from '~/assets/placeholders/photo.png';
import trailMap from '~/assets/placeholders/trail-map.png';

export const PLACEHOLDER = {
  /** A person, square. */
  avatar,
  /** A trail photo, 16:10. */
  photo,
  /** A gallery or pin photo, 4:3. */
  photoWide,
  /** A pin photo taken upright, 3:4. */
  photoPortrait,
  /** Route map snapshots: card 16:10, banner 354×112pt, thumb square. */
  mapCard,
  mapBanner,
  mapThumb,
  /** The survey session's map, 640×1000pt. */
  mapSession,
  /** The profile's Bay Area map, 440×260pt. */
  mapBay,
  /** The drawn trail map used when a trail has no snapshot, 864×1024. */
  trailMap,
};

/** Placeholder photos have no photographer to credit. */
export const PLACEHOLDER_CREDIT = {
  author: 'Placeholder',
  license: 'placeholder image',
  source: '',
};
