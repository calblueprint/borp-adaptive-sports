import type { PinKind } from '@/data/survey';
import type { TrailheadKey } from '@/data/trails';
import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PAST_SUBMISSIONS } from '@/data/submissions';

// Prototype-only survey state, kept in memory (lost on reload). In the real app this lives in on-device
// storage so a survey survives the app closing, and syncs to BORP when there's signal.

export type TrailheadAnswers = Partial<Record<TrailheadKey, string>>;

export type VoiceNote = { uri: string; ms: number };

/** A photo's local file URI, or a bundled image (the demo surveys' photos). */
export type Photo = string | ImageSourcePropType;

/** Photos and voice notes for one trailhead check. */
export type Evidence = { photos: string[]; voice: VoiceNote[] };
export type TrailheadMedia = Partial<Record<TrailheadKey, Evidence>>;
export const NO_EVIDENCE: Evidence = { photos: [], voice: [] };

export type Pin = {
  id: string;
  /** 1, 2, 3… in the order they were dropped. */
  n: number;
  /** Where it was dropped, as fractions of the map image. */
  x: number;
  y: number;
  /** Miles along the trail when it was dropped. */
  mi: number;
  /** Undefined for a quick voice pin that still needs details. */
  kind?: PinKind;
  value?: number;
  choice?: string;
  /** Local file URIs. In the real app these move into app storage and upload when there's signal. */
  photos: Photo[];
  voice: VoiceNote[];
  note?: string;
};

export type Session = {
  trailId: string;
  trailhead: TrailheadAnswers;
  trailheadMedia: TrailheadMedia;
  pins: Pin[];
  /** Wrap-up answers for re-check items no pin covered ("Gone", "Didn't check"…), by re-check key. */
  recheck: Record<string, string>;
  /** Time on the trail before the current stretch, so pausing doesn't count. */
  elapsedBefore: number;
  /** When the current stretch started; undefined while paused. */
  resumedAt?: number;
};

export type OfflineStatus = 'none' | 'downloading' | 'saved';

/** waiting = saved on the phone until there's signal, review = with BORP, changes = BORP asked for a fix, published = on Access California */
export type SubmissionStatus = 'waiting' | 'review' | 'changes' | 'published';

/** A finished survey, as sent to BORP. */
export type Submission = {
  id: string;
  trailId: string;
  sentAt: number;
  status: SubmissionStatus;
  /** Time on the trail, ms. */
  elapsed: number;
  miles: number;
  trailhead: TrailheadAnswers;
  /** Left out on past surveys from before trailhead photos. */
  trailheadMedia?: TrailheadMedia;
  pins: Pin[];
  /** Wrap-up answers for re-check items no pin covered. Left out on past surveys. */
  recheck?: Record<string, string>;
  /** Overall note for BORP from the wrap-up screen. */
  note?: string;
  voice: VoiceNote[];
  /** What the coordinator said when they reviewed it. */
  review?: { at: number; note: string };
};

/** The extras added on the wrap-up screen. */
export type Wrapup = { note?: string; voice: VoiceNote[]; miles: number };

