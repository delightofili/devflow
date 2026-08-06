"use client";
import { Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useWorkspace } from "@/lib/context/workspace-context";

export default function Topbar({
  userName,
  userImage,
}: {
  userName: string;
  userImage: string;
}) {
  const { workspace } = useWorkspace();

  return (
    <header className="h-12 border-b border-[#1a1a1a] px-6 flex items-center justify-between flex-shrink-0 bg-[#0f0f0f]">
      <div className="flex items-center gap-2 text-sm text-[#555]">
        <span>{workspace?.name}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* notification bell — wired up on Day 9 */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] transition-colors text-[#555] hover:text-white">
          <Bell className="w-4 h-4" />
        </button>

        {/* user avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-xs font-medium text-[#888]">
              {getInitials(userName)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
