import { useEffect } from "react";
import { socket } from "../socket/socket.js";

const useAutoRefresh = (callback, eventName = "refreshData") => {
  useEffect(() => {
    // Only register if a valid callback is provided
    if (typeof callback !== "function") return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [callback, eventName]);
};

export default useAutoRefresh;
