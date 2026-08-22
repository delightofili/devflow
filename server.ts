import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // store online users
  // Map<userId, Set<socketId>> — one user can have multiple tabs open
  const onlineUsers = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // user comes online
    socket.on("user:online", (userId: string) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // attach userId to socket for cleanup on disconnect
      socket.data.userId = userId;

      // broadcast updated online users to everyone
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // join a workspace room — receives workspace-level events
    socket.on("workspace:join", (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
    });

    // join a project room — receives project-level events
    socket.on("project:join", (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    // leave a project room
    socket.on("project:leave", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // typing indicator in chat
    socket.on(
      "chat:typing",
      ({
        projectId,
        userId,
        userName,
        isTyping,
      }: {
        projectId: string;
        userId: string;
        userName: string;
        isTyping: boolean;
      }) => {
        socket.to(`project:${projectId}`).emit("chat:typing", {
          userId,
          userName,
          isTyping,
        });
        // broadcast to everyone in the project room EXCEPT the sender
      },
    );

    // new chat message — broadcast to project room
    socket.on(
      "chat:message",
      ({ projectId, message }: { projectId: string; message: unknown }) => {
        socket.to(`project:${projectId}`).emit("chat:message", message);
        // sender already added it optimistically — only send to others
      },
    );

    // task updated — broadcast to project room
    socket.on(
      "task:updated",
      ({ projectId, task }: { projectId: string; task: unknown }) => {
        socket.to(`project:${projectId}`).emit("task:updated", task);
      },
    );

    // task created — broadcast to project room
    socket.on(
      "task:created",
      ({ projectId, task }: { projectId: string; task: unknown }) => {
        socket.to(`project:${projectId}`).emit("task:created", task);
      },
    );

    // notification — send to specific user's room
    socket.on(
      "notification:send",
      ({ userId, notification }: { userId: string; notification: unknown }) => {
        io.to(`user:${userId}`).emit("notification:new", notification);
      },
    );

    // join personal room for private notifications
    socket.on("user:join_room", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    // disconnect cleanup
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
          }
        }
        io.emit("users:online", Array.from(onlineUsers.keys()));
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // make io accessible to API routes via global
  (global as unknown as GlobalWithIO).io = io;

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

interface GlobalWithIO {
  io: Server;
}
