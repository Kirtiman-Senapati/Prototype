import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const login = createAsyncThunk("auth/login",async (data ,thunkAPI) => 
  {
    try 
    {
      const response = await axiosInstance.post("/auth/login", data, 
      {
        headers: 
        {
          "Content-Type": "application/json",
        },
      });

      toast.success(response.data.message || "Login successful!");
      
      return response.data;

    } 
    catch (error) 
    {
      toast.error(error.response?.data?.message || "Login failed!");
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const registerUser = createAsyncThunk("auth/register", async (data, thunkAPI) => {
    try {
        const response = await axiosInstance.post("/auth/register", data, {
            headers: { "Content-Type": "application/json" }
        });
        toast.success(response.data.message || "Registration successful!");
        return response.data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Registration failed!");
        return thunkAPI.rejectWithValue(error.response?.data);
    }
});

export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.get("/auth/me");
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data);
    }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
    try {
        await axiosInstance.get("/auth/logout");
        toast.success("Logged out successfully");
        return null;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data);
    }
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (email, thunkAPI) => {
    try {
        const response = await axiosInstance.post("/auth/password/forgot", { email }, {
            headers: { "Content-Type": "application/json" }
        });
        toast.success(response.data.message || "Password reset email sent!");
        return response.data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send reset email.");
        return thunkAPI.rejectWithValue(error.response?.data);
    }
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async ({ token, password, confirmPassword }, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/auth/password/reset/${token}`, { password, confirmPassword }, {
            headers: { "Content-Type": "application/json" }
        });
        toast.success(response.data.message || "Password reset successful!");
        return response.data;
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to reset password.");
        return thunkAPI.rejectWithValue(error.response?.data);
    }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isLoggingIn: false,
    isCheckingAuth: true,
  },
  reducers: {},
  extraReducers: (builder) => 
  {
    builder.addCase(login.pending, (state) => 
      {
        state.isLoggingIn = true;
      })
      .addCase(login.fulfilled, (state, action) => 
      {
        state.isLoggingIn = false;
        state.authUser = action.payload.user;
      })
      .addCase(login.rejected, (state) => 
      {
        state.isLoggingIn = false;
      })
      .addCase(checkAuth.pending, (state) => { state.isCheckingAuth = true; })
      .addCase(checkAuth.fulfilled, (state, action) => {
          state.authUser = action.payload.user;
          state.isCheckingAuth = false;
      })
      .addCase(checkAuth.rejected, (state) => {
          state.authUser = null;
          state.isCheckingAuth = false;
      })
      .addCase(logout.fulfilled, (state) => {
          state.authUser = null;
      });
  },
});

export default authSlice.reducer;
