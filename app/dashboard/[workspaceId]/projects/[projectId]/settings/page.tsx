"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/context/workspace-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const PROJECT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#c2410c",
  "#4f46e5",
  "#be185d",
];

const PROJECT_STATUSES = [
  { value: "ACTIVE", label: "Active", description: "Project is ongoing" },
  { value: "PAUSED", label: "Paused", description: "Temporarily on hold" },
  { value: "COMPLETED", label: "Completed", description: "Work is finished" },
  {
    value: "ARCHIVED",
    label: "Archived",
    description: "Hidden from main view",
  },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { currentMember, workspace } = useWorkspace();

  const project = workspace?.projects.find((p) => p.id === projectId);

  const [color, setColor] = useState(project?.color || "#2563eb");
  const [status, setStatus] = useState(project?.status || "ACTIVE");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const canManage =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            color,
            status,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Project updated");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== project?.name) {
      setError("Project name does not match");
      return;
    }

    setDeleteLoading(true);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error("Failed to delete project");
      router.push(`/dashboard/${workspaceId}/projects`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setDeleteLoading(false);
    }
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-[#555] text-sm">Project not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={`/dashboard/${workspaceId}/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-[#555] hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to project
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Project settings</h1>
        <p className="text-[#555] text-sm mt-1">
          Manage settings for{" "}
          <span className="text-[#888]">{project.name}</span>
        </p>
      </div>

      <div className="space-y-10">
        {/* general */}
        <section>
          <h2 className="text-white font-medium mb-1">General</h2>
          <p className="text-[#555] text-sm mb-5">Update project details</p>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Project name
              </Label>
              <Input
                name="name"
                required
                defaultValue={project.name}
                disabled={!canManage}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                name="description"
                defaultValue={project.description || ""}
                disabled={!canManage}
                rows={3}
                placeholder="What is this project about?"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] resize-none"
              />
            </div>

            {/* color picker */}
            <div className="space-y-2">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Color
              </Label>
              <div className="flex items-center gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => canManage && setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f]"
                        : ""
                    } ${!canManage ? "cursor-not-allowed opacity-50" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* status */}
            <div className="space-y-2">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Status
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PROJECT_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => canManage && setStatus(s.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      status === s.value
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
                    } ${!canManage ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        status === s.value ? "text-blue-400" : "text-[#888]"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className="text-[#444] text-xs mt-0.5">
                      {s.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            {canManage && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
              >
                {loading ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form>
        </section>

        <div className="border-t border-[#1a1a1a]" />

        {/* danger zone */}
        {canManage && (
          <section>
            <h2 className="text-white font-medium mb-1">Danger zone</h2>
            <p className="text-[#555] text-sm mb-5">
              Deleting a project permanently removes all tasks, comments, and
              files. This cannot be undone.
            </p>

            <div className="border border-red-500/20 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-white text-sm font-medium">Delete project</p>
                <p className="text-[#555] text-xs mt-0.5">
                  All tasks and data will be permanently deleted
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#555] text-xs">
                  Type{" "}
                  <span className="text-white font-mono">{project.name}</span>{" "}
                  to confirm
                </Label>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={project.name}
                  className="bg-[#1a1a1a] border-red-500/20 text-white placeholder:text-[#333] focus:border-red-500/50 h-10"
                />
              </div>

              <Button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirm !== project.name}
                variant="outline"
                className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-30 text-sm h-9"
              >
                {deleteLoading ? "Deleting..." : "Delete project permanently"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
