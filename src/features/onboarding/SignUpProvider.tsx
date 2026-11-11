import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

// Prototype-only sign-up state shared across the auth screens. Nothing is sent anywhere.
type SignUp = {
  email: string;
  setEmail: (email: string) => void;
  reset: () => void;
};

const SignUpContext = createContext<SignUp | null>(null);

export function SignUpProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');
  const value = useMemo(
    () => ({ email, setEmail, reset: () => setEmail('') }),
    [email],
  );
  return (
    <SignUpContext.Provider value={value}>{children}</SignUpContext.Provider>
  );
}

export function useSignUp() {
  const ctx = useContext(SignUpContext);
  if (!ctx) throw new Error('useSignUp must be used inside <SignUpProvider>');
  return ctx;
}
