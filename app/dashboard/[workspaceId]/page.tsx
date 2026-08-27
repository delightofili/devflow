"use client";
import { useWorkspace } from "@/lib/context/workspace-context";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderKanban, Users, Plus, ArrowRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}): Promise<Metadata> {
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  return {
    title: workspace?.name || "Dashboard",
    description: `${workspace?.name} workspace on DevFlow`,
  };
}

export default function DashboardPage() {
  const { workspace, loading } = useWorkspace();
  const { data: session } = useSession();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-[#1a1a1a] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const stats = [
    {
      label: "Projects",
      value: workspace?._count.projects || 0,
      icon: FolderKanban,
      href: `/dashboard/${workspaceId}/projects`,
    },
    {
      label: "Members",
      value: workspace?._count.members || 0,
      icon: Users,
      href: `/dashboard/${workspaceId}/members`,
    },
  ];

  return (
    <div className="max-w-4xl">
      {/* greeting */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">
          Good morning, {firstName}
        </h1>
        <p className="text-[#555] text-sm">
          Here&apos;s what&apos;s happening in{" "}
          <span className="text-[#888]">{workspace?.name}</span>
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-4 h-4 text-[#555]" />
                <ArrowRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#555] transition-colors" />
              </div>
              <div className="text-2xl font-semibold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-[#555] text-sm">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      {/* empty state — projects */}
      {workspace?.projects.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] rounded-xl p-12 text-center">
          <FolderKanban className="w-8 h-8 text-[#333] mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No projects yet</h3>
          <p className="text-[#555] text-sm mb-6 max-w-xs mx-auto">
            Create your first project to start managing tasks with your team.
          </p>
          <Link
            href={`/dashboard/${workspaceId}/projects/new`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create first project
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider">
              Projects
            </h2>
            <Link
              href={`/dashboard/${workspaceId}/projects/new`}
              className="flex items-center gap-1.5 text-[#555] hover:text-white text-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New project
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {workspace?.projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${workspaceId}/projects/${project.id}`}
                className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors group"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-white text-sm font-medium truncate">
                    {project.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      project.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-500"
                        : project.status === "PAUSED"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-[#2a2a2a] text-[#555]"
                    }`}
                  >
                    {project.status.toLowerCase()}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#555] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* members preview */}
      {workspace && workspace.members.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider">
              Team
            </h2>
            <Link
              href={`/dashboard/${workspaceId}/members`}
              className="text-[#555] hover:text-white text-sm transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {workspace.members.slice(0, 8).map((member) => (
              <div
                key={member.id}
                title={member.user.name || member.user.email}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#0f0f0f]"
              >
                {member.user.image ? (
                  <img
                    src={member.user.image}
                    alt={member.user.name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-xs font-medium text-[#888]">
                    {getInitials(member.user.name || member.user.email)}
                  </div>
                )}
              </div>
            ))}
            {workspace.members.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#0f0f0f] flex items-center justify-center text-xs text-[#555]">
                +{workspace.members.length - 8}
              </div>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-4">
              Recent activity
            </h2>
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
              <ActivityFeed workspaceId={workspaceId} limit={10} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