type SurveyState = {
  /** The first-time primer has been seen (shown once per install). */
  primerSeen: boolean;
  markPrimerSeen: () => void;
  offline: (trailId: string) => { status: OfflineStatus; progress: number };
  saveOffline: (trailId: string) => void;
  /** Trailhead answers while filling them in, before the session starts. */
  drafts: Record<string, TrailheadAnswers>;
  /** undefined clears the answer (tapping the chosen chip again). */
  answerTrailhead: (
    trailId: string,
    key: TrailheadKey,
    choice: string | undefined,
  ) => void;
  /** Trailhead photos and voice notes while filling them in. */
  draftMedia: Record<string, TrailheadMedia>;
  /** Takes an updater so a photo that arrives after the camera closes doesn't drop a voice note added meanwhile. */
  updateTrailheadMedia: (
    trailId: string,
    key: TrailheadKey,
    update: (e: Evidence) => Evidence,
  ) => void;
  /** One survey at a time; starting another replaces it. */
  session: Session | null;
  startSession: (trailId: string) => void;
  pause: () => void;
  resume: () => void;
  /** Adds the pin, or replaces the one with the same id. */
  savePin: (pin: Pin) => void;
  removePin: (id: string) => void;
  /** Answers a re-check item on the wrap-up; undefined clears it. */
  answerRecheck: (key: string, answer: string | undefined) => void;
  /** A pin the wrap-up screen wants the session to open when it's back in view. */
  focusPin: string | null;
  setFocusPin: (id: string | null) => void;
  /** Ends the session and sends it. Returns the new submission. */
  submit: (wrapup: Wrapup) => Submission | null;
  /** Newest first: this phone's sends, then the demo account's past surveys. */
  submissions: Submission[];
  /** Settings › Offline trails. */
  offlineCount: number;
  clearOffline: () => void;
};

/** A copy of `record` without `key`. */
function without<T>(record: Record<string, T>, key: string) {
  const rest = { ...record };
  delete rest[key];
  return rest;
}

const SurveyContext = createContext<SurveyState | null>(null);

