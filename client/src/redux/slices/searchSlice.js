import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import searchService from "../../api/searchService";


export const searchResults = createAsyncThunk(
    "properties/search",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await searchService.searchResults(payload)
            console.log(response)
            return response.data;
        } catch (error) {
            console.log("Search Results data catch === ", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const initialState = {
    searchResultData: [],
    isLoading: false,
    isError: false,
    errorMessage: "",
};

const searchSlice = createSlice({
    name: "searchResults",
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(searchResults.pending, (state) => {
                state.isLoading = true;
                state.isSuccess = false;
                state.isError = false
                state.errorMessage = ""
            })
            .addCase(searchResults.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.searchResultData = action.payload.searchResultData || [];
                state.successMessage = action.payload.message || "Successfully Retirved search results Data";
                state.errorMessage = ""
            })
            .addCase(searchResults.rejected, (state, action) => {
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = true;
                state.errorMessage = action.payload
                state.successMessage = ""
            })

    },
});


export default searchSlice.reducer;