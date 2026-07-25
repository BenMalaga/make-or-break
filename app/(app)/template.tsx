"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// A template re-mounts on every navigation, so this gives each page a quick
// fade + rise as you move around the app. On the Build tab it also needs to pass
// height through (flex column) so the IDE and terminal can fill the screen.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const full =
    pathname.startsWith("/build") ||
    /^\/challenges\/(?!new)[^/]+/.test(pathname) ||
    /^\/messages\/[^/]+/.test(pathname);
  return (
    <motion.div
      className={full ? "flex min-h-0 flex-1 flex-col" : undefined}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
