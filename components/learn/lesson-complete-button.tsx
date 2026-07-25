"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markLessonComplete, markLessonIncomplete } from "@/lib/actions/progress";

export function LessonCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (completed) {
        await markLessonIncomplete(lessonId);
        setCompleted(false);
      } else {
        const res = await markLessonComplete(lessonId);
        setCompleted(true);
        if (res.awarded > 0) toast.success(`Lesson complete. +${res.awarded} points.`);
        else toast.success("Lesson complete.");
        if (res.badges?.length) toast.success(`Badge earned: ${res.badges.length} new`);
      }
      router.refresh();
    });
  }

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={completed ? "outline" : "default"}
      size="lg"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : completed ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <Circle className="size-4" />
      )}
      {completed ? "Completed" : "Mark complete"}
    </Button>
  );
}
