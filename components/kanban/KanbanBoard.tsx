"use client";
import { useState, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";

import CreateTaskModal from "./CreateTaskModal";

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

export interface KanbanTask {
  id: string;
  title: string;
  priority: string;
  label: string | null;
  dueDate: Date | null;
  order: number;
  status: TaskStatus;
  assignee: { id: string; name: string | null; image: string | null } | null;
  _count: { comments: number };
}

interface KanbanBoardProps {
  projectId: string;
  workspaceId: string;
  initialTasks: KanbanTask[];
  members: { id: string; name: string | null; image: string | null }[];
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "DONE", label: "Done" },
];

export default function KanbanBoard({
  projectId,
  workspaceId,
  initialTasks,
  members,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(
    null,
  );

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      const newStatus = destination.droppableId as TaskStatus;
      const newOrder = destination.index;

      // optimistic update — update UI immediately without waiting for server
      setTasks((prev) =>
        prev.map((task) =>
          task.id === draggableId
            ? { ...task, status: newStatus, order: newOrder }
            : task,
        ),
      );

      // persist to server in background
      try {
        await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/reorder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: draggableId, newStatus, newOrder }),
          },
        );
      } catch {
        // if server update fails, revert to original state
        setTasks(initialTasks);
      }
    },
    [workspaceId, projectId, initialTasks],
  );

  function handleTaskCreated(newTask: KanbanTask) {
    setTasks((prev) => [...prev, newTask]);
    setCreateModalStatus(null);
  }

  return (
    <div className="flex-1 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 h-full overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={getColumnTasks(col.status)}
              onAddTask={() => setCreateModalStatus(col.status)}
            />
          ))}
        </div>
      </DragDropContext>

      {createModalStatus && (
        <CreateTaskModal
          status={createModalStatus}
          projectId={projectId}
          workspaceId={workspaceId}
          members={members}
          onClose={() => setCreateModalStatus(null)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
