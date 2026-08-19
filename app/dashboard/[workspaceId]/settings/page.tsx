"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/context/workspace-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { workspace, currentMember, refetch } = useWorkspace();

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const isOwner = currentMember?.role === "OWNER";
  const canEdit =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Workspace updated successfully");
      refetch();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this workspace?")) return;
    setLeaveLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/leave`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setLeaveLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== workspace?.name) {
      setError("Workspace name does not match");
      return;
    }

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workspace");
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setDeleteLoading(false);
    }
  }

  const inputClass =
    "bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10";

  return (
    <div className="space-y-10">
      {/* general settings */}
      <section>
        <h2 className="text-white font-medium mb-1">General</h2>
        <p className="text-[#555] text-sm mb-5">
          Update your workspace name and description
        </p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Workspace name
            </Label>
            <Input
              name="name"
              required
              defaultValue={workspace?.name}
              disabled={!canEdit}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              name="description"
              defaultValue={workspace?.description || ""}
              disabled={!canEdit}
              rows={3}
              placeholder="What does your team work on?"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] resize-none"
            />
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

          {canEdit && (
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

      {/* workspace info */}
      <section>
        <h2 className="text-white font-medium mb-4">Workspace info</h2>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl divide-y divide-[#1a1a1a]">
          {[
            { label: "Workspace ID", value: workspaceId },
            { label: "Slug", value: workspace?.slug },
            { label: "Members", value: workspace?._count.members },
            { label: "Projects", value: workspace?._count.projects },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-[#555] text-sm">{item.label}</span>
              <span className="text-[#888] text-sm font-mono">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* danger zone */}
      <section>
        <h2 className="text-white font-medium mb-1">Danger zone</h2>
        <p className="text-[#555] text-sm mb-5">
          These actions are irreversible. Please be careful.
        </p>

        <div className="border border-red-500/20 rounded-xl overflow-hidden">
          {/* leave workspace */}
          {!isOwner && (
            <div className="flex items-center justify-between p-4 border-b border-red-500/10">
              <div>
                <p className="text-white text-sm font-medium">
                  Leave workspace
                </p>
                <p className="text-[#555] text-xs mt-0.5">
                  You will lose access to all projects and tasks
                </p>
              </div>
              <Button
                onClick={handleLeave}
                disabled={leaveLoading}
                variant="outline"
                className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-sm h-9"
              >
                {leaveLoading ? "Leaving..." : "Leave workspace"}
              </Button>
            </div>
          )}

          {/* delete workspace — owners only */}
          {isOwner && (
            <div className="p-4">
              <div className="mb-4">
                <p className="text-white text-sm font-medium">
                  Delete workspace
                </p>
                <p className="text-[#555] text-xs mt-0.5">
                  Permanently delete this workspace and all its data. This
                  cannot be undone.
                </p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[#555] text-xs">
                    Type{" "}
                    <span className="text-white font-mono">
                      {workspace?.name}
                    </span>{" "}
                    to confirm
                  </Label>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={workspace?.name}
                    className="bg-[#1a1a1a] border-red-500/20 text-white placeholder:text-[#333] focus:border-red-500/50 h-10"
                  />
                </div>
                <Button
                  onClick={handleDelete}
                  disabled={deleteLoading || deleteConfirm !== workspace?.name}
                  variant="outline"
                  className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-30 text-sm h-9"
                >
                  {deleteLoading
                    ? "Deleting..."
                    : "Delete workspace permanently"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
