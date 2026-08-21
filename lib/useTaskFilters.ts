import { useState, useMemo } from "react";
import { KanbanTask } from "@/components/kanban/KanbanBoard";

export interface TaskFilters {
  search: string;
  priority: string;
  label: string;
  assigneeId: string;
  status: string;
}

const defaultFilters: TaskFilters = {
  search: "",
  priority: "",
  label: "",
  assigneeId: "",
  status: "",
};

export function useTaskFilters(tasks: KanbanTask[]) {
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(query)) return false;
      }
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.label && task.label !== filters.label) return false;
      if (filters.assigneeId && task.assignee?.id !== filters.assigneeId)
        return false;
      if (filters.status && task.status !== filters.status) return false;
      return true;
    });
  }, [tasks, filters]);

  function updateFilter(key: keyof TaskFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return {
    filters,
    filteredTasks,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
