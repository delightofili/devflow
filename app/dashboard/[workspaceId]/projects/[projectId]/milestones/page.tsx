"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Plus, X, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useWorkspace } from "@/lib/context/workspace-context";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string | null;
}

const STATUS_CONFIG = {
  UPCOMING: { label: "Upcoming", color: "text-[#555] bg-[#1a1a1a]" },
  IN_PROGRESS: {
    label: "In progress",
    color: "text-yellow-400 bg-yellow-500/10",
  },
  COMPLETED: { label: "Completed", color: "text-green-400 bg-green-500/10" },
};

export default function MilestonesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { currentMember, workspace } = useWorkspace();

  const project = workspace?.projects.find((p) => p.id === projectId);
  const canManage =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/milestones`)
      .then((r) => r.json())
      .then((data) => {
        setMilestones(data);
        setLoading(false);
      });
  }, [workspaceId, projectId]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            dueDate: form.get("dueDate") || null,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMilestones((prev) => [...prev, data]);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(milestoneId: string, status: string) {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/milestones/${milestoneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestoneId ? { ...m, status: data.status } : m,
          ),
        );
      }
    } catch {}
  }

  async function handleDelete(milestoneId: string) {
    if (!confirm("Delete this milestone?")) return;
    try {
      await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/milestones/${milestoneId}`,
        { method: "DELETE" },
      );
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={`/dashboard/${workspaceId}/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-[#555] hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to project
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Milestones</h1>
          <p className="text-[#555] text-sm mt-0.5">
            {project?.name} — {milestones.length} milestone
            {milestones.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add milestone
          </Button>
        )}
      </div>

      {/* create form */}
      {showForm && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium text-sm">New milestone</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-[#555] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#888] text-xs uppercase tracking-wider">
                  Name
                </Label>
                <Input
                  name="name"
                  required
                  placeholder="v1.0 Launch"
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#888] text-xs uppercase tracking-wider">
                  Due date
                </Label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444] h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Description
              </Label>
              <Input
                name="description"
                placeholder="What gets shipped in this milestone?"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-9"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="bg-transparent border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
              >
                {creating ? "Creating..." : "Create milestone"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* milestones list */}
      {milestones.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] rounded-xl p-16 text-center">
          <h3 className="text-white font-medium mb-2">No milestones yet</h3>
          <p className="text-[#555] text-sm mb-6">
            Milestones help you track major project goals and deadlines.
          </p>
          {canManage && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add first milestone
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const config = STATUS_CONFIG[milestone.status];
            const isOverdue =
              milestone.dueDate &&
              new Date() > new Date(milestone.dueDate) &&
              milestone.status !== "COMPLETED";

            return (
              <div
                key={milestone.id}
                className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#2a2a2a] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-white font-medium text-sm">
                        {milestone.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    {milestone.description && (
                      <p className="text-[#555] text-xs mb-2">
                        {milestone.description}
                      </p>
                    )}

                    {milestone.dueDate && (
                      <p
                        className={`text-xs ${
                          isOverdue ? "text-red-400" : "text-[#444]"
                        }`}
                      >
                        Due {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                        {isOverdue && " — overdue"}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {milestone.status !== "COMPLETED" && (
                        <button
                          onClick={() =>
                            updateStatus(
                              milestone.id,
                              milestone.status === "UPCOMING"
                                ? "IN_PROGRESS"
                                : "COMPLETED",
                            )
                          }
                          className="flex items-center gap-1.5 text-[#555] hover:text-white text-xs border border-[#2a2a2a] hover:border-[#3a3a3a] px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          {milestone.status === "UPCOMING"
                            ? "Start"
                            : "Complete"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(milestone.id)}
                        className="text-[#333] hover:text-red-400 text-xs border border-[#2a2a2a] hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
