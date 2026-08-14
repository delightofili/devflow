import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { inviteSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const requester = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });

  if (!requester || !["OWNER", "ADMIN"].includes(requester.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: existingUser.id, workspaceId },
      },
    });

    if (alreadyMember) {
      return NextResponse.json(
        { error: "This user is already a member" },
        { status: 409 },
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    await prisma.workspaceMember.create({
      data: { userId: existingUser.id, workspaceId, role },
    });

    await prisma.notification.create({
      data: {
        type: "MEMBER_INVITED",
        title: "You joined a workspace",
        body: `You were added to "${workspace?.name}"`,
        url: `/dashboard/${workspaceId}`,
        userId: existingUser.id,
      },
    });

    return NextResponse.json({ success: true, type: "added_directly" });
  }

  // user doesn't exist yet — create invitation
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  // invitation expires in 7 days

  const invitation = await prisma.invitation.create({
    data: {
      email,
      role,
      workspaceId,
      expiresAt: expires,
    },
  });

  // in production you'd send an email here with the invitation link
  // for now just return the token so you can test it
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

  return NextResponse.json({
    success: true,
    type: "invitation_sent",
    inviteUrl,
    // remove inviteUrl from production response — only send via email
  });
}
