import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "../../utils/toast";

// 1. Export the missing getProject thunk
export const getProject = createAsyncThunk(
  "project/getProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// 2. Export the missing updateProject thunk
export const updateProject = createAsyncThunk(
  "project/updateProject",
  async ({ projectId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/projects/${projectId}`, data);
      toast.success("Project updated successfully!");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update project");
      return rejectWithValue(error.response?.data);
    }
  }
);

// 3. Export the missing downloadProjectFile thunk (This fixes your current crash)
export const downloadProjectFile = createAsyncThunk(
  "project/downloadProjectFile",
  async (fileId, { rejectWithValue }) => {
    try {
      // Note: File downloads usually require responseType: 'blob'
      const response = await axiosInstance.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });
      return response.data; 
    } catch (error) {
      toast.error("Failed to download file");
      return rejectWithValue(error.response?.data);
    }
  }
);

const projectSlice = createSlice({
  name: "project",
  initialState: {
    currentProject: null,
    isLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    // You can handle state changes here later
  },
});

export default projectSlice.reducer;