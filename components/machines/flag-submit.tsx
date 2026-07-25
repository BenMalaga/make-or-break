"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitFlag } from "@/lib/actions/machines";
import { cn } from "@/lib/utils";

export function FlagSubmit({
  machineId,
  userOwned,
  rootOwned,
}: {
  machineId: string;
  userOwned: boolean;
  rootOwned: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    start(async () => {
      const res = await submitFlag(machineId, value);
      switch (res.result) {
        case "CORRECT":
          toast.success(
            `${res.flagLabel} captured. +${res.points} pts${res.firstBlood ? " - FIRST BLOOD!" : ""}`,
          );
          setValue("");
          router.refresh();
          break;
        case "DUPLICATE":
          toast.info(`You already own ${res.flagLabel}.`);
          break;
        case "RATE_LIMITED":
          toast.error("Slow down - too many attempts. Try again shortly.");
          break;
        default:
          toast.error("Incorrect flag.");
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Flag className="size-4 text-primary" /> Submit flag
        </h3>
        <div className="flex gap-2 text-xs">
          <span className={cn("flex items-center gap-1 rounded px-2 py-1", userOwned ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
            {userOwned ? <Check className="size-3" /> : <Lock className="size-3" />} user
          </span>
          <span className={cn("flex items-center gap-1 rounded px-2 py-1", rootOwned ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
            {rootOwned ? <Check className="size-3" /> : <Lock className="size-3" />} root
          </span>
        </div>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="MOB{...} or the hash you found"
          className="font-mono"
          disabled={pending || (userOwned && rootOwned)}
        />
        <Button type="submit" disabled={pending || (userOwned && rootOwned)}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Submit"}
        </Button>
      </form>
      {userOwned && rootOwned ? (
        <p className="mt-2 text-sm text-success">You have fully owned this machine. Nice.</p>
      ) : null}
    </div>
  );
}
