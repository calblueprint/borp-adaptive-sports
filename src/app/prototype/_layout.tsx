// The design prototype, reachable from Home → "Design prototype". It runs on placeholder data kept in
// memory (src/data, the providers below) and never touches the real auth or Supabase.
import { Stack } from 'expo-router';
import { AccountProvider } from '@/features/account/AccountProvider';
import { SignUpProvider } from '@/features/onboarding/SignUpProvider';
import { SurveyProvider } from '@/features/survey/SurveyProvider';
import { LocationProvider } from '@/features/trails/LocationProvider';
import { TrailsProvider } from '@/features/trails/TrailsProvider';
import { colors } from '@/styles/theme';

export default function PrototypeLayout() {
  return (
    <SignUpProvider>
      <AccountProvider>
        <TrailsProvider>
          <LocationProvider>
            <SurveyProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.white },
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{ contentStyle: { backgroundColor: colors.navy } }}
                />
                <Stack.Screen
                  name="add-trail"
                  options={{ presentation: 'modal' }}
                />
                {/* A sheet you can swipe away; opens full height because search is focused with the keyboard up */}
                <Stack.Screen
                  name="location"
                  options={{
                    presentation: 'formSheet',
                    sheetAllowedDetents: [1],
                    sheetGrabberVisible: true,
                    sheetCornerRadius: 20,
                  }}
                />
                {/* Fake system location alert, over whatever screen asked */}
                <Stack.Screen
                  name="location-access"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'fade',
                    gestureEnabled: false,
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                />
                {/* No swipe-back mid-survey: the × pauses and returns to the trail instead */}
                <Stack.Screen
                  name="survey/[id]/session"
                  options={{
                    gestureEnabled: false,
                    fullScreenGestureEnabled: false,
                  }}
                />
                {/* Sent replaces Review; there's no going back into a finished survey */}
                <Stack.Screen
                  name="survey/[id]/sent"
                  options={{
                    gestureEnabled: false,
                    fullScreenGestureEnabled: false,
                    animation: 'fade',
                  }}
                />
                {/* Home and Profile; switching between them happens inside, with no transition */}
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              </Stack>
            </SurveyProvider>
          </LocationProvider>
        </TrailsProvider>
      </AccountProvider>
    </SignUpProvider>
  );
}
