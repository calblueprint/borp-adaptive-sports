import { createContext, useContext, useState } from 'react';

// Shared by the survey routes (form/review, live session, sent) so the
// session screen can hand off to review without losing the form's state.
// The survey layout mounts it, so it resets on every new survey.
type SurveyStep = 'form' | 'review';

const SurveyContext = createContext<{
  surveyId: string | null;
  setSurveyId: (id: string) => void;
  itemCount: number;
  addItem: () => void;
  step: SurveyStep;
  setStep: (step: SurveyStep) => void;
} | null>(null);

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [step, setStep] = useState<SurveyStep>('form');

  return (
    <SurveyContext.Provider
      value={{
        surveyId,
        setSurveyId,
        itemCount,
        addItem: () => setItemCount(c => c + 1),
        step,
        setStep,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context)
    throw new Error('useSurvey must be used inside SurveyProvider.');
  return context;
}
