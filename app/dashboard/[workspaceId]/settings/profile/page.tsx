"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count: {
    ownedWorkspaces: number;
    createdTasks: number;
    comments: number;
  };
}

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfile((prev) => (prev ? { ...prev, name: data.name } : prev));

      // update the NextAuth session so the name updates in the sidebar
      await update({ name: data.name });

      setSuccess("Profile updated successfully");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 w-16 rounded-full bg-[#1a1a1a] animate-pulse" />
        <div className="h-10 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="h-10 bg-[#1a1a1a] rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* avatar + name */}
      <section>
        <h2 className="text-white font-medium mb-1">Profile</h2>
        <p className="text-[#555] text-sm mb-5">
          Update your personal information
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            {profile?.image ? (
              <img
                src={profile.image}
                alt={profile.name || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-xl font-medium text-[#888]">
                {getInitials(profile?.name || profile?.email || "U")}
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-medium">{profile?.name}</p>
            <p className="text-[#555] text-sm">{profile?.email}</p>
            {profile?.image && (
              <p className="text-[#444] text-xs mt-1">
                Avatar synced from Google
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Full name
            </Label>
            <Input
              name="name"
              required
              defaultValue={profile?.name || ""}
              placeholder="Your name"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Email address
            </Label>
            <Input
              value={profile?.email || ""}
              disabled
              className="bg-[#111] border-[#1a1a1a] text-[#555] h-10 cursor-not-allowed"
            />
            <p className="text-[#444] text-xs">Email cannot be changed</p>
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

          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* account stats */}
      <section>
        <h2 className="text-white font-medium mb-4">Account stats</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Workspaces owned",
              value: profile?._count.ownedWorkspaces,
            },
            {
              label: "Tasks created",
              value: profile?._count.createdTasks,
            },
            {
              label: "Comments made",
              value: profile?._count.comments,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-semibold text-white mb-1">
                {stat.value || 0}
              </div>
              <div className="text-[#555] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-[#1a1a1a]" />

      {/* account info */}
      <section>
        <h2 className="text-white font-medium mb-4">Account info</h2>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl divide-y divide-[#1a1a1a]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[#555] text-sm">Member since</span>
            <span className="text-[#888] text-sm">
              {profile?.createdAt
                ? format(new Date(profile.createdAt), "MMMM d, yyyy")
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[#555] text-sm">Account ID</span>
            <span className="text-[#444] text-xs font-mono">{profile?.id}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[#555] text-sm">Auth method</span>
            <span className="text-[#888] text-sm">
              {profile?.image ? "Google OAuth" : "Email + Password"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
