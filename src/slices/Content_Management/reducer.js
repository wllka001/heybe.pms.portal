import { createSlice } from "@reduxjs/toolkit";
import {
    getSurplusPackages
} from "./thunk";

export const initialState = {
    packagesData: [],

    error: {},
};
const ContentManagementSlice = createSlice({
    name: 'ContentManagementSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // === Packages ===
        builder.addCase(getSurplusPackages.fulfilled, (state, action) => {
            state.packagesData = action.payload;
        });
        builder.addCase(getSurplusPackages.rejected, (state, action) => {
            state.error = action.packagesData?.error || null;
        });

    }
});

export default ContentManagementSlice.reducer;