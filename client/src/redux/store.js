import { configureStore } from '@reduxjs/toolkit';

import postpropertyReducer from "./slices/propertySlice"
import searchResultsReducer from "./slices/searchSlice"


export const store = configureStore({
    reducer: {
        postproperty: postpropertyReducer,
        searchResults: searchResultsReducer
    },
});

export default store;