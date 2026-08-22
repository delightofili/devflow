"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ProjectChat from "./ProjectChat";

interface ChatToggleProps {
  projectId: string;
  workspaceId: string;
  projectName: string;
}

export default function ChatToggle({
  projectId,
  workspaceId,
  projectName,
}: ChatToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 text-xs border px-2.5 py-1.5 rounded-lg transition-colors ${
          open
            ? "text-white border-[#3a3a3a] bg-[#1a1a1a]"
            : "text-[#555] border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-white"
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Chat
      </button>

      {open && (
        <div className="fixed right-0 top-12 bottom-0 w-80 z-40 shadow-2xl">
          <ProjectChat
            projectId={projectId}
            workspaceId={workspaceId}
            projectName={projectName}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
