import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format, eachDayOfInterval } from "date-fns";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  const [
    totalTasks,
    completedTasks,
    overdueTasks,
    totalProjects,
    totalMembers,
    recentTasks,
    memberWorkload,
    projectProgress,
  ] = await Promise.all([
    // total tasks in workspace
    prisma.task.count({
      where: { project: { workspaceId } },
    }),

    // completed tasks
    prisma.task.count({
      where: { project: { workspaceId }, status: "DONE" },
    }),

    // overdue tasks
    prisma.task.count({
      where: {
        project: { workspaceId },
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    }),

    // total projects
    prisma.project.count({ where: { workspaceId } }),

    // total members
    prisma.workspaceMember.count({ where: { workspaceId } }),

    // tasks created in last 30 days — for the chart
    prisma.task.findMany({
      where: {
        project: { workspaceId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    }),

    // tasks per member — workload distribution
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        project: { workspaceId },
        assigneeId: { not: null },
        status: { not: "DONE" },
      },
      _count: { id: true },
    }),

    // progress per project
    prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { tasks: true } },
        tasks: { select: { status: true } },
      },
    }),
  ]);

  // build tasks created per day chart data
  const days = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: new Date(),
  });

  const tasksPerDay = days.map((day) => {
    const dayStr = format(day, "MMM d");
    const created = recentTasks.filter(
      (t) => format(new Date(t.createdAt), "MMM d") === dayStr,
    ).length;
    const completed = recentTasks.filter(
      (t) =>
        t.status === "DONE" &&
        format(new Date(t.createdAt), "MMM d") === dayStr,
    ).length;

    return { date: dayStr, created, completed };
  });

  // only return last 14 days for cleaner chart
  const chartData = tasksPerDay.slice(-14);

  // get assignee names for workload chart
  const assigneeIds = memberWorkload
    .map((w) => w.assigneeId)
    .filter(Boolean) as string[];

  const assignees = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });

  const workloadData = memberWorkload.map((w) => ({
    name: assignees.find((a) => a.id === w.assigneeId)?.name || "Unknown",
    tasks: w._count.id,
  }));

  // project progress data
  const projectData = projectProgress.map((p) => ({
    name: p.name,
    color: p.color,
    total: p._count.tasks,
    done: p.tasks.filter((t) => t.status === "DONE").length,
    progress:
      p._count.tasks > 0
        ? Math.round(
            (p.tasks.filter((t) => t.status === "DONE").length /
              p._count.tasks) *
              100,
          )
        : 0,
  }));

  return NextResponse.json({
    stats: {
      totalTasks,
      completedTasks,
      overdueTasks,
      totalProjects,
      totalMembers,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    chartData,
    workloadData,
    projectData,
  });
}
