import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { subDays } from "date-fns";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
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

  // gather all project data for AI analysis
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
          comments: { select: { id: true } },
        },
      },
      milestones: true,
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true } } },
  });

  // calculate metrics to send to AI
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const overdueTasks = project.tasks.filter(
    (t) => t.dueDate && new Date() > new Date(t.dueDate) && t.status !== "DONE",
  );
  const blockedTasks = project.tasks.filter((t) => t.status === "BACKLOG");
  const inProgressTasks = project.tasks.filter(
    (t) => t.status === "IN_PROGRESS",
  );

  // tasks stuck in progress for more than 3 days
  const stuckTasks = inProgressTasks.filter((t) => {
    const threeDaysAgo = subDays(new Date(), 3);
    return new Date(t.updatedAt) < threeDaysAgo;
  });

  // workload per member
  const workload = members.map((m) => ({
    name: m.user.name,
    assignedTasks: project.tasks.filter(
      (t) => t.assigneeId === m.user.id && t.status !== "DONE",
    ).length,
  }));

  const unassignedTasks = project.tasks.filter(
    (t) => !t.assigneeId && t.status !== "DONE",
  ).length;

  // build context for AI
  const projectContext = {
    projectName: project.name,
    status: project.status,
    totalTasks,
    completedTasks: doneTasks,
    completionRate:
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    overdueTasks: overdueTasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      daysOverdue: Math.floor(
        (new Date().getTime() - new Date(t.dueDate!).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    })),
    stuckTasks: stuckTasks.map((t) => ({
      title: t.title,
      assignee: t.assignee?.name || "Unassigned",
      priority: t.priority,
    })),
    workload,
    unassignedTasks,
    milestones: project.milestones.map((m) => ({
      name: m.name,
      status: m.status,
      dueDate: m.dueDate,
    })),
    backlogSize: blockedTasks.length,
  };

  const prompt = `You are an expert project manager analyzing a software project.
  
Analyze this project data and provide actionable insights:

${JSON.stringify(projectContext, null, 2)}

Respond with a JSON object in this EXACT format, no other text:
{
  "healthScore": <number 0-100>,
  "healthLabel": "<Healthy|At Risk|Critical>",
  "summary": "<2 sentence overall assessment>",
  "bottlenecks": [
    {
      "title": "<bottleneck name>",
      "description": "<specific description with numbers>",
      "severity": "<high|medium|low>"
    }
  ],
  "recommendations": [
    {
      "title": "<action title>",
      "description": "<specific actionable step>",
      "priority": "<immediate|soon|later>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      // low temperature — we want consistent, factual analysis not creative output
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content || "";

    // strip markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const analysis = JSON.parse(cleaned);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI analysis failed:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
