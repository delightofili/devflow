import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";

async function checkMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

export async function GET(
  _: NextRequest,
  { params }: { params: { workspaceId: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await checkMembership(params.workspaceId, session.user.id);
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      _count: {
        select: { tasks: true },
      },
      tasks: {
        where: { status: "IN_PROGRESS" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await checkMembership(params.workspaceId, session.user.id);
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      workspaceId: params.workspaceId,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: `created project "${project.name}"`,
      entity: "project",
      userId: session.user.id,
      workspaceId: params.workspaceId,
      projectId: project.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
