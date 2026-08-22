"use client";
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "../socket";
import { useSession } from "next-auth/react";

export function useSocket(workspaceId?: string): Socket {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      socket.emit("user:online", userId);
      socket.emit("user:join_room", userId);
      if (workspaceId) {
        socket.emit("workspace:join", workspaceId);
      }
    }

    socket.on("connect", onConnect);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
    };
  }, [session?.user?.id, workspaceId]);

  return getSocket();
}

export function useProjectSocket(projectId: string): Socket {
  const socket = useSocket();

  useEffect(() => {
    if (!projectId) return;

    socket.emit("project:join", projectId);

    return () => {
      socket.emit("project:leave", projectId);
    };
  }, [projectId]);

  return socket;
}
