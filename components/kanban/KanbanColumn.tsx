"use client";
import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import { KanbanTask, TaskStatus } from "./KanbanBoard";

const STATUS_STYLES: Record<TaskStatus, { dot: string; count: string }> = {
  BACKLOG: { dot: "bg-[#555]", count: "bg-[#1a1a1a] text-[#555]" },
  TODO: { dot: "bg-blue-500", count: "bg-blue-500/10 text-blue-400" },
  IN_PROGRESS: {
    dot: "bg-yellow-500",
    count: "bg-yellow-500/10 text-yellow-400",
  },
  IN_REVIEW: {
    dot: "bg-purple-500",
    count: "bg-purple-500/10 text-purple-400",
  },
  DONE: { dot: "bg-green-500", count: "bg-green-500/10 text-green-400" },
};

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: KanbanTask[];
  onAddTask: () => void;
}

export default function KanbanColumn({
  status,
  label,
  tasks,
  onAddTask,
}: KanbanColumnProps) {
  const style = STATUS_STYLES[status];

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-[#888] text-sm font-medium">{label}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${style.count}`}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="text-[#444] hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 flex-1 min-h-[200px] rounded-xl p-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-[#1a1a1a]" : "bg-transparent"
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#333] text-xs">No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
