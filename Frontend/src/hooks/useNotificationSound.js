import { useEffect } from "react";
import { useSelector } from "react-redux";
import { socket } from "../socket/socket";
import { playNotificationSound, playChatSound } from "../utils/sound";

export const useNotificationSound = () => {
    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!authUser) return;

        if (!socket) return;

        const handleNewActivity = () => {
            playNotificationSound();
        };

        const handleNewMessage = (message) => {
            // Don't play sound for our own messages
            if (message.senderId !== authUser._id) {
                playChatSound();
            }
        };

        socket.on("newActivity", handleNewActivity);
        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newActivity", handleNewActivity);
            socket.off("newMessage", handleNewMessage);
        };
    }, [authUser]);
};
