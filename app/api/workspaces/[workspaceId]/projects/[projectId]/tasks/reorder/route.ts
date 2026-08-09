import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string; projectId: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, newStatus, newOrder } = await req.json();
  // taskId — which task moved
  // newStatus — which column it moved to
  // newOrder — its position in the new column

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, order: newOrder },
  });

  return NextResponse.json({ success: true });
}
