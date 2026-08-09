import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validations";

type Params = { workspaceId: string; projectId: string; taskId: string };

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = commentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      taskId: params.taskId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  // notify task assignee about new comment
  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    select: { assigneeId: true, title: true, creatorId: true },
  });

  const notifyUsers = new Set(
    [task?.assigneeId, task?.creatorId].filter(Boolean),
  );
  notifyUsers.delete(session.user.id);
  // don't notify the person who commented

  for (const userId of notifyUsers) {
    if (userId) {
      await prisma.notification.create({
        data: {
          type: "TASK_COMMENTED",
          title: "New comment",
          body: `Someone commented on "${task?.title}"`,
          url: `/dashboard/${params.workspaceId}/projects/${params.projectId}/tasks/${params.taskId}`,
          userId,
        },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      action: "added a comment",
      entity: "task",
      userId: session.user.id,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      taskId: params.taskId,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
