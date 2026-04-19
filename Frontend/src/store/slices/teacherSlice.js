import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const getTeacherDashboard = createAsyncThunk(
  "teacher/getDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/teacher/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getPendingRequests = createAsyncThunk(
  "teacher/getPendingRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/teacher/requests");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getAssignedStudents = createAsyncThunk(
  "teacher/getAssignedStudents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/teacher/students");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const handleRequest = createAsyncThunk(
  "teacher/handleRequest",
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/teacher/request/handle", requestData);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to handle request");
      return rejectWithValue(error.response?.data);
    }
  }
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState: {
    stats: null,
    requests: [],
    assignedStudents: [],
    recentFiles: [],
    recentActivity: [],
    completedProjectsList: [],
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTeacherDashboard.pending, (state) => { state.isLoading = true; })
      .addCase(getTeacherDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
        state.recentFiles = action.payload.recentFiles || [];
        state.recentActivity = action.payload.recentActivity || [];
        state.completedProjectsList = action.payload.completedProjectsList || [];
      })
      .addCase(getTeacherDashboard.rejected, (state) => { state.isLoading = false; })
      .addCase(getPendingRequests.fulfilled, (state, action) => {
        state.requests = action.payload.requests;
      })
      .addCase(getAssignedStudents.fulfilled, (state, action) => {
        state.assignedStudents = action.payload.students;
      })
      .addCase(handleRequest.fulfilled, (state, action) => {
        // Remove handled request from pending list
        state.requests = state.requests.filter(req => req._id !== action.payload.request._id);
      });
  },
});

export default teacherSlice.reducer;
