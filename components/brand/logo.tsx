import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand mark: the shield/break icon + "make or break" wordmark, with the "or"
 * in the purple accent. The icon lives at public/logo.png (also the favicon +
 * apple icon via app/icon.png + app/apple-icon.png).
 */
export function Logo({
  href = "/",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Make or Break"
        width={32}
        height={32}
        priority
        className="size-8"
      />
      {showText ? (
        <span className="font-mono text-base font-semibold tracking-tight">
          make <span className="text-primary">or</span> break
          <span
            aria-hidden
            className="ml-0.5 text-primary"
            style={{ animation: "cursor-blink 1.1s step-end infinite" }}
          >
            _
          </span>
        </span>
      ) : null}
    </Link>
  );
}
