import { useEffect } from "react";
import { socket } from "../socket/socket";

const useAutoRefresh = (callback, eventName) => {
    useEffect(() => {
        if (!socket) return;

        const handler = (data) => {
            callback(data);
        };

        // remove old listeners
        socket.off(eventName);

        // add new listener
        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [callback, eventName]);
};

export default useAutoRefresh;