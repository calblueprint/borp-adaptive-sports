# BORP Adaptive Sports

Expo / React Native app with basic Supabase email and password authentication.

## Setup

1. Install dependencies with `pnpm install`.
2. The existing `.env` contains `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the Supabase project. Use a
   publishable (or legacy anon) key, never a service-role key.
3. Enable the Email auth provider in Supabase. If Confirm Email is enabled, users
   must confirm through email before logging in. Configure the project's Site URL
   to a valid confirmation destination. This scaffold does not handle confirmation
   deep links or automatically sign in from the email link.
4. Run `pnpm start` and open the app on an iOS or Android device or simulator.
   Restart Expo after changing `.env`.

## Structure

- `api/supabase/client.ts`: single Supabase client and persisted session storage.
- `src/features/auth/AuthProvider.tsx`: restoration, auth events, and foreground
  token refresh. `useAuth()` gives screens the current session.
- `src/features/auth/AuthForm.tsx`: shared form, validation, loading and error states.
- `src/app/(auth)/`: login and sign-up screens.
- `src/app/(app)/`: protected placeholder home and logout.
- `src/app/_layout.tsx`: provider and route protection; auth events update navigation.

Sessions survive closing the app. Startup reads the saved session before attempting
refresh, so returning users can open home offline even with an expired access token.
Signing up, logging in, and accessing server data require a connection. Invalid or
revoked sessions are cleared when Supabase detects them online. Logout uses the
local scope (this device).

Saved sessions control local navigation; Supabase validates tokens for server
requests. Future database tables must use Row Level Security policies. This
scaffold does not cache application data for offline use.

## Validation

Run `pnpm run typecheck` and `pnpm run lint:check`.

Manual device checklist (use a test account):

1. Open signed out: login appears. Try empty fields and incorrect credentials.
2. Create an account. With confirmation enabled, confirm the email and log in;
   with confirmation disabled, home should open immediately.
3. Log in: home displays your email. Back navigation must not reopen auth screens.
4. Force-close and reopen: home should appear without logging in again.
5. Disable networking and reopen. Repeat after the access token expires: home
   should still open. Reconnect and verify refresh succeeds.
6. Log out online: login appears. Reopening must stay signed out, and direct
   navigation to home must not bypass login.

References: [Supabase React Native auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)
and [Expo Router protected routes](https://docs.expo.dev/router/advanced/protected/).
