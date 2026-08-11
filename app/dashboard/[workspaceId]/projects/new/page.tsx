"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = Array.isArray(params.workspaceId)
    ? params.workspaceId[0]
    : (params.workspaceId as string);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [color, setColor] = useState("#2563eb");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/dashboard/${workspaceId}/projects/${data.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link
        href={`/dashboard/${workspaceId}/projects`}
        className="inline-flex items-center gap-2 text-[#555] hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">
          Create a project
        </h1>
        <p className="text-[#555] text-sm">
          Projects contain tasks, a Kanban board, and a team chat channel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-[#888] text-xs uppercase tracking-wider">
            Project name
          </Label>
          <Input
            name="name"
            required
            placeholder="Frontend redesign"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#888] text-xs uppercase tracking-wider">
            Description{" "}
            <span className="text-[#444] normal-case tracking-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            name="description"
            placeholder="What is this project about?"
            rows={3}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#888] text-xs uppercase tracking-wider">
            Color
          </Label>
          <div className="flex items-center gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <span className="flex items-center justify-center text-white text-xs">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="bg-transparent border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Creating..." : "Create project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
