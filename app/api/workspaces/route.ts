import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { workspaceSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      _count: {
        select: { projects: true, members: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = workspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;
  let slug = slugify(name);
  const existing = await prisma.workspace.findUnique({
    where: { slug },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      members: true,
      _count: { select: { projects: true, members: true } },
    },
  });
  //log this activity
  await prisma.activityLog.create({
    data: {
      action: "created_workspace",
      entity: "workspace",
      userId: session.user.id,
      workspaceId: workspace.id,
    },
  });
  return NextResponse.json(workspace, { status: 201 });
}
