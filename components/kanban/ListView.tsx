"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { KanbanTask, TaskStatus } from "./KanbanBoard";
import { getInitials, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ListViewProps {
  tasks: KanbanTask[];
  workspaceId: string;
  projectId: string;
}

const STATUS_ORDER: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
];

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/10 text-red-400",
  feature: "bg-blue-500/10 text-blue-400",
  improvement: "bg-yellow-500/10 text-yellow-400",
  documentation: "bg-purple-500/10 text-purple-400",
};

export default function ListView({
  tasks,
  workspaceId,
  projectId,
}: ListViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleGroup(status: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  const grouped = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<string, KanbanTask[]>,
  );

  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      {/* header row */}
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-3 px-4 py-2 text-[#444] text-xs uppercase tracking-wider font-medium border-b border-[#1a1a1a]">
        <span>Task</span>
        <span>Assignee</span>
        <span>Priority</span>
        <span>Due date</span>
        <span>Comments</span>
      </div>

      {STATUS_ORDER.map((status) => {
        const statusTasks = grouped[status];
        if (statusTasks.length === 0) return null;

        const isCollapsed = collapsed.has(status);
        const config = STATUS_CONFIG[status];

        return (
          <div key={status}>
            {/* group header */}
            <button
              onClick={() => toggleGroup(status)}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#111] transition-colors group"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#444] group-hover:text-[#666]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#444] group-hover:text-[#666]" />
              )}
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[#333] text-xs">{statusTasks.length}</span>
            </button>

            {/* tasks in group */}
            {!isCollapsed && (
              <div className="flex flex-col">
                {statusTasks.map((task) => {
                  const priority =
                    PRIORITY_CONFIG[
                      task.priority as keyof typeof PRIORITY_CONFIG
                    ];
                  const isOverdue =
                    task.dueDate &&
                    new Date() > new Date(task.dueDate) &&
                    task.status !== "DONE";

                  return (
                    <Link
                      key={task.id}
                      href={`/dashboard/${workspaceId}/projects/${projectId}/tasks/${task.id}`}
                      className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-3 px-4 py-3 border-b border-[#0f0f0f] hover:bg-[#111] transition-colors items-center group"
                    >
                      {/* title + label */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            status === "DONE"
                              ? "bg-green-500"
                              : status === "IN_PROGRESS"
                                ? "bg-yellow-500"
                                : status === "IN_REVIEW"
                                  ? "bg-purple-500"
                                  : status === "TODO"
                                    ? "bg-blue-500"
                                    : "bg-[#444]"
                          }`}
                        />
                        <span
                          className={`text-sm truncate ${
                            status === "DONE"
                              ? "text-[#555] line-through"
                              : "text-[#888] group-hover:text-white transition-colors"
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.label && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                              LABEL_COLORS[task.label] ||
                              "bg-[#2a2a2a] text-[#555]"
                            }`}
                          >
                            {task.label}
                          </span>
                        )}
                      </div>

                      {/* assignee */}
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                              {task.assignee.image ? (
                                <img
                                  src={task.assignee.image}
                                  alt={task.assignee.name || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[8px] text-[#888]">
                                  {getInitials(task.assignee.name || "U")}
                                </div>
                              )}
                            </div>
                            <span className="text-[#555] text-xs truncate">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#333] text-xs">
                            Unassigned
                          </span>
                        )}
                      </div>

                      {/* priority */}
                      <span className={`text-xs font-medium ${priority.color}`}>
                        {priority.label}
                      </span>

                      {/* due date */}
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          isOverdue ? "text-red-400" : "text-[#555]"
                        }`}
                      >
                        {task.dueDate ? (
                          <>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.dueDate), "MMM d")}
                          </>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </span>

                      {/* comment count */}
                      <div className="flex items-center gap-1 text-[#444]">
                        {task._count.comments > 0 ? (
                          <>
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-xs">
                              {task._count.comments}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#333] text-xs">—</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
