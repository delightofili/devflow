"use client";
import { useState, useCallback, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import CreateTaskModal from "./CreateTaskModal";
import ListView from "./ListView";
import TaskFiltersBar from "./TaskFiltersBar";
import { useTaskFilters } from "@/lib/useTaskFilters";
import { useProjectSocket } from "@/lib/hooks/useSocket";

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
  const socket = useProjectSocket(projectId);

  const [view, setView] = useState<"kanban" | "list">("kanban");

  const {
    filters,
    filteredTasks,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useTaskFilters(tasks);

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);

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

      setTasks((prev) =>
        prev.map((task) =>
          task.id === draggableId
            ? { ...task, status: newStatus, order: newOrder }
            : task,
        ),
      );

      try {
        await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/reorder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: draggableId, newStatus, newOrder }),
          },
        );
        socket.emit("task:updated", {
          projectId,
          task: {
            ...tasks.find((t) => t.id === draggableId),
            status: newStatus,
            order: newOrder,
          },
        });
      } catch {
        setTasks(initialTasks);
      }
    },
    [workspaceId, projectId, initialTasks],
  );

  useEffect(() => {
    // someone else created a task — add it to board
    socket.on("task:created", (newTask: KanbanTask) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t.id === newTask.id);
        if (exists) return prev;
        return [...prev, newTask];
      });
    });

    // someone else updated a task — update it on board
    socket.on("task:updated", (updatedTask: KanbanTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
    });

    return () => {
      socket.off("task:created");
      socket.off("task:updated");
    };
  }, [socket]);

  function handleTaskCreated(newTask: KanbanTask) {
    setTasks((prev) => [...prev, newTask]);
    setCreateModalStatus(null);
    // broadcast to other users in this project
    socket.emit("task:created", { projectId, task: newTask });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TaskFiltersBar
        filters={filters}
        onUpdate={updateFilter}
        onClear={clearFilters}
        hasActive={hasActiveFilters}
        members={members}
        view={view}
        onViewChange={setView}
      />

      {view === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 flex-1 overflow-x-auto pb-4">
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
      ) : (
        <div className="flex-1 overflow-hidden bg-[#111] border border-[#1a1a1a] rounded-xl">
          <ListView
            tasks={filteredTasks}
            workspaceId={workspaceId}
            projectId={projectId}
          />
        </div>
      )}

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
