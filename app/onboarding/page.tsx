"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  const previewSlug = name ? slugify(name) : "your-workspace";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/dashboard/${data.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="text-white font-semibold">DevFlow</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Create your workspace
          </h1>
          <p className="text-[#888] text-sm">
            A workspace is where your team manages projects and tasks. You can
            invite members after setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Workspace name
            </Label>
            <Input
              name="name"
              required
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
            />
            {name && (
              <p className="text-[#555] text-xs mt-1">
                URL: devflow.app/
                <span className="text-[#888]">{previewSlug}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Description{" "}
              <span className="text-[#555] normal-case tracking-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              name="description"
              placeholder="What does your team work on?"
              rows={3}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium"
          >
            {loading ? "Creating workspace..." : "Create workspace →"}
          </Button>
        </form>

        <p className="text-[#555] text-xs text-center mt-8">
          You can create or join more workspaces later
        </p>
      </div>
    </div>
  );
}
