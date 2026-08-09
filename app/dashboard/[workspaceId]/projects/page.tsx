import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

export default async function ProjectsPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <p className="text-[#555] text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/${params.workspaceId}/projects/new`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
          <h3 className="text-white font-medium mb-2">No projects yet</h3>
          <p className="text-[#555] text-sm mb-6">
            Create your first project to start organizing tasks.
          </p>
          <Link
            href={`/dashboard/${params.workspaceId}/projects/new`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => {
            const done = project.tasks.filter(
              (t) => t.status === "DONE",
            ).length;
            const total = project._count.tasks;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Link
                key={project.id}
                href={`/dashboard/${params.workspaceId}/projects/${project.id}`}
                className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="text-white font-medium text-sm truncate">
                      {project.name}
                    </h3>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#555] transition-colors shrink-0" />
                </div>

                {project.description && (
                  <p className="text-[#555] text-xs mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#555]">
                    <span>
                      {done}/{total} tasks done
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4">
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
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
