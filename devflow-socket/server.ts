import { Server } from "socket.io";
import { createServer } from "http";
import * as dotenv from "dotenv";
dotenv.config();

const httpServer = createServer((req, res) => {
  // health check endpoint so Render knows server is alive
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "https://devflow.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on("user:online", (userId: string) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    socket.data.userId = userId;
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  socket.on("workspace:join", (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on("project:join", (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on("project:leave", (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on("user:join_room", (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on(
    "chat:typing",
    (data: {
      projectId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      socket.to(`project:${data.projectId}`).emit("chat:typing", data);
    },
  );

  socket.on("chat:message", (data: { projectId: string; message: unknown }) => {
    socket.to(`project:${data.projectId}`).emit("chat:message", data.message);
  });

  socket.on("task:updated", (data: { projectId: string; task: unknown }) => {
    socket.to(`project:${data.projectId}`).emit("task:updated", data.task);
  });

  socket.on("task:created", (data: { projectId: string; task: unknown }) => {
    socket.to(`project:${data.projectId}`).emit("task:created", data.task);
  });

  socket.on(
    "notification:send",
    (data: { userId: string; notification: unknown }) => {
      io.to(`user:${data.userId}`).emit("notification:new", data.notification);
    },
  );

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (userId) {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      io.emit("users:online", Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
