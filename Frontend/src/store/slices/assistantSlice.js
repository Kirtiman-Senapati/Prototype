import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "../../utils/toast";

export const sendMessage = createAsyncThunk(
    "assistant/sendMessage",
    async (messageText, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/assistant/chat", { message: messageText });
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to communicate with assistant");
            return rejectWithValue(error.response?.data);
        }
    }
);

const initialState = {
    isOpen: false,
    messages: [
        { id: 1, role: "assistant", content: "Hello! I am your Academic Assistant. I can help you with project guidelines, report structures, presentation formats, and workflow queries. How can I assist you today?" }
    ],
    isLoading: false,
};

const assistantSlice = createSlice({
    name: "assistant",
    initialState,
    reducers: {
        toggleAssistant: (state) => {
            state.isOpen = !state.isOpen;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
            // Limit to last 20 messages for memory safety
            if (state.messages.length > 20) {
                state.messages = state.messages.slice(state.messages.length - 20);
            }
        },
        clearHistory: (state) => {
            state.messages = initialState.messages;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendMessage.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isLoading = false;
                state.messages.push({
                    id: Date.now(),
                    role: "assistant",
                    content: action.payload.reply
                });
                if (state.messages.length > 20) {
                    state.messages = state.messages.slice(state.messages.length - 20);
                }
            })
            .addCase(sendMessage.rejected, (state) => {
                state.isLoading = false;
                state.messages.push({
                    id: Date.now(),
                    role: "assistant",
                    content: "Sorry, I am experiencing technical difficulties. Please contact your administrator."
                });
            });
    }
});

export const { toggleAssistant, addMessage, clearHistory } = assistantSlice.actions;
export default assistantSlice.reducer;
