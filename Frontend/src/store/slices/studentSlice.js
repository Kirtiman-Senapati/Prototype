import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

// 1. Create and export the missing submitProposal thunk
export const submitProposal = createAsyncThunk(
  "student/submitProposal",
  async (proposalData, { rejectWithValue }) => {
    try {
      // Note: Adjust the "/proposals" URL to match your actual backend API route
      const response = await axiosInstance.post("/proposals", proposalData);
      toast.success("Proposal submitted successfully!");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit proposal");
      return rejectWithValue(error.response?.data);
    }
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    project: null,
    files: [],
    supervisors: [],
    dashboardStats: [],
    supervisor: null,
    deadlines: [],
    feedback: [],
    status: null,
    isLoading: false, // Added a loading state to track the API request
  },
  reducers: {},
  extraReducers: (builder) => {
    // 2. Handle the loading, success, and error states of your thunk
    builder
      .addCase(submitProposal.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitProposal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.project = action.payload; // Assuming the API returns the created project
      })
      .addCase(submitProposal.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default studentSlice.reducer;
