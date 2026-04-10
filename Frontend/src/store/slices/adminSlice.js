import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios"; // Adjust path if needed
import { toast } from "react-toastify";

// 1. Export the missing getAllProjects thunk
export const getAllProjects = createAsyncThunk(
  "admin/getAllProjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/admin/projects");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// 2. Export the missing approveProject thunk (This specifically fixes your crash)
export const approveProject = createAsyncThunk(
  "admin/approveProject",
  async (projectId, { rejectWithValue }) => {
    try {
      // Adjust the URL to match your backend API
      const response = await axiosInstance.patch(`/admin/projects/${projectId}/approve`);
      toast.success("Project approved successfully!");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve project");
      return rejectWithValue(error.response?.data);
    }
  }
);

// 3. Export the missing rejectProject thunk
export const rejectProject = createAsyncThunk(
  "admin/rejectProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/admin/projects/${projectId}/reject`);
      toast.success("Project rejected.");
      return response.data;
    } catch (error) {
      toast.error("Failed to reject project");
      return rejectWithValue(error.response?.data);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    projects: [],
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    // You can handle pending/fulfilled/rejected states here for your UI
  },
});

export default adminSlice.reducer;