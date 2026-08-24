import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { Settings, Flag } from "lucide-react";
import Link from "next/link";
import ChatToggle from "@/components/chat/ChatToggle";
import OnlinePresence from "@/components/dashboard/OnlinePresesnce";
import ProjectAnalysis from "@/components/ai/ProjectAnalysis";

interface PageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId, projectId } = await params;

  const [project, workspace] = await Promise.all([
    prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: workspaceId,
      },
      include: {
        tasks: {
          where: { parentId: null },
          include: {
            assignee: {
              select: { id: true, name: true, image: true },
            },
            _count: { select: { comments: true } },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    }),
  ]);

  if (!project) redirect(`/dashboard/${workspaceId}`);

  const members = workspace?.members.map((m) => m.user) || [];

  const taskCounts = {
    total: project._count.tasks,
    done: project.tasks.filter((t) => t.status === "DONE").length,
  };

  const progress =
    taskCounts.total > 0
      ? Math.round((taskCounts.done / taskCounts.total) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* project header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-[#555] text-sm">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* progress */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[#555] text-xs">
              {taskCounts.done}/{taskCounts.total}
            </span>
          </div>

          <OnlinePresence members={members} />

          <Link
            href={`/dashboard/${workspaceId}/projects/${projectId}/settings`}
            className="text-[#555] hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <Link
            href={`/dashboard/${workspaceId}/projects/${projectId}/milestones`}
            className="flex items-center gap-1.5 text-[#555] hover:text-white text-xs transition-colors border border-[#2a2a2a] hover:border-[#3a3a3a] px-2.5 py-1.5 rounded-lg"
          >
            <Flag className="w-3.5 h-3.5" />
            Milestones
          </Link>

          <ChatToggle
            projectId={projectId}
            workspaceId={workspaceId}
            projectName={project.name}
          />

          <ProjectAnalysis projectId={projectId} workspaceId={workspaceId} />
        </div>
      </div>

      {/* kanban board */}
      <KanbanBoard
        projectId={projectId}
        workspaceId={workspaceId}
        initialTasks={project.tasks}
        members={members}
      />
    </div>
  );
}
