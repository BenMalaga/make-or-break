import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MainContainer } from "@/components/layout/main-container";
import { Copilot } from "@/components/ai/copilot";

// No accounts and no session: the shell renders for everyone, and progress
// (points, streak) lives in the browser via lib/progress/store.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="min-h-0 flex-1">
          <MainContainer>{children}</MainContainer>
        </main>
      </div>
      <Copilot />
    </div>
  );
}
