import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import propertyService from "../../api/propertyService";


export const postProperty = createAsyncThunk(
    "properties/postProperty",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await propertyService.postproperty(payload)
            return response.data;
        } catch (error) {
            console.log("Post Property data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
export const getAllProperties = createAsyncThunk(
    "properties/getAllProperties",
    async (_, { rejectWithValue }) => {
        try {
            const response = await propertyService.getAllProperties()
            return response.data;
        } catch (error) {
            console.log("Get all Property data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);
export const getPropertyByID = createAsyncThunk(
    "properties/:slug",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await propertyService.getPropertyByID(payload)
            return response.data;
        } catch (error) {
            console.log("Get property data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


const initialState = {
    propertyData: {},
    allProperties: [],
    propertyDataId: {},
    isLoading: false,
    isError: false,
    errorMessage: "",
};

const propertySlice = createSlice({
    name: "propertyData",
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(postProperty.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(postProperty.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.propertyData = action.payload.propertyData || {};
                state.successMessage = action.payload.message || "Successfully posted property Data";
                state.errorMessage = ""
            })
            .addCase(postProperty.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })
            .addCase(getAllProperties.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(getAllProperties.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.allProperties = action.payload.items || [];
                state.successMessage = action.payload.message || "Successfully fetched all property Data";
                state.errorMessage = ""
            })
            .addCase(getAllProperties.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })
            .addCase(getPropertyByID.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(getPropertyByID.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.propertyDataId = action.payload.propertyDataId || {};
                state.successMessage = action.payload.message || "Successfully fetched property Data";
                state.errorMessage = ""
            })
            .addCase(getPropertyByID.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })
    },
});


export default propertySlice.reducer;