import { Server } from "socket.io";

let io;
const userSockets = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            if (!userSockets[userId]) userSockets[userId] = [];
            userSockets[userId].push(socket.id);
            console.log(`User connected: ${userId} with socket id: ${socket.id}`);
            
            // Only emit online if it's their first connection
            if (userSockets[userId].length === 1) {
                io.emit("userStatus", { userId, status: "online" });
            }

            socket.emit("initialOnlineUsers", Object.keys(userSockets));
        }

        // Chat Rooms & Typing Indicators
        socket.on("joinProject", (projectId) => {
            if (projectId) {
                socket.join(projectId);
            }
        });

        socket.on("leaveProject", (projectId) => {
            if (projectId) {
                socket.leave(projectId);
            }
        });

        socket.on("typing", ({ projectId, user }) => {
            socket.to(projectId).emit("typing", { user, projectId });
        });

        socket.on("stopTyping", ({ projectId }) => {
            socket.to(projectId).emit("stopTyping", { projectId });
        });

        // Message Status
        socket.on("messageDelivered", ({ projectId, messageId }) => {
            socket.to(projectId).emit("messageDeliveredUpdate", { messageId, projectId });
        });
        socket.on("markSeen", ({ projectId, messageId }) => {
            // Can be extended to update DB, for now emit to room
            socket.to(projectId).emit("messageSeenUpdate", { messageId, projectId });
        });

        socket.on("disconnect", () => {
            if (userId && userSockets[userId]) {
                userSockets[userId] = userSockets[userId].filter(id => id !== socket.id);
                if (userSockets[userId].length === 0) {
                    delete userSockets[userId];
                    io.emit("userStatus", { userId, status: "offline", lastSeen: new Date() });
                }
            }
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        console.warn("Socket.io not initialized!");
        return null;
    }
    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSockets[receiverId];
};
