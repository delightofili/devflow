import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardRootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // find the first workspace this user belongs to
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) {
    // user has no workspace yet — send to onboarding
    redirect("/onboarding");
  }

  // redirect to their first workspace
  redirect(`/dashboard/${membership.workspaceId}`);
}
