"use client";
import { useState, useEffect } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import { getInitials } from "@/lib/utils";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface OnlinePresenceProps {
  members: Member[];
}

export default function OnlinePresence({ members }: OnlinePresenceProps) {
  const socket = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    socket.on("users:online", (userIds: string[]) => {
      setOnlineUserIds(userIds);
    });

    return () => {
      socket.off("users:online");
    };
  }, [socket]);

  const onlineMembers = members.filter((m) => onlineUserIds.includes(m.id));

  if (onlineMembers.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      <div className="flex -space-x-1">
        {onlineMembers.slice(0, 5).map((member) => (
          <div
            key={member.id}
            title={`${member.name} is online`}
            className="w-5 h-5 rounded-full overflow-hidden border border-[#0f0f0f]"
          >
            {member.image ? (
              <img
                src={member.image}
                alt={member.name || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[8px] text-[#888]">
                {getInitials(member.name || "U")}
              </div>
            )}
          </div>
        ))}
      </div>
      <span className="text-[#444] text-xs">{onlineMembers.length} online</span>
    </div>
  );
}
