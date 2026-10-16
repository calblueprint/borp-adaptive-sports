export type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single_select'
  | 'multi_select';

export type Question = {
  section: string;
  column: string;
  label: string;
  type: QuestionType;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  multiline?: boolean;
};

export type AnswerValue = string | boolean | string[] | undefined;
export type Answers = Record<string, AnswerValue>;

export const QUESTIONS: Question[] = [
  {
    section: 'Site Information',
    column: 'site_type',
    label: 'What type of site is this?',
    type: 'multi_select',
    options: ['Beach', 'Garden', 'Park', 'Trail'],
  },
  {
    section: 'Site Information',
    column: 'region',
    label: 'Which region is this site in?',
    type: 'single_select',
    options: [
      'North Coast',
      'Shasta Cascade',
      'Sacramento Valley',
      'SF/Bay Area',
      'South Bay',
      'Gold Country',
      'Monterey/Santa Cruz',
      'Central Valley',
      'Central Coast',
      'High Sierra',
      'Southern Coast',
    ],
  },

  {
    section: 'Parking',
    column: 'accessible_parking_spaces',
    label: 'Are there designated accessible parking spaces?',
    type: 'single_select',
    options: ['Yes', 'No', 'Limited', 'Partial', 'N/A'],
  },
  {
    section: 'Parking',
    column: 'van_accessible',
    label: 'Is this site van accessible?',
    type: 'boolean',
  },
  {
    section: 'Parking',
    column: 'parking_surface',
    label: 'What is the parking surface like?',
    type: 'single_select',
    options: ['Firm', 'Hard', 'Moderately hard', 'Soft', 'Very soft'],
  },
  {
    section: 'Parking',
    column: 'parking_level',
    label: 'Is the parking level, or sloped no more than 2%?',
    type: 'boolean',
  },

  {
    section: 'Activities',
    column: 'activities',
    label: 'Which activities are available?',
    type: 'multi_select',
    options: [
      'Cycling',
      'Boating',
      'Camping',
      'Fishing',
      'Docent tours',
      'Hiking',
      'Picnic',
      'Swimming',
      'Wildlife viewing',
      'Good for families',
    ],
  },
  {
    section: 'Activities',
    column: 'dog_policy',
    label: 'What is the dog policy?',
    type: 'single_select',
    options: [
      'Allowed on leash',
      'Allowed off-leash',
      'Allowed in restricted areas',
      'Not allowed except service dogs',
      'Not allowed including service animals',
    ],
  },

  {
    section: 'Accessible Facilities',
    column: 'accessible_facilities',
    label: 'Which accessible facilities are available?',
    type: 'multi_select',
    options: [
      'Accessible boat launch',
      'Accessible restrooms',
      'Benches',
      'Fishing pier',
      'Food',
      'Picnic playground',
      'Playground',
      'Roll-in shower',
    ],
  },
  {
    section: 'Accessible Facilities',
    column: 'accessible_visitor_center',
    label: 'Is there an accessible visitor center?',
    type: 'boolean',
  },
  {
    section: 'Accessible Facilities',
    column: 'visitor_center_notes',
    label: 'Visitor center notes (describe hours and location)',
    type: 'text',
    multiline: true,
    maxLength: 1000,
  },

  {
    section: 'Restrooms',
    column: 'accessible_restroom',
    label: 'Is there an accessible restroom?',
    type: 'single_select',
    options: ['Yes', 'No', 'Partial accessibility'],
  },
  {
    section: 'Restrooms',
    column: 'restroom_type',
    label: 'What type of restroom is it?',
    type: 'multi_select',
    options: ['Women', 'Men', 'All gender', 'Porta-potty', 'Vault toilet'],
  },

  {
    section: 'Trails',
    column: 'trail_length_m',
    label: 'What is the total length of this trail (m)?',
    type: 'number',
    min: 1,
    max: 100000,
  },
  {
    section: 'Trails',
    column: 'trail_width_m',
    label: 'What is the width of this trail (m)?',
    type: 'number',
    min: 0.1,
    max: 10,
  },
  {
    section: 'Trails',
    column: 'trail_surface',
    label: 'What is the trail surface like?',
    type: 'text',
    maxLength: 200,
  },
];

function isEmpty(value: AnswerValue) {
  return (
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

// returns an error message for one answer, or null if it is fine/blank
export function validateAnswer(q: Question, value: AnswerValue): string | null {
  if (isEmpty(value)) return null;

  switch (q.type) {
    case 'number': {
      if (typeof value !== 'string') return 'Enter a number';
      const text = value.trim();
      if (!/^(\d+(\.\d+)?|\.\d+)$/.test(text)) {
        return 'Use digits only, with no letters, minus sign, or spaces';
      }
      const n = Number(text);
      if (!Number.isFinite(n)) return 'Enter a valid number';
      if (q.min !== undefined && n < q.min) return `Must be at least ${q.min}`;
      if (q.max !== undefined && n > q.max) return `Must be at most ${q.max}`;
      return null;
    }
    case 'text': {
      if (typeof value !== 'string') return 'Enter text';
      const limit = q.maxLength ?? 500;
      if (value.trim().length > limit) {
        return `Keep it under ${limit} characters`;
      }
      return null;
    }
    case 'boolean':
      return typeof value === 'boolean' ? null : 'Choose yes or no';
    case 'single_select':
      return typeof value === 'string' && q.options?.includes(value)
        ? null
        : 'Choose one of the options';
    case 'multi_select':
      return Array.isArray(value) &&
        value.every(v => q.options?.includes(v)) &&
        new Set(value).size === value.length
        ? null
        : 'Choose from the listed options';
  }
}

// returns { column: message } for every invalid answer.
export function validateAll(answers: Answers) {
  const errors: Record<string, string> = {};
  for (const q of QUESTIONS) {
    const error = validateAnswer(q, answers[q.column]);
    if (error) errors[q.column] = error;
  }
  return errors;
}

// converts answers to database values, blank answers become null
export function toRow(answers: Answers) {
  const row: Record<string, string | number | boolean | string[] | null> = {};
  for (const q of QUESTIONS) {
    const value = answers[q.column];
    if (isEmpty(value)) row[q.column] = null;
    else if (q.type === 'number')
      row[q.column] = Number((value as string).trim());
    else if (q.type === 'text') row[q.column] = (value as string).trim();
    else row[q.column] = value as boolean | string | string[];
  }
  return row;
}
