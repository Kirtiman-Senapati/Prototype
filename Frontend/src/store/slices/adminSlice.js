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

export const adminAddStudent = createAsyncThunk("admin/addStudent", async (studentData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post("/admin/student", studentData);
        toast.success("Student added successfully!");
        return response.data.user;
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to add student");
        return rejectWithValue(err.response?.data);
    }
});

export const adminAddSupervisor = createAsyncThunk("admin/addSupervisor", async (supervisorData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post("/admin/supervisor", supervisorData);
        toast.success("Teacher/Supervisor added successfully!");
        return response.data.user;
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to add supervisor");
        return rejectWithValue(err.response?.data);
    }
});

export const getUnassignedProjects = createAsyncThunk("admin/unassignedProjects", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/admin/unassigned-projects");
        return response.data;
    } catch (err) { return rejectWithValue(err.response?.data); }
});

export const getAdminSupervisors = createAsyncThunk("admin/supervisors", async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get("/admin/supervisors");
        return response.data;
    } catch (err) { return rejectWithValue(err.response?.data); }
});

export const assignSupervisorAdmin = createAsyncThunk("admin/assignSupervisor", async ({ id, supervisorId }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.patch(`/admin/assign-supervisor/${id}`, { supervisorId });
        toast.success("Supervisor assigned successfully");
        return response.data;
    } catch (err) { 
        toast.error(err.response?.data?.message || "Error assigning supervisor");
        return rejectWithValue(err.response?.data); 
    }
});

export const updateProjectStatusAdmin = createAsyncThunk("admin/updateProjectStatus", async ({ id, status }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.patch(`/admin/project/${id}/status`, { status });
        toast.success(`Project ${status.toLowerCase()} successfully`);
        return response.data;
    } catch (err) { 
        toast.error(err.response?.data?.message || "Error updating project status");
        return rejectWithValue(err.response?.data); 
    }
});

export const updateProjectDeadlineAdmin = createAsyncThunk("admin/updateProjectDeadline", async ({ id, deadline }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(`/admin/project/${id}/deadline`, { deadline });
        toast.success("Deadline updated successfully automatically saving to database!");
        return response.data;
    } catch (err) { 
        toast.error(err.response?.data?.message || "Error updating project deadline");
        return rejectWithValue(err.response?.data); 
    }
});

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        stats: null,
        recentProjects: [],
        pendingProjects: [],
        recentActivity: [],
        users: [],
        unassignedProjects: [],
        supervisors: [],
        isLoading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAdminDashboard.fulfilled, (state, action) => { 
                state.stats = action.payload.stats; 
                state.recentProjects = action.payload.recentProjects || [];
                state.pendingProjects = action.payload.pendingProjects || [];
                state.recentActivity = action.payload.recentActivity || [];
            })
            .addCase(getAllUsers.fulfilled, (state, action) => { state.users = action.payload.users; })
            .addCase(adminAddStudent.fulfilled, (state, action) => { state.users = [action.payload, ...state.users]; })
            .addCase(adminAddSupervisor.fulfilled, (state, action) => { state.users = [action.payload, ...state.users]; })
            .addCase(deleteUser.fulfilled, (state, action) => { state.users = state.users.filter(u => u._id !== action.payload); })
            .addCase(getUnassignedProjects.fulfilled, (state, action) => { state.unassignedProjects = action.payload.projects; })
            .addCase(getAdminSupervisors.fulfilled, (state, action) => { state.supervisors = action.payload.supervisors; })
            .addCase(assignSupervisorAdmin.fulfilled, (state, action) => {
                const updatedProject = action.payload.project;
                const index = state.unassignedProjects.findIndex(p => p._id === updatedProject._id);
                if (index !== -1) {
                    state.unassignedProjects[index].supervisor = updatedProject.supervisor; 
                }
            })
            // no need to tightly couple state array updates here as component fetches data directly, 
            // but we can add an empty fulfilled for updateProjectStatusAdmin to avoid missing the action
            .addCase(updateProjectStatusAdmin.fulfilled, (state, action) => {})
    }
});

export default adminSlice.reducer;