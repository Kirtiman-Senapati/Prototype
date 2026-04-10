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
      toast.error(error.response.data.message || "Login failed!");
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingPassword: false,
    isRequestingForToken: false,
    isCheckingAuth: true,
  },
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
      });
  },
});

export default authSlice.reducer;
