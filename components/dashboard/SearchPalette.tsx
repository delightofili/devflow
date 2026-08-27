"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, X, FolderKanban, CheckSquare, User } from "lucide-react";
import { getInitials, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface SearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: { id: string; name: string; color: string };
  assignee: { id: string; name: string | null; image: string | null } | null;
}

interface SearchProject {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface SearchMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface SearchResults {
  tasks: SearchTask[];
  projects: SearchProject[];
  members: SearchMember[];
}

export default function SearchPalette() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // keyboard shortcut — Cmd/Ctrl + K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    fetch(
      `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(debouncedQuery)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setSelectedIndex(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, workspaceId]);

  const allResults = [
    ...(results?.projects || []).map((p) => ({
      type: "project" as const,
      item: p,
    })),
    ...(results?.tasks || []).map((t) => ({ type: "task" as const, item: t })),
    ...(results?.members || []).map((m) => ({
      type: "member" as const,
      item: m,
    })),
  ];

  function handleSelect(result: (typeof allResults)[0]) {
    if (result.type === "project") {
      router.push(`/dashboard/${workspaceId}/projects/${result.item.id}`);
    } else if (result.type === "task") {
      const task = result.item as SearchTask;
      router.push(
        `/dashboard/${workspaceId}/projects/${task.project.id}/tasks/${task.id}`,
      );
    }
    setOpen(false);
  }

  // keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter" && allResults[selectedIndex]) {
      handleSelect(allResults[selectedIndex]);
    }
  }

  const hasResults =
    results &&
    (results.tasks.length > 0 ||
      results.projects.length > 0 ||
      results.members.length > 0);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[#444] hover:text-[#888] hover:border-[#3a3a3a] transition-colors text-sm w-48"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left text-xs">Search...</span>
        <kbd className="text-[10px] bg-[#2a2a2a] px-1.5 py-0.5 rounded text-[#555]">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />

      {/* palette */}
      <div className="relative w-full max-w-lg bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
        {/* input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
          <Search className="w-4 h-4 text-[#555] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, members..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#444] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[#444] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-[#555]">
            ESC
          </kbd>
        </div>

        {/* results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-[#1a1a1a] rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="py-12 text-center">
              <p className="text-[#555] text-sm">
                No results for &quot;{query}&quot;
              </p>
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center">
              <p className="text-[#444] text-xs">
                Type to search across your workspace
              </p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="p-2">
              {/* projects */}
              {results!.projects.length > 0 && (
                <div className="mb-2">
                  <p className="text-[#444] text-[10px] uppercase tracking-wider px-2 py-1.5">
                    Projects
                  </p>
                  {results!.projects.map((project, i) => {
                    const globalIndex = i;
                    return (
                      <button
                        key={project.id}
                        onClick={() =>
                          handleSelect({ type: "project", item: project })
                        }
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          selectedIndex === globalIndex
                            ? "bg-[#2a2a2a]"
                            : "hover:bg-[#1a1a1a]"
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-white text-sm">
                          {project.name}
                        </span>
                        <span className="text-[#444] text-xs ml-auto">
                          {project.status.toLowerCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* tasks */}
              {results!.tasks.length > 0 && (
                <div className="mb-2">
                  <p className="text-[#444] text-[10px] uppercase tracking-wider px-2 py-1.5">
                    Tasks
                  </p>
                  {results!.tasks.map((task, i) => {
                    const globalIndex = (results?.projects.length || 0) + i;
                    const status =
                      STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                    return (
                      <button
                        key={task.id}
                        onClick={() =>
                          handleSelect({ type: "task", item: task })
                        }
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          selectedIndex === globalIndex
                            ? "bg-[#2a2a2a]"
                            : "hover:bg-[#1a1a1a]"
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: task.project.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {task.title}
                          </p>
                          <p className="text-[#444] text-xs">
                            {task.project.name}
                          </p>
                        </div>
                        <span
                          className={`text-xs flex-shrink-0 ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* members */}
              {results!.members.length > 0 && (
                <div>
                  <p className="text-[#444] text-[10px] uppercase tracking-wider px-2 py-1.5">
                    Members
                  </p>
                  {results!.members.map((member, i) => {
                    const globalIndex =
                      (results?.projects.length || 0) +
                      (results?.tasks.length || 0) +
                      i;
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                          selectedIndex === globalIndex ? "bg-[#2a2a2a]" : ""
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[10px] text-[#888]">
                              {getInitials(member.name || member.email)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm">{member.name}</p>
                          <p className="text-[#444] text-xs">{member.email}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-1.5 text-[#333] text-[10px]">
            <kbd className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded">
              ↑↓
            </kbd>
            Navigate
          </div>
          <div className="flex items-center gap-1.5 text-[#333] text-[10px]">
            <kbd className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded">
              ↵
            </kbd>
            Open
          </div>
          <div className="flex items-center gap-1.5 text-[#333] text-[10px]">
            <kbd className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded">
              ESC
            </kbd>
            Close
          </div>
        </div>
      </div>
    </div>
  );
}
