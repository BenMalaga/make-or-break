"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Shown only for providers configured via env (flags passed from the server
 * page). Credentials sign-in always works without any of these.
 */
export function OAuthButtons({
  github,
  google,
  callbackUrl = "/dashboard",
}: {
  github: boolean;
  google: boolean;
  callbackUrl?: string;
}) {
  if (!github && !google) return null;
  return (
    <div className="space-y-2">
      {github ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signIn("github", { callbackUrl })}
        >
          Continue with GitHub
        </Button>
      ) : null}
      {google ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          {/* lucide has no brand marks; a neutral label keeps it honest */}
          Continue with Google
        </Button>
      ) : null}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
}
