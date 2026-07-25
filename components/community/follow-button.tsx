"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/lib/actions/community";
import { Button } from "@/components/ui/button";

/** Follow/unfollow toggle for a profile. Optimistic, reconciles with the server. */
export function FollowButton({
  username,
  initialFollowing,
}: {
  username: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function click() {
    if (pending) return;
    const prev = following;
    setFollowing((f) => !f);
    startTransition(async () => {
      try {
        const res = await toggleFollow(username);
        setFollowing(res.following);
      } catch {
        setFollowing(prev);
      }
    });
  }

  return (
    <Button onClick={click} disabled={pending} variant={following ? "outline" : "default"} size="sm">
      {following ? (
        <>
          <UserCheck className="size-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="size-4" /> Follow
        </>
      )}
    </Button>
  );
}
