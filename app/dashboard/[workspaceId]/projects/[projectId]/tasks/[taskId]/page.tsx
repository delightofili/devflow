"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Tag, User, AlertCircle } from "lucide-react";
import { getInitials, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  label: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee: { id: string; name: string | null; image: string | null } | null;
  creator: { id: string; name: string | null; image: string | null };
  comments: Comment[];
  subtasks: { id: string; title: string; status: string }[];
}

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/10 text-red-400 border-red-500/20",
  feature: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  improvement: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  documentation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { workspaceId, projectId, taskId } = params as {
    workspaceId: string;
    projectId: string;
    taskId: string;
  };

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadTask = async () => {
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
        );
        const data = await res.json();

        if (!ignore && res.ok) {
          setTask(data);
        }
      } catch {
        console.error("Failed to fetch task");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadTask();

    return () => {
      ignore = true;
    };
  }, [workspaceId, projectId, taskId]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setCommentError("");

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: comment }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // add comment to list without refetching
      setTask((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data] } : prev,
      );
      setComment("");
    } catch (err) {
      if (err instanceof Error) {
        setCommentError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 w-64 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="h-32 bg-[#1a1a1a] rounded-xl animate-pulse" />
        <div className="h-48 bg-[#1a1a1a] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16">
        <p className="text-[#555] text-sm mb-4">Task not found</p>
        <Link
          href={`/dashboard/${workspaceId}/projects/${projectId}`}
          className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
        >
          Back to project
        </Link>
      </div>
    );
  }

  const priority =
    PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const status = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
  const isOverdue =
    task.dueDate &&
    new Date() > new Date(task.dueDate) &&
    task.status !== "DONE";

  return (
    <div className="max-w-3xl">
      {/* back link */}
      <Link
        href={`/dashboard/${workspaceId}/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-[#555] hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to board
      </Link>

      <div className="grid grid-cols-[1fr_220px] gap-6">
        {/* main content */}
        <div>
          {/* title */}
          <h1 className="text-xl font-semibold text-white mb-3 leading-snug">
            {task.title}
          </h1>

          {/* description */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 mb-6">
            {task.description ? (
              <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-[#444] text-sm">No description provided.</p>
            )}
          </div>

          {/* subtasks */}
          {task.subtasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[#888] text-xs uppercase tracking-wider font-medium mb-3">
                Subtasks (
                {task.subtasks.filter((s) => s.status === "DONE").length}/
                {task.subtasks.length})
              </h2>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2.5"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        subtask.status === "DONE" ? "bg-green-500" : "bg-[#333]"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        subtask.status === "DONE"
                          ? "text-[#444] line-through"
                          : "text-[#888]"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* comments */}
          <div>
            <h2 className="text-[#888] text-xs uppercase tracking-wider font-medium mb-4">
              Comments ({task.comments.length})
            </h2>

            {task.comments.length === 0 ? (
              <p className="text-[#444] text-sm mb-4">
                No comments yet. Be the first to comment.
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {task.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      {c.author.image ? (
                        <img
                          src={c.author.image}
                          alt={c.author.name || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[10px] font-medium text-[#888]">
                          {getInitials(c.author.name || "U")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">
                          {c.author.name}
                        </span>
                        <span className="text-[#444] text-xs">
                          {format(new Date(c.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* add comment form */}
            <form onSubmit={handleComment} className="space-y-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#444] resize-none text-sm"
              />
              {commentError && (
                <p className="text-red-400 text-xs">{commentError}</p>
              )}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4 disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                Status
              </p>
              <span className={`text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div>
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                Priority
              </p>
              <span className={`text-xs font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </div>

            {task.label && (
              <div>
                <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                  Label
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                    LABEL_COLORS[task.label] ||
                    "bg-[#2a2a2a] text-[#555] border-[#2a2a2a]"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {task.label}
                </span>
              </div>
            )}

            {/* assignee */}
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                Assignee
              </p>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
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
                  <span className="text-[#888] text-xs">
                    {task.assignee.name}
                  </span>
                </div>
              ) : (
                <span className="text-[#444] text-xs flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Unassigned
                </span>
              )}
            </div>

            {/* due date */}
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                Due date
              </p>
              {task.dueDate ? (
                <span
                  className={`text-xs flex items-center gap-1.5 ${
                    isOverdue ? "text-red-400" : "text-[#888]"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                  {isOverdue && <AlertCircle className="w-3 h-3" />}
                </span>
              ) : (
                <span className="text-[#444] text-xs">No due date</span>
              )}
            </div>

            <div>
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                Created by
              </p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                  {task.creator.image ? (
                    <img
                      src={task.creator.image}
                      alt={task.creator.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[8px] font-medium text-[#888]">
                      {getInitials(task.creator.name || "U")}
                    </div>
                  )}
                </div>
                <span className="text-[#888] text-xs">{task.creator.name}</span>
              </div>
            </div>

            <div>
              <p className="text-[#555] text-xs uppercase tracking-wider mb-1.5">
                Created
              </p>
              <span className="text-[#444] text-xs">
                {format(new Date(task.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
