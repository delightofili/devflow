"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/context/workspace-context";
import { useSession } from "next-auth/react";
import { getInitials, timeAgo } from "@/lib/utils";
import { UserPlus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InviteMemberModal from "@/components/dashboard/InviteMemberModal";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

const ROLE_STYLES: Record<string, string> = {
  OWNER: "bg-yellow-500/10 text-yellow-500",
  ADMIN: "bg-blue-500/10 text-blue-400",
  DEVELOPER: "bg-green-500/10 text-green-500",
  VIEWER: "bg-[#2a2a2a] text-[#555]",
};

export default function MembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { data: session } = useSession();
  const { currentMember } = useWorkspace();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(() => Boolean(workspaceId));
  const [showInvite, setShowInvite] = useState(false);

  const canManage =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let isSubscribed = true;
    const loadMembers = async () => {
      await fetchMembers();
    };
    if (isSubscribed) {
      loadMembers();
    }
    return () => {
      isSubscribed = false;
    };
  }, [fetchMembers]);

  async function handleRoleChange(memberId: string, role: string) {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
        );
      }
    } catch {}
  }
  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member from workspace?")) return;
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Members</h1>
          <p className="text-[#555] text-sm mt-0.5">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowInvite(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite member
          </Button>
        )}
      </div>

      <div className="bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {members.map((member, index) => (
          <div
            key={member.id}
            className={`flex items-center gap-4 px-5 py-4 ${
              index !== members.length - 1 ? "border-b border-[#1a1a1a]" : ""
            }`}
          >
            {/* avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {member.user.image ? (
                <img
                  src={member.user.image}
                  alt={member.user.name || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-sm font-medium text-[#888]">
                  {getInitials(member.user.name || member.user.email)}
                </div>
              )}
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium truncate">
                  {member.user.name || "Unknown"}
                </p>
                {member.user.id === session?.user?.id && (
                  <span className="text-[#444] text-xs">(you)</span>
                )}
              </div>
              <p className="text-[#555] text-xs truncate">
                {member.user.email}
              </p>
            </div>

            {/* joined */}
            <p className="text-[#444] text-xs hidden md:block">
              Joined {timeAgo(new Date(member.joinedAt))}
            </p>

            {/* role */}
            {canManage &&
            member.role !== "OWNER" &&
            member.user.id !== session?.user?.id ? (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#444] cursor-pointer"
              >
                <option value="ADMIN">Admin</option>
                <option value="DEVELOPER">Developer</option>
                <option value="VIEWER">Viewer</option>
              </select>
            ) : (
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  ROLE_STYLES[member.role] || ROLE_STYLES.VIEWER
                }`}
              >
                {member.role.toLowerCase()}
              </span>
            )}

            {/* remove button */}
            {canManage &&
              member.role !== "OWNER" &&
              member.user.id !== session?.user?.id && (
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-[#333] hover:text-red-400 transition-colors ml-1"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
          </div>
        ))}
      </div>

      {showInvite && (
        <InviteMemberModal
          workspaceId={workspaceId}
          onClose={() => setShowInvite(false)}
          onInvited={fetchMembers}
        />
      )}
    </div>
  );
}