// Fake download: ~2.5 s, in small steps so the progress bar moves.
const DOWNLOAD_STEP_MS = 120;
const DOWNLOAD_STEP = 0.05;
// Fake upload: the survey sits on the phone this long before "finding signal" and sending.
const FAKE_SIGNAL_MS = 2800;

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [primerSeen, setPrimerSeen] = useState(false);
  // Prototype: Nimitz Way was saved on an earlier outing, so the list shows what "Downloaded" looks like
  const [downloads, setDownloads] = useState<Record<string, number>>({
    'nimitz-way': 1,
  });
  const [drafts, setDrafts] = useState<Record<string, TrailheadAnswers>>({});
  const [draftMedia, setDraftMedia] = useState<Record<string, TrailheadMedia>>(
    {},
  );
  const [session, setSession] = useState<Session | null>(null);
  const [focusPin, setFocusPin] = useState<string | null>(null);
  const [sent, setSent] = useState<Submission[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const running = timers.current;
    return () => Object.values(running).forEach(clearInterval);
  }, []);

  const saveOffline = useCallback((trailId: string) => {
    if (timers.current[trailId]) return;
    setDownloads(d => ({ ...d, [trailId]: 0 }));
    timers.current[trailId] = setInterval(() => {
      setDownloads(d => {
        const next = Math.min(1, (d[trailId] ?? 0) + DOWNLOAD_STEP);
        if (next >= 1) {
          clearInterval(timers.current[trailId]);
          delete timers.current[trailId];
        }
        return { ...d, [trailId]: next };
      });
    }, DOWNLOAD_STEP_MS);
  }, []);

  const answerTrailhead = useCallback(
    (trailId: string, key: TrailheadKey, choice: string | undefined) => {
      setDrafts(d => ({ ...d, [trailId]: { ...d[trailId], [key]: choice } }));
    },
    [],
  );

  const updateTrailheadMedia = useCallback(
    (trailId: string, key: TrailheadKey, update: (e: Evidence) => Evidence) => {
      setDraftMedia(d => ({
        ...d,
        [trailId]: {
          ...d[trailId],
          [key]: update(d[trailId]?.[key] ?? NO_EVIDENCE),
        },
      }));
    },
    [],
  );

  const startSession = useCallback(
    (trailId: string) =>
      setSession({
        trailId,
        trailhead: drafts[trailId] ?? {},
        trailheadMedia: draftMedia[trailId] ?? {},
        pins: [],
        recheck: {},
        elapsedBefore: 0,
        resumedAt: Date.now(),
      }),
    [drafts, draftMedia],
  );

  const pause = useCallback(
    () =>
      setSession(s =>
        s?.resumedAt
          ? {
              ...s,
              elapsedBefore: s.elapsedBefore + Date.now() - s.resumedAt,
              resumedAt: undefined,
            }
          : s,
      ),
    [],
  );
  const resume = useCallback(
    () =>
      setSession(s =>
        s && !s.resumedAt ? { ...s, resumedAt: Date.now() } : s,
      ),
    [],
  );

  const savePin = useCallback(
    (pin: Pin) =>
      setSession(s =>
        s
          ? {
              ...s,
              pins: [...s.pins.filter(p => p.id !== pin.id), pin].sort(
                (a, b) => a.n - b.n,
              ),
            }
          : s,
      ),
    [],
  );
  const removePin = useCallback(
    (id: string) =>
      setSession(s =>
        s ? { ...s, pins: s.pins.filter(p => p.id !== id) } : s,
      ),
    [],
  );

  const answerRecheck = useCallback(
    (key: string, answer: string | undefined) =>
      setSession(s => {
        if (!s) return s;
        const rest = without(s.recheck, key);
        return { ...s, recheck: answer ? { ...rest, [key]: answer } : rest };
      }),
    [],
  );

  const submit = useCallback(
    ({ note, voice, miles }: Wrapup) => {
      if (!session) return null;
      const elapsed =
        session.elapsedBefore +
        (session.resumedAt ? Date.now() - session.resumedAt : 0);
      const sub: Submission = {
        id: `sub-${Date.now().toString(36)}`,
        trailId: session.trailId,
        sentAt: Date.now(),
        status: 'waiting',
        elapsed,
        miles,
        trailhead: session.trailhead,
        trailheadMedia: session.trailheadMedia,
        pins: session.pins,
        recheck: session.recheck,
        note: note?.trim() || undefined,
        voice,
      };
      setSent(list => [sub, ...list]);
      setSession(null);
      setDrafts(d => without(d, session.trailId));
      setDraftMedia(d => without(d, session.trailId));
      // Pretend the phone finds signal a moment later
      const key = `send-${sub.id}`;
      timers.current[key] = setTimeout(() => {
        delete timers.current[key];
        setSent(list =>
          list.map(x => (x.id === sub.id ? { ...x, status: 'review' } : x)),
        );
      }, FAKE_SIGNAL_MS);
      return sub;
    },
    [session],
  );

  const value = useMemo<SurveyState>(
    () => ({
      primerSeen,
      markPrimerSeen: () => setPrimerSeen(true),
      offline: trailId => {
        const p = downloads[trailId];
        return {
          status: p === undefined ? 'none' : p >= 1 ? 'saved' : 'downloading',
          progress: p ?? 0,
        };
      },
      saveOffline,
      drafts,
      answerTrailhead,
      draftMedia,
      updateTrailheadMedia,
      session,
      startSession,
      pause,
      resume,
      savePin,
      removePin,
      answerRecheck,
      focusPin,
      setFocusPin,
      submit,
      submissions: [...sent, ...PAST_SUBMISSIONS],
      offlineCount: Object.values(downloads).filter(p => p >= 1).length,
      clearOffline: () =>
        setDownloads(d =>
          Object.fromEntries(Object.entries(d).filter(([, p]) => p < 1)),
        ),
    }),
    [
      primerSeen,
      downloads,
      saveOffline,
      drafts,
      answerTrailhead,
      draftMedia,
      updateTrailheadMedia,
      session,
      startSession,
      pause,
      resume,
      savePin,
      removePin,
      answerRecheck,
      focusPin,
      submit,
      sent,
    ],
  );

  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  );
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurvey must be used inside <SurveyProvider>');
  return ctx;
}

/** Time on the trail in ms, ticking once a second while the session is running. */
export function useElapsed(session: Session | null) {
  const [now, setNow] = useState(Date.now);
  const running = !!session?.resumedAt;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  if (!session) return 0;
  return (
    session.elapsedBefore +
    (session.resumedAt ? Math.max(0, now - session.resumedAt) : 0)
  );
}

/** 0:42, 12:05, 1:02:05 */
export function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
