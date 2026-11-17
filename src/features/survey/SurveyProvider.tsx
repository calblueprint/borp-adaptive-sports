import type { LocalPhoto } from '@/lib/photos';
import type { Answers } from '@/lib/survey';
import { createContext, useContext, useState } from 'react';

// State shared by the survey routes (form -> session -> review -> sent).
// The survey layout mounts it, so it resets on every new survey.
type SurveyContextValue = {
  // Pre-survey answers and photos, keyed by question column / section name
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  photos: Record<string, LocalPhoto[]>;
  setPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  surveyId: string | null;
  siteName: string | null;
  startSession: (surveyId: string, siteName: string | null) => void;
};

const SurveyContext = createContext<SurveyContextValue | null>(null);

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [photos, setPhotos] = useState<Record<string, LocalPhoto[]>>({});
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);

  const startSession = (id: string, name: string | null) => {
    setSurveyId(id);
    setSiteName(name);
  };

  return (
    <SurveyContext.Provider
      value={{
        answers,
        setAnswers,
        photos,
        setPhotos,
        surveyId,
        siteName,
        startSession,
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
