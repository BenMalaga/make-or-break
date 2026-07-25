import { redirect } from "next/navigation";

// The write-ups feed now lives under the Community tab. The editor
// (/writeups/new) and individual write-ups (/writeups/[id]) stay where they are.
export default function WriteupsRedirect() {
  redirect("/community/writeups");
}
