import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { workspaceId, projectId } = await params;

  const { taskId, newStatus, newOrder } = await req.json();
  // taskId — which task moved
  // newStatus — which column it moved to
  // newOrder — its position in the new column

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

  const updated = await prisma.task.updateMany({
    where: { id: taskId, projectId: projectId },
    data: { status: newStatus, order: newOrder },
  });
  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Task not found in this project" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
