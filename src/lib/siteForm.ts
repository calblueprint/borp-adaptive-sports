import type { TablesInsert } from '~/api/supabase/database.types';

export const SITE_SURFACES = [
  'Paved',
  'Boardwalk',
  'Gravel',
  'Dirt',
  'Other',
] as const;

export type SiteFormValues = {
  name: string;
  lat: string;
  lng: string;
  park: string;
  city: string;
  county: string;
  surface_type: string;
  trail_length_m: string;
  notes: string;
};

export type SiteFormErrors = Partial<Record<keyof SiteFormValues, string>>;

export type CreateSiteInput = Pick<
  TablesInsert<'sites'>,
  | 'name'
  | 'lat'
  | 'lng'
  | 'park'
  | 'city'
  | 'county'
  | 'surface_type'
  | 'trail_length_m'
  | 'notes'
>;

export const EMPTY_SITE_FORM: SiteFormValues = {
  name: '',
  lat: '',
  lng: '',
  park: '',
  city: '',
  county: '',
  surface_type: '',
  trail_length_m: '',
  notes: '',
};

// Reject partial numbers, exponents, and other formats Number() would accept.
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function validateSiteForm(values: SiteFormValues): SiteFormErrors {
  const errors: SiteFormErrors = {};
  if (!values.name.trim()) errors.name = 'Enter a trail name.';

  for (const field of ['name', 'park', 'city', 'county'] as const) {
    if (values[field].trim().length > 200)
      errors[field] = 'Keep this under 200 characters.';
  }

  for (const [field, label, limit] of [
    ['lat', 'Latitude', 90],
    ['lng', 'Longitude', 180],
  ] as const) {
    const text = values[field].trim();
    if (!text) errors[field] = `Enter ${label.toLowerCase()}.`;
    else if (!DECIMAL.test(text) || !Number.isFinite(Number(text)))
      errors[field] = 'Enter a valid decimal number.';
    else if (Math.abs(Number(text)) > limit)
      errors[field] = `${label} must be between −${limit} and ${limit}.`;
  }

  const length = values.trail_length_m.trim();
  if (
    length &&
    (!DECIMAL.test(length) ||
      !Number.isFinite(Number(length)) ||
      Number(length) <= 0)
  ) {
    errors.trail_length_m = 'Enter a length greater than zero in meters.';
  }

  if (
    values.surface_type &&
    !SITE_SURFACES.some(surface => surface === values.surface_type)
  ) {
    errors.surface_type = 'Choose one of the listed surfaces.';
  }
  if (values.notes.trim().length > 2000)
    errors.notes = 'Keep notes under 2,000 characters.';

  return errors;
}

export function toSiteInput(values: SiteFormValues): CreateSiteInput {
  if (Object.keys(validateSiteForm(values)).length)
    throw new Error('Fix the highlighted fields before adding this trail.');

  return {
    name: values.name.trim(),
    lat: Number(values.lat.trim()),
    lng: Number(values.lng.trim()),
    park: values.park.trim() || null,
    city: values.city.trim() || null,
    county: values.county.trim() || null,
    surface_type: values.surface_type || null,
    trail_length_m: values.trail_length_m.trim()
      ? Number(values.trail_length_m.trim())
      : null,
    notes: values.notes.trim() || null,
  };
}
