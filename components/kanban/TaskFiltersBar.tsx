"use client";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { TaskFilters } from "@/lib/useTaskFilters";

interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface TaskFiltersBarProps {
  filters: TaskFilters;
  onUpdate: (key: keyof TaskFilters, value: string) => void;
  onClear: () => void;
  hasActive: boolean;
  members: Member[];
  view: "kanban" | "list";
  onViewChange: (view: "kanban" | "list") => void;
}

const PRIORITIES = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NO_PRIORITY", label: "No priority" },
];

const LABELS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "documentation", label: "Documentation" },
];

const STATUSES = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const selectClass = `
  bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5
  text-[#888] text-xs focus:outline-none focus:border-[#444]
  hover:border-[#3a3a3a] transition-colors cursor-pointer
  appearance-none
`;

export default function TaskFiltersBar({
  filters,
  onUpdate,
  onClear,
  hasActive,
  members,
  view,
  onViewChange,
}: TaskFiltersBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {/* search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onUpdate("search", e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-1.5 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-[#444] w-44 transition-colors"
        />
      </div>

      {/* priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onUpdate("priority", e.target.value)}
        className={selectClass}
      >
        <option value="">Priority</option>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* label filter */}
      <select
        value={filters.label}
        onChange={(e) => onUpdate("label", e.target.value)}
        className={selectClass}
      >
        <option value="">Label</option>
        {LABELS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>

      {/* assignee filter */}
      <select
        value={filters.assigneeId}
        onChange={(e) => onUpdate("assigneeId", e.target.value)}
        className={selectClass}
      >
        <option value="">Assignee</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name || "Unknown"}
          </option>
        ))}
      </select>

      {/* status filter — useful in list view */}
      <select
        value={filters.status}
        onChange={(e) => onUpdate("status", e.target.value)}
        className={selectClass}
      >
        <option value="">Status</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* clear filters */}
      {hasActive && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-[#555] hover:text-white text-xs transition-colors px-2.5 py-1.5 border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a]"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}

      {/* spacer */}
      <div className="flex-1" />

      {/* view switcher */}
      <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
        <button
          onClick={() => onViewChange("kanban")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            view === "kanban"
              ? "bg-[#2a2a2a] text-white"
              : "text-[#555] hover:text-[#888]"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => onViewChange("list")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            view === "list"
              ? "bg-[#2a2a2a] text-white"
              : "text-[#555] hover:text-[#888]"
          }`}
        >
          List
        </button>
      </div>
    </div>
  );
}
