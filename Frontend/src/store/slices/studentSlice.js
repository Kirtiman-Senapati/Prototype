import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const submitProposal = createAsyncThunk(
  "student/submitProposal",
  async (proposalData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/student/proposal", proposalData);
      toast.success("Proposal submitted successfully!");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit proposal");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getStudentDashboard = createAsyncThunk(
  "student/getDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/student/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getAvailableSupervisors = createAsyncThunk(
  "student/getAvailableSupervisors",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/student/supervisors");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const requestSupervisor = createAsyncThunk(
  "student/requestSupervisor",
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/student/request-supervisor", requestData);
      toast.success("Supervisor requested!");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request supervisor");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const uploadProjectFile = createAsyncThunk(
  "student/uploadProjectFile",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/student/upload", formData, {
         headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("File uploaded!");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload file");
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getStudentFeedback = createAsyncThunk(
  "student/getFeedback",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/feedback/student");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "student/updateTaskStatus",
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/student/task/${taskId}/status`, { status });
      toast.success(status === "Completed" ? "Task marked as completed!" : "Task status updated");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update task status");
      return rejectWithValue(error.response?.data);
    }
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    project: null,
    requests: [],
    notifications: [],
    supervisors: [],
    feedbacks: [],
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStudentDashboard.pending, (state) => { state.isLoading = true; })
      .addCase(getStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.project = action.payload.project;
        state.requests = action.payload.requests;
        state.notifications = action.payload.notifications || [];
      })
      .addCase(getStudentDashboard.rejected, (state) => { state.isLoading = false; })
      .addCase(getAvailableSupervisors.fulfilled, (state, action) => {
        state.supervisors = action.payload.supervisors;
      })
      .addCase(submitProposal.fulfilled, (state, action) => {
        state.project = action.payload.project;
      })
      .addCase(uploadProjectFile.fulfilled, (state, action) => {
        state.project = action.payload.project;
      })
      .addCase(getStudentFeedback.fulfilled, (state, action) => {
        state.feedbacks = action.payload.feedbacks;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.project = action.payload.project;
      });
  },
});

export default studentSlice.reducer;
