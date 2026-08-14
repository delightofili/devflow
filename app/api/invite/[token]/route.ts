import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
    },
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
    return NextResponse.json(
      { error: "Invitation has expired" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    workspace: invitation.workspace,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  });
}
