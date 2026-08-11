import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { workspaceId, projectId } = await params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId: projectId,
      parentId: null,
      // only top-level tasks — subtasks are fetched with their parent
    },
    include: {
      assignee: {
        select: { id: true, name: true, image: true },
      },
      subtasks: {
        include: {
          assignee: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  const { workspaceId, projectId } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  // get the highest order in this status column
  // so new task appears at the bottom of its column
  const lastTask = await prisma.task.findFirst({
    where: {
      projectId: projectId,
      status: parsed.data.status || "BACKLOG",
    },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      projectId: projectId,
      creatorId: session.user.id,
      order: (lastTask?.order || 0) + 1,
    },
    include: {
      assignee: {
        select: { id: true, name: true, image: true },
      },
      _count: { select: { comments: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      action: `created task "${task.title}"`,
      entity: "task",
      userId: session.user.id,
      workspaceId: workspaceId,
      projectId: projectId,
      taskId: task.id,
    },
  });

  // notify assignee if different from creator
  if (task.assigneeId && task.assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        body: `You were assigned to "${task.title}"`,
        url: `/dashboard/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
        userId: task.assigneeId,
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
