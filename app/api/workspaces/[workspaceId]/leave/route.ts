import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not a member" }, { status: 404 });
  }

  if (member.role === "OWNER") {
    return NextResponse.json(
      {
        error:
          "Owners cannot leave. Transfer ownership or delete the workspace.",
      },
      { status: 400 },
    );
  }

  await prisma.workspaceMember.delete({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
