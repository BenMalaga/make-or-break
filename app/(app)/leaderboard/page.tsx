import { redirect } from "next/navigation";

// The leaderboard now lives under the Community tab.
export default function LeaderboardRedirect() {
  redirect("/community/leaderboard");
}
