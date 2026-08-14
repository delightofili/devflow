import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: "Invitation already used" },
      { status: 400 },
    );
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { token },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
  }

  if (invitation.email !== session.user.email) {
    return NextResponse.json(
      { error: "This invitation is for a different email" },
      { status: 403 },
    );
  }

  await Promise.all([
    prisma.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { token },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    workspaceId: invitation.workspaceId,
  });
}
