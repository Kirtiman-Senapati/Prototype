import { useEffect } from "react";
import { socket } from "../socket/socket";
import { playNotificationSound } from "../utils/sound";
import { useSelector } from "react-redux";

const useAutoRefresh = (callback, eventName) => {
    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!socket) return;

        const handler = (data) => {
            if (eventName === "newActivity") {
                const actorId = data?.actor?._id || data?.actor;
                const isMyOwnAction = actorId && authUser && actorId.toString() === authUser._id.toString();
                if (!isMyOwnAction) {
                    playNotificationSound();
                }
            }
            callback(data);
        };

        // remove old listeners
        socket.off(eventName);

        // add new listener
        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [callback, eventName, authUser]);
};

export default useAutoRefresh;