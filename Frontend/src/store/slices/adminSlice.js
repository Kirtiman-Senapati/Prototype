import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const getAdminDashboard = createAsyncThunk("admin/dashboard", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/admin/dashboard");
        return response.data;
    } catch (err) { return rejectWithValue(err.response?.data); }
});

export const getAllUsers = createAsyncThunk("admin/users", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/admin/users");
        return response.data;
    } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteUser = createAsyncThunk("admin/deleteUser", async (userId, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.delete(`/admin/user/${userId}`);
        toast.success("User deleted");
        return userId;
    } catch (err) { return rejectWithValue(err.response?.data); }
});

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        stats: null,
        recentProjects: [],
        recentActivity: [],
        users: [],
        isLoading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAdminDashboard.fulfilled, (state, action) => { 
                state.stats = action.payload.stats; 
                state.recentProjects = action.payload.recentProjects || [];
                state.recentActivity = action.payload.recentActivity || [];
            })
            .addCase(getAllUsers.fulfilled, (state, action) => { state.users = action.payload.users; })
            .addCase(deleteUser.fulfilled, (state, action) => { state.users = state.users.filter(u => u._id !== action.payload); });
    }
});

export default adminSlice.reducer;