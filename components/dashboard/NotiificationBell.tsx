"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X, Check } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/hooks/useSocket";
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  url: string | null;
  type: string;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const { data: session } = useSession();

  useEffect(() => {
    socket.on("notification:new", (notification: Notification) => {
      setCount((prev) => prev + 1);

      if (open) {
        setNotifications((prev) => [notification, ...prev]);
      }
    });

    return () => {
      socket.off("notification:new");
    };
  }, [socket, open]);

  async function fetchCount() {
    try {
      const res = await fetch("/api/notifications/count");
      const data = await res.json();
      setCount(data.count);
    } catch {}
  }

  useEffect(() => {
    const runFetchCount = () => {
      void fetchCount();
    };

    // fetch immediately and then poll for new notifications every 30 seconds
    const timeout = setTimeout(runFetchCount, 0);
    const interval = setInterval(runFetchCount, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);

    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data);

      if (count > 0) {
        await fetch("/api/notifications/read", { method: "PATCH" });
        setCount(0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (notification.url) {
      router.push(notification.url);
    }
    setOpen(false);
  }

  const NOTIFICATION_ICONS: Record<string, string> = {
    TASK_ASSIGNED: "◈",
    TASK_COMMENTED: "◉",
    TASK_STATUS_CHANGED: "◎",
    MEMBER_INVITED: "◇",
    MEMBER_JOINED: "◆",
    PROJECT_CREATED: "◉",
    MENTIONED: "@",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] transition-colors text-[#555] hover:text-white"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full text-white text-[10px] flex items-center justify-center font-medium">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <span className="text-white text-sm font-medium">
              Notifications
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[#555] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-6 h-6 text-[#333] mx-auto mb-2" />
                <p className="text-[#555] text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors text-left border-b border-[#1a1a1a] last:border-0 ${
                    !notification.read ? "bg-blue-500/5" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-xs text-[#888] flex-shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[notification.type] || "◉"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium mb-0.5">
                      {notification.title}
                    </p>
                    <p className="text-[#555] text-xs leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-[#333] text-[10px] mt-1">
                      {timeAgo(new Date(notification.createdAt))}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-[#1a1a1a]">
              <button
                onClick={async () => {
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true })),
                  );
                  await fetch("/api/notifications/read", { method: "PATCH" });
                  setCount(0);
                }}
                className="flex items-center gap-1.5 text-[#555] hover:text-white text-xs transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
