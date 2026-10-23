"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { POINTS } from "@/lib/gamification/points";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

export function LessonCompleteButton({ lessonSlug }: { lessonSlug: string }) {
  const hydrated = useProgressHydrated();
  const lessons = useProgress((s) => s.lessons);
  const completed = hydrated && Boolean(lessons[lessonSlug]?.completedAt);

  function toggle() {
    if (completed) {
      useProgress.getState().reopenLesson(lessonSlug);
      return;
    }
    // completeLesson is idempotent, so the points toast only fires on the
    // transition into completed.
    const badges = useProgress.getState().completeLesson(lessonSlug);
    toast.success(`Lesson complete. +${POINTS.LESSON_COMPLETE} points.`);
    if (badges.length) toast.success(`Badge earned: ${badges.length} new`);
  }

  return (
    <Button onClick={toggle} variant={completed ? "outline" : "default"} size="lg">
      {completed ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <Circle className="size-4" />
      )}
      {completed ? "Completed" : "Mark complete"}
    </Button>
  );
}
