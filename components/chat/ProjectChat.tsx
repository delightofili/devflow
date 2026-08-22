"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useProjectSocket } from "@/lib/hooks/useSocket";
import { getInitials, timeAgo } from "@/lib/utils";
import { Send, X, MessageSquare } from "lucide-react";
import { ChatMessage, TypingUser } from "@/lib/type";

interface ProjectChatProps {
  projectId: string;
  workspaceId: string;
  projectName: string;
  onClose: () => void;
}

export default function ProjectChat({
  projectId,
  workspaceId,
  projectName,
  onClose,
}: ProjectChatProps) {
  const { data: session } = useSession();
  const socket = useProjectSocket(projectId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    // scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // listen for new messages from other users
    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    // listen for typing indicators
    socket.on(
      "chat:typing",
      ({ userId, userName, isTyping }: TypingUser & { isTyping: boolean }) => {
        if (userId === session?.user?.id) return;

        setTypingUsers((prev) => {
          if (isTyping) {
            const exists = prev.find((u) => u.userId === userId);
            if (exists) return prev;
            return [...prev, { userId, userName }];
          } else {
            return prev.filter((u) => u.userId !== userId);
          }
        });
      },
    );

    return () => {
      socket.off("chat:message");
      socket.off("chat:typing");
    };
  }, [socket, session?.user?.id]);

  async function fetchMessages(cursor?: string) {
    try {
      const url = `/api/workspaces/${workspaceId}/projects/${projectId}/messages${
        cursor ? `?cursor=${cursor}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (cursor) {
        setMessages((prev) => [...data, ...prev]);
      } else {
        setMessages(data);
        setHasMore(data.length === 50);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleTyping() {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("chat:typing", {
        projectId,
        userId: session?.user?.id,
        userName: session?.user?.name,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("chat:typing", {
        projectId,
        userId: session?.user?.id,
        userName: session?.user?.name,
        isTyping: false,
      });
    }, 1500);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      author: {
        id: session?.user?.id || "",
        name: session?.user?.name || null,
        image: session?.user?.image || null,
      },
    };

    // optimistic update — add message immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    const sentContent = input.trim();
    setInput("");

    // stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("chat:typing", {
        projectId,
        userId: session?.user?.id,
        userName: session?.user?.name,
        isTyping: false,
      });
    }

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: sentContent }),
        },
      );

      const saved = await res.json();

      // replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? saved : m)),
      );

      // broadcast to other users via socket
      socket.emit("chat:message", { projectId, message: saved });
    } catch {
      // remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  const groupedMessages = messages.reduce(
    (
      groups: {
        date: string;
        messages: ChatMessage[];
      }[],
      message,
    ) => {
      const date = new Date(message.createdAt).toDateString();
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }

      return groups;
    },
    [],
  );

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] border-l border-[#1a1a1a]">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#555]" />
          <div>
            <p className="text-white text-sm font-medium">
              # {projectName.toLowerCase().replace(/\s+/g, "-")}
            </p>
            <p className="text-[#444] text-xs">{messages.length} messages</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#555] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* load more */}
        {hasMore && (
          <button
            onClick={() => {
              const firstMessage = messages[0];
              if (firstMessage) fetchMessages(firstMessage.id);
            }}
            className="w-full text-center text-[#555] hover:text-white text-xs py-2 transition-colors"
          >
            Load older messages
          </button>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1a1a1a] animate-pulse flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-24" />
                  <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <MessageSquare className="w-8 h-8 text-[#333] mb-3" />
            <p className="text-[#555] text-sm font-medium mb-1">
              No messages yet
            </p>
            <p className="text-[#333] text-xs">
              Start the conversation for #{projectName}
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-[#333] text-xs flex-shrink-0">
                  {new Date(group.date).toDateString() ===
                  new Date().toDateString()
                    ? "Today"
                    : group.date}
                </span>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
              </div>

              {/* messages in this group */}
              <div className="space-y-3">
                {group.messages.map((message, index) => {
                  const isOwn = message.author.id === session?.user?.id;
                  const prevMessage = group.messages[index - 1];
                  const isSameAuthor =
                    prevMessage?.author.id === message.author.id;
                  // if same author as previous message, skip showing avatar/name again

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isSameAuthor ? "mt-0.5" : "mt-3"}`}
                    >
                      {/* avatar */}
                      <div
                        className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5 ${
                          isSameAuthor ? "invisible" : ""
                        }`}
                      >
                        {message.author.image ? (
                          <img
                            src={message.author.image}
                            alt={message.author.name || ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[10px] font-medium text-[#888]">
                            {getInitials(message.author.name || "U")}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {!isSameAuthor && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                              className={`text-sm font-medium ${
                                isOwn ? "text-blue-400" : "text-white"
                              }`}
                            >
                              {isOwn ? "You" : message.author.name}
                            </span>
                            <span className="text-[#333] text-[10px]">
                              {timeAgo(new Date(message.createdAt))}
                            </span>
                          </div>
                        )}
                        <p className="text-[#888] text-sm leading-relaxed break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span
                className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-[#444] text-xs">
              {typingUsers.map((u) => u.userName).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="p-3 border-t border-[#1a1a1a] flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${projectName.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-[#333] text-[10px] mt-1.5 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
