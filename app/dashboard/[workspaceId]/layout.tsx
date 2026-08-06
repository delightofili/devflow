import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkspaceProvider } from "@/lib/context/workspace-context";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <WorkspaceProvider userId={session.user.id}>
      <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
        <Sidebar
          userId={session.user.id}
          userName={session.user.name || ""}
          userImage={session.user.image || ""}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            userName={session.user.name || ""}
            userImage={session.user.image || ""}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
