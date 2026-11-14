// Surveys — not in Figma yet. Every survey you've sent, in the profile's order: a paused one to pick back
// up, one BORP sent back with their note, then newest first. The profile shows the first three.
import { View } from 'react-native';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import {
  InProgress,
  sortSurveys,
  SurveyRow,
} from '@/components/SurveyRows/SurveyRows';
import { useSurvey } from '@/features/survey/SurveyProvider';

export default function SurveysScreen() {
  const { submissions, session } = useSurvey();
  return (
    <SubScreen title="Surveys">
      <View>
        {session ? <InProgress trailId={session.trailId} /> : null}
        {sortSurveys(submissions).map((s, i) => (
          <SurveyRow key={s.id} sub={s} divider={i > 0 || !!session} />
        ))}
      </View>
    </SubScreen>
  );
}
