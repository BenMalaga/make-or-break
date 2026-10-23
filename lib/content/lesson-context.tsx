"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

/**
 * Shares the current lesson slug + interactive state with the client MDX
 * components (Quiz, Exercise, FloatingNotes) rendered inside the server-compiled
 * MDX tree. Local state is the source while mounted; it is seeded from the
 * progress store once, after hydration, and written back through it debounced.
 * When absent (a component used outside a lesson), the components fall back to
 * local-only state.
 */

export interface QuizRecord {
  selected: number;
  correct: boolean;
}

export interface InteractiveState {
  quizzes: Record<string, QuizRecord>;
  exercises: Record<string, boolean>;
}

interface LessonContextValue {
  lessonSlug: string;
  interactive: InteractiveState;
  recordQuiz: (id: string, record: QuizRecord) => void;
  recordExercise: (id: string, done: boolean) => void;
  notes: string;
  updateNotes: (value: string) => void;
  notesSaving: boolean;
  notesError: boolean;
}

const LessonContext = createContext<LessonContextValue | null>(null);

export function useLessonInteractive(): LessonContextValue | null {
  return useContext(LessonContext);
}

const EMPTY: InteractiveState = { quizzes: {}, exercises: {} };

export function LessonInteractiveProvider({
  lessonSlug,
  children,
}: {
  lessonSlug: string;
  children: ReactNode;
}) {
  const hydrated = useProgressHydrated();
  const [interactive, setInteractive] = useState<InteractiveState>(EMPTY);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  // Writes go to localStorage, so there is no failure path to report.
  const notesError = false;
  const iTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef(notes);
  const iRef = useRef(interactive);
  const loadedFor = useRef<string | null>(null);
  // Keep the mirrors current for the unmount flush below.
  notesRef.current = notes;
  iRef.current = interactive;

  // Adopt the persisted state once per lesson, after the store has
  // rehydrated, then keep local state authoritative so typing is never fought
  // by the store. Keyed by slug because the provider instance survives
  // navigation between lessons.
  useEffect(() => {
    if (!hydrated || loadedFor.current === lessonSlug) return;
    loadedFor.current = lessonSlug;
    const lp = useProgress.getState().lessons[lessonSlug];
    setInteractive(
      lp?.interactive
        ? {
            quizzes: { ...lp.interactive.quizzes },
            exercises: { ...lp.interactive.exercises },
          }
        : EMPTY,
    );
    const storedNotes = lp?.notes ?? "";
    notesRef.current = storedNotes;
    setNotes(storedNotes);
  }, [hydrated, lessonSlug]);

  const persistInteractive = (next: InteractiveState) => {
    if (iTimer.current) clearTimeout(iTimer.current);
    iTimer.current = setTimeout(() => {
      useProgress.getState().setInteractive(lessonSlug, next);
    }, 400);
  };

  const recordQuiz = (id: string, record: QuizRecord) =>
    setInteractive((prev) => {
      const next = { ...prev, quizzes: { ...prev.quizzes, [id]: record } };
      persistInteractive(next);
      return next;
    });

  const recordExercise = (id: string, done: boolean) =>
    setInteractive((prev) => {
      const next = { ...prev, exercises: { ...prev.exercises, [id]: done } };
      persistInteractive(next);
      return next;
    });

  const updateNotes = (value: string) => {
    setNotes(value);
    setNotesSaving(true);
    if (nTimer.current) clearTimeout(nTimer.current);
    nTimer.current = setTimeout(() => {
      useProgress.getState().setNotes(lessonSlug, value);
      setNotesSaving(false);
    }, 700);
  };

  // Flush pending debounces so a quick navigate cannot drop a just-typed note.
  useEffect(
    () => () => {
      if (iTimer.current) {
        clearTimeout(iTimer.current);
        useProgress.getState().setInteractive(lessonSlug, iRef.current);
      }
      if (nTimer.current) {
        clearTimeout(nTimer.current);
        useProgress.getState().setNotes(lessonSlug, notesRef.current);
      }
    },
    [lessonSlug],
  );

  return (
    <LessonContext.Provider
      value={{ lessonSlug, interactive, recordQuiz, recordExercise, notes, updateNotes, notesSaving, notesError }}
    >
      {children}
    </LessonContext.Provider>
  );
}

export { EMPTY as EMPTY_INTERACTIVE };
