import { redirect } from "next/navigation";

// The challenges list now lives inside the Learn tab as a fourth view, sharing
// the Make/Break toggle. A single challenge's solver stays at /challenges/[slug].
export default function ChallengesIndexRedirect() {
  redirect("/learn?view=challenges");
}
