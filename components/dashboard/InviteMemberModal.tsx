"use client";
import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteMemberModal({
  workspaceId,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState("DEVELOPER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.type === "added_directly") {
        setSuccess("Member added successfully.");
        onInvited();
        setTimeout(onClose, 1500);
      } else {
        setSuccess("Invitation created.");
        setInviteUrl(data.inviteUrl);
        onInvited();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <h2 className="text-white font-medium">Invite member</h2>
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
              Email address
            </Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="teammate@company.com"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#888] text-xs uppercase tracking-wider">
              Role
            </Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#444]"
            >
              <option value="ADMIN">
                Admin — can manage projects and members
              </option>
              <option value="DEVELOPER">
                Developer — can create and update tasks
              </option>
              <option value="VIEWER">Viewer — read only access</option>
            </select>
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

          {inviteUrl && (
            <div className="space-y-1.5">
              <Label className="text-[#888] text-xs uppercase tracking-wider">
                Invite link
              </Label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#555] text-xs focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#888] hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[#444] text-xs">
                Share this link with your teammate. Expires in 7 days.
              </p>
            </div>
          )}

          {!success && (
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
                {loading ? "Sending..." : "Send invite"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
