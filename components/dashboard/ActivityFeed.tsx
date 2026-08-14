"use client";
import { useState, useEffect, useCallback } from "react";
import { timeAgo, getInitials } from "@/lib/utils";

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ActivityFeedProps {
  workspaceId: string;
  projectId?: string;
  limit?: number;
}

export default function ActivityFeed({
  workspaceId,
  projectId,
  limit = 20,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const url = projectId
        ? `/api/workspaces/${workspaceId}/projects/${projectId}/activity`
        : `/api/workspaces/${workspaceId}/activity`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setActivities(data.slice(0, limit));
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, limit]);

  useEffect(() => {
    let isSubscribed = true;

    const load = async () => {
      if (isSubscribed) {
        await fetchActivity();
      }
    };

    load();

    return () => {
      isSubscribed = false;
    };
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#1a1a1a] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-[#444] text-sm text-center py-8">No activity yet</p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
            {activity.user.image ? (
              <img
                src={activity.user.image}
                alt={activity.user.name || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[8px] font-medium text-[#888]">
                {getInitials(activity.user.name || "U")}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#888] text-xs leading-relaxed">
              <span className="text-white font-medium">
                {activity.user.name}
              </span>{" "}
              {activity.action}
            </p>
            <p className="text-[#444] text-[10px] mt-0.5">
              {timeAgo(new Date(activity.createdAt))}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
