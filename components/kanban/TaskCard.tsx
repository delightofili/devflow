"use client";
import { Draggable } from "@hello-pangea/dnd";
import { MessageSquare, Calendar } from "lucide-react";
import { KanbanTask } from "./KanbanBoard";
import { getInitials, timeAgo, PRIORITY_CONFIG } from "@/lib/utils";
import { format } from "date-fns";

interface TaskCardProps {
  task: KanbanTask;
  index: number;
}

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/10 text-red-400",
  feature: "bg-blue-500/10 text-blue-400",
  improvement: "bg-yellow-500/10 text-yellow-400",
  documentation: "bg-purple-500/10 text-purple-400",
};

export default function TaskCard({ task, index }: TaskCardProps) {
  const priority =
    PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const isOverdue =
    task.dueDate &&
    new Date() > new Date(task.dueDate) &&
    task.status !== "DONE";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#1a1a1a] border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
            snapshot.isDragging
              ? "border-[#3a3a3a] shadow-lg rotate-1 scale-105"
              : "border-[#2a2a2a] hover:border-[#3a3a3a]"
          }`}
        >
          {/* label */}
          {task.label && (
            <div className="mb-2">
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  LABEL_COLORS[task.label] || "bg-[#2a2a2a] text-[#555]"
                }`}
              >
                {task.label}
              </span>
            </div>
          )}

          {/* title */}
          <p className="text-white text-sm leading-snug mb-3">{task.title}</p>

          {/* footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* priority indicator */}
              <span
                className={`text-xs font-medium ${priority.color}`}
                title={priority.label}
              >
                {task.priority === "URGENT"
                  ? "!!"
                  : task.priority === "HIGH"
                    ? "!"
                    : task.priority === "MEDIUM"
                      ? "~"
                      : task.priority === "LOW"
                        ? "↓"
                        : "—"}
              </span>

              {/* comment count */}
              {task._count.comments > 0 && (
                <div className="flex items-center gap-1 text-[#555]">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-xs">{task._count.comments}</span>
                </div>
              )}

              {/* due date */}
              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 ${
                    isOverdue ? "text-red-400" : "text-[#555]"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {format(new Date(task.dueDate), "MMM d")}
                  </span>
                </div>
              )}
            </div>

            {/* assignee avatar */}
            {task.assignee && (
              <div
                className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0"
                title={task.assignee.name || ""}
              >
                {task.assignee.image ? (
                  <img
                    src={task.assignee.image}
                    alt={task.assignee.name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[8px] font-medium text-[#888]">
                    {getInitials(task.assignee.name || "U")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
