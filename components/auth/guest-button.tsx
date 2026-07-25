"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

/**
 * Starts a no-account guest session and drops the user into the app. Progress
 * is tracked under a cookie-backed anonymous account they can later claim.
 */
export function GuestButton({
  label = "Start learning free",
  showArrow = true,
  ...props
}: { label?: string; showArrow?: boolean } & ButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function start() {
    setLoading(true);
    setError(false);
    try {
      const res = await signIn("guest", { redirect: false });
      if (res && !res.error) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <>
      <Button onClick={start} disabled={loading} {...props}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {label}
        {showArrow && !loading ? <ArrowRight className="size-4" /> : null}
      </Button>
      {error ? (
        <p className="text-xs text-destructive">
          Could not start a session. Check your connection and try again.
        </p>
      ) : null}
    </>
  );
}
