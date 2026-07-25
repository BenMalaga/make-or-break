import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-grid">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="p-4 text-center text-xs text-muted-foreground">
        By continuing you agree to only test systems you own or are authorized to attack.{" "}
        <Link href="/rules" className="underline underline-offset-4">
          Rules of engagement
        </Link>
      </footer>
    </div>
  );
}
