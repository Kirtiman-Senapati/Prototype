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
  async (activityIds, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch("/activities/read", { activityIds });
      return { ...response.data, activityIds };
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
      const exists = state.activities.find(a => a._id === action.payload._id);
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
         // Optionally update local read states if needed, but easier to just let component refetch 
         // or assume optimistic update
      })
      .addCase(clearActivities.fulfilled, (state) => {
        state.activities = [];
      });
  },
});

export const { addRealtimeActivity, updateMessageStatus } = activitySlice.actions;
export default activitySlice.reducer;
