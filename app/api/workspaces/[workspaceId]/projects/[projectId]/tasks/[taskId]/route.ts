import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { workspaceId: string; projectId: string; taskId: string };

export async function GET(_: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, projectId: params.projectId },
    include: {
      assignee: { select: { id: true, name: true, image: true, email: true } },
      creator: { select: { id: true, name: true, image: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
      subtasks: {
        include: {
          assignee: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const oldTask = await prisma.task.findUnique({
    where: { id: params.taskId },
  });

  const task = await prisma.task.update({
    where: { id: params.taskId },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

  // log status changes
  if (body.status && oldTask?.status !== body.status) {
    await prisma.activityLog.create({
      data: {
        action: `changed status to "${body.status}"`,
        entity: "task",
        userId: session.user.id,
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        taskId: task.id,
      },
    });

    // notify task creator of status change
    if (oldTask?.creatorId && oldTask.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "TASK_STATUS_CHANGED",
          title: "Task status updated",
          body: `"${task.title}" moved to ${body.status.replace("_", " ")}`,
          url: `/dashboard/${params.workspaceId}/projects/${params.projectId}/tasks/${task.id}`,
          userId: oldTask.creatorId,
        },
      });
    }
  }

  return NextResponse.json(task);
}

export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.task.delete({ where: { id: params.taskId } });
  return NextResponse.json({ success: true });
}
