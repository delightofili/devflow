import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const milestoneSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

type Params = Promise<{ workspaceId: string; projectId: string }>;

export async function GET(_: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId } = await params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, projectId } = await params;

  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = milestoneSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const milestone = await prisma.milestone.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      projectId,
    },
  });

  return NextResponse.json(milestone, { status: 201 });
}
