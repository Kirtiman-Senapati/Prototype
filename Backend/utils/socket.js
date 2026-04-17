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
            userSockets[userId] = socket.id;
            console.log(`User connected: ${userId} with socket id: ${socket.id}`);
        }

        socket.on("disconnect", () => {
            if (userId && userSockets[userId] === socket.id) {
                delete userSockets[userId];
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
