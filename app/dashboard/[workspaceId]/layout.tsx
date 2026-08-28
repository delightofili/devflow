import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkspaceProvider } from "@/lib/context/workspace-context";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <WorkspaceProvider userId={session.user.id}>
      <DashboardShell
        userId={session.user.id}
        userName={session.user.name || ""}
        userImage={session.user.image || ""}
      >
        {children}
      </DashboardShell>
    </WorkspaceProvider>
  );
}
