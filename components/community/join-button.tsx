"use client";

import { useState, useTransition } from "react";
import { toggleMembership } from "@/lib/actions/community";
import { Button } from "@/components/ui/button";

/** Join / leave toggle for a community. Optimistic. */
export function JoinButton({
  communityId,
  initialJoined,
  size = "sm",
}: {
  communityId: string;
  initialJoined: boolean;
  size?: "sm" | "default";
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();

  function click(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setJoined((j) => !j);
    startTransition(async () => {
      const res = await toggleMembership(communityId);
      setJoined(res.joined);
    });
  }

  return (
    <Button
      type="button"
      onClick={click}
      size={size}
      variant={joined ? "outline" : "default"}
    >
      {joined ? "Joined" : "Join"}
    </Button>
  );
}
