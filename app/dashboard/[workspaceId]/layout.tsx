import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WorkspaceProvider } from "@/lib/context/workspace-context";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { useState } from "react";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <WorkspaceProvider userId={session.user.id}>
      <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`
        fixed lg:relative z-40 h-full transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        >
          <Sidebar
            userId={session.user.id}
            userName={session.user.name || ""}
            userImage={session.user.image || ""}
          />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            userName={session.user.name || ""}
            userImage={session.user.image || ""}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
