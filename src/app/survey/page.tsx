import { ScrollView, StyleSheet, Text, View } from 'react-native';

type QuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single_select'
  | 'multi_select';

type Question = {
  section: string;
  column: string;
  label: string;
  type: QuestionType;
  options?: string[];
};

const QUESTIONS: Question[] = [
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
    options: ['Yes', 'No'],
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
    options: ['Yes', 'No'],
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
    options: ['Yes', 'No'],
  },
  {
    section: 'Accessible Facilities',
    column: 'visitor_center_notes',
    label: 'Visitor center notes (describe hours and location)',
    type: 'text',
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
  },
  {
    section: 'Trails',
    column: 'trail_width_m',
    label: 'What is the width of this trail (m)?',
    type: 'number',
  },
  {
    section: 'Trails',
    column: 'trail_surface',
    label: 'What is the trail surface like?',
    type: 'text',
  },
];

const sections = QUESTIONS.reduce<Record<string, Question[]>>((groups, q) => {
  (groups[q.section] ??= []).push(q);
  return groups;
}, {});

export default function SurveyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Trail Survey</Text>

      {Object.entries(sections).map(([sectionName, questions]) => (
        <View key={sectionName} style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionName}</Text>

          {questions.map(q => (
            <View key={q.column} style={styles.question}>
              <Text style={styles.label}>{q.label}</Text>

              {q.options && (
                <View style={styles.optionsBox}>
                  {q.type === 'multi_select' && (
                    <Text style={styles.hint}>Check all that apply</Text>
                  )}
                  {q.options.map(opt => (
                    <Text key={opt} style={styles.option}>
                      {q.type === 'multi_select' ? '☐ ' : '○ '}
                      {opt}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  question: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: '600' },
  optionsBox: { marginTop: 6, marginLeft: 4 },
  hint: { fontSize: 13, fontStyle: 'italic', color: '#777', marginBottom: 4 },
  option: { fontSize: 15, color: '#444', lineHeight: 24 },
});
