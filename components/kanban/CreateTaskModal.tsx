"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskStatus, KanbanTask } from "./KanbanBoard";

interface CreateTaskModalProps {
  status: TaskStatus;
  projectId: string;
  workspaceId: string;
  members: { id: string; name: string | null; image: string | null }[];
  onClose: () => void;
  onCreated: (task: KanbanTask) => void;
}

const PRIORITIES = ["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"];
const LABELS = ["bug", "feature", "improvement", "documentation"];

export default function CreateTaskModal({
  status,
  projectId,
  workspaceId,
  members,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [label, setLabel] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.get("title"),
            description: form.get("description"),
            status,
            priority,
            label: label || null,
            assigneeId: assigneeId || null,
            dueDate: form.get("dueDate") || null,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onCreated(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* modal */}
      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <h2 className="text-white font-medium">Create task</h2>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Title
            </Label>
            <Input
              name="title"
              required
              placeholder="What needs to be done?"
              autoFocus
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              name="description"
              placeholder="Add more details..."
              rows={3}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Priority
              </Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444]"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Label
              </Label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444]"
              >
                <option value="">No label</option>
                {LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Assignee
              </Label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444]"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Due date
              </Label>
              <input
                type="date"
                name="dueDate"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444]"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
