import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";

export const getActivities = createAsyncThunk(
  "activity/getActivities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/activities");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const markActivitiesRead = createAsyncThunk(
  "activity/markRead",
  async (activityIds, { getState, rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch("/activities/read", { activityIds });
      const state = getState();
      const userId = state.auth?.authUser?._id;
      return { ...response.data, activityIds, userId };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const clearActivities = createAsyncThunk(
  "activity/clear",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete("/activities/clear");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const sendUnifiedMessage = createAsyncThunk(
  "activity/sendMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/activities/message", messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const activitySlice = createSlice({
  name: "activity",
  initialState: {
    activities: [],
    isLoading: false,
  },
  reducers: {
    addRealtimeActivity: (state, action) => {
      // Avoid duplicates
      const exists = state.activities.some(
        a =>
          a._id === action.payload._id ||
          (a.message === action.payload.message &&
            a.createdAt === action.payload.createdAt)
      );
      if (!exists) {
        state.activities.unshift(action.payload);
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload; // status: 'delivered' | 'seen'
      const message = state.activities.find(a => a._id === messageId);
      if (message) {
        if (status === 'seen') {
          message.seen = true;
          message.delivered = true;
        } else if (status === 'delivered') {
          message.delivered = true;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getActivities.pending, (state) => { state.isLoading = true; })
      .addCase(getActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload.data || action.payload; // Handle different backend payload shapes if exist
      })
      .addCase(getActivities.rejected, (state) => { state.isLoading = false; })
      .addCase(markActivitiesRead.fulfilled, (state, action) => {
        const { activityIds, userId } = action.payload;
        if (userId && activityIds && activityIds.length > 0) {
          state.activities = state.activities.map(act => {
            if (activityIds.includes(act._id)) {
              return {
                ...act,
                readBy: act.readBy?.includes(userId) ? act.readBy : [...(act.readBy || []), userId]
              };
            }
            return act;
          });
        }
      })
      .addCase(clearActivities.fulfilled, (state) => {
        state.activities = [];
      });
  },
});

export const { addRealtimeActivity, updateMessageStatus } = activitySlice.actions;
export default activitySlice.reducer;
