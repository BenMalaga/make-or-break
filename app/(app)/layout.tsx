import { requireUser } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MainContainer } from "@/components/layout/main-container";
import { Copilot } from "@/components/ai/copilot";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          user={{
            username: user.username,
            image: user.image,
            points: user.points,
            rankTitle: user.rankTitle,
            streakCount: user.streakCount,
          }}
        />
        <main className="min-h-0 flex-1">
          <MainContainer isGuest={user.isGuest}>{children}</MainContainer>
        </main>
      </div>
      <Copilot />
    </div>
  );
}
