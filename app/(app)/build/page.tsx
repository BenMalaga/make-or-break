import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Workbench } from "@/components/build/workbench";

export const metadata: Metadata = { title: "Build" };

export default async function BuildPage() {
  await requireUser();
  // Just the IDE and the terminal, filling all the room the shell gives it.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Workbench />
    </div>
  );
}
