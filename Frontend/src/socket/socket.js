import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Initialize socket connection with autoConnect false to prevent 
// connections before authentication
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,

    // Production-safe realtime stability
    transports: ["websocket"],

    // Auto reconnect if internet/server hiccup
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});

export const connectSocket = (userId) => {
    if (!socket.connected && userId) {
        socket.io.opts.query = { userId };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
