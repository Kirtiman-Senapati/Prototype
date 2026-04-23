export const EVENTS = {
    REFRESH: "refreshData",
    USER_UPDATED: "userUpdated",
    PROJECT_UPDATED: "projectUpdated",
    NOTIFICATION_ADDED: "notificationAdded",
};

export const emitRefresh = (io) => {
    if (io) {
        io.emit(EVENTS.REFRESH);
    }
};

export const emitTargetedEvent = (io, eventName, data = null) => {
    if (io && eventName) {
        io.emit(eventName, data);
    }
};
