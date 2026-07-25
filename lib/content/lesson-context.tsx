"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { setLessonInteractive, setLessonNotes } from "@/lib/actions/progress";

/**
 * Shares the current lesson id + interactive state with the client MDX
 * components (Quiz, Exercise, LessonNotes) rendered inside the server-compiled
 * MDX tree. Debounce-persists to the DB via server actions. When absent (a
 * component used outside a lesson), the components fall back to local-only
 * state.
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
  lessonId: string;
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
  lessonId,
  initialInteractive,
  initialNotes,
  children,
}: {
  lessonId: string;
  initialInteractive?: Partial<InteractiveState> | null;
  initialNotes?: string | null;
  children: ReactNode;
}) {
  const [interactive, setInteractive] = useState<InteractiveState>({
    quizzes: initialInteractive?.quizzes ?? {},
    exercises: initialInteractive?.exercises ?? {},
  });
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState(false);
  const iTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (next: InteractiveState) => {
    if (iTimer.current) clearTimeout(iTimer.current);
    iTimer.current = setTimeout(() => {
      void setLessonInteractive(lessonId, next).catch(() => {});
    }, 400);
  };

  const recordQuiz = (id: string, record: QuizRecord) =>
    setInteractive((prev) => {
      const next = { ...prev, quizzes: { ...prev.quizzes, [id]: record } };
      persist(next);
      return next;
    });

  const recordExercise = (id: string, done: boolean) =>
    setInteractive((prev) => {
      const next = { ...prev, exercises: { ...prev.exercises, [id]: done } };
      persist(next);
      return next;
    });

  const updateNotes = (value: string) => {
    setNotes(value);
    setNotesSaving(true);
    setNotesError(false);
    if (nTimer.current) clearTimeout(nTimer.current);
    nTimer.current = setTimeout(async () => {
      try {
        await setLessonNotes(lessonId, value);
        setNotesError(false);
      } catch {
        // Never report "Saved" when the write failed.
        setNotesError(true);
      } finally {
        setNotesSaving(false);
      }
    }, 700);
  };

  return (
    <LessonContext.Provider
      value={{ lessonId, interactive, recordQuiz, recordExercise, notes, updateNotes, notesSaving, notesError }}
    >
      {children}
    </LessonContext.Provider>
  );
}

export { EMPTY as EMPTY_INTERACTIVE };
