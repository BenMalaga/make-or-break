"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { submitNewCommunity } from "@/lib/actions/community";
import { Button } from "@/components/ui/button";
import { PendingButton } from "./pending-button";

/** Create-community form. useFormState keeps the fields on a validation error. */
export function NewCommunityForm() {
  const [state, action] = useFormState(submitNewCommunity, { error: null });

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={60}
          placeholder="Reverse Engineering"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          URL name
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/community/c/</span>
          <input
            id="slug"
            name="slug"
            maxLength={32}
            placeholder="reverse-engineering"
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. Leave blank to use the name.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="What is this community about?"
          className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/community">Cancel</Link>
        </Button>
        <PendingButton pendingLabel="Creating">Create community</PendingButton>
      </div>
    </form>
  );
}
