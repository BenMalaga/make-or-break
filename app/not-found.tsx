import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Root 404. Covers a notFound() thrown in any of the dynamic routes as well as
 * unknown URLs, with a themed page instead of Next's unstyled default 404.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground">
      <p className="font-mono text-6xl font-bold text-primary">404</p>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">This page does not exist</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The link may be broken or the page may have moved. Everything you have learned is still
          saved.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
