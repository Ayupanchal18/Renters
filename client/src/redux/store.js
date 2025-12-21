import { configureStore } from '@reduxjs/toolkit';

import postpropertyReducer from "./slices/propertySlice"
import searchResultsReducer from "./slices/searchSlice"
import filtersReducer from "./slices/filterSlice"
import urlSyncMiddleware from "./middleware/urlSyncMiddleware"
import { propertyApi } from "./api/propertyApi"


export const store = configureStore({
    reducer: {
        postproperty: postpropertyReducer,
        searchResults: searchResultsReducer,
        filters: filtersReducer,
        [propertyApi.reducerPath]: propertyApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(propertyApi.middleware)
            .concat(urlSyncMiddleware),
});

export default store;