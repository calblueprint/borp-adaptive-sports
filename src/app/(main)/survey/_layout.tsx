import { Stack } from 'expo-router';
import { SurveyProvider } from '@/features/survey/SurveyProvider';

export default function SurveyLayout() {
  return (
    <SurveyProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* No swiping back to the survey after it's sent */}
        <Stack.Screen name="sent" options={{ gestureEnabled: false }} />
      </Stack>
    </SurveyProvider>
  );
}
