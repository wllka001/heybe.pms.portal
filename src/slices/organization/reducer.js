import { createSlice } from "@reduxjs/toolkit";
import { getOrganization } from "./thunk";

export const initialState = {
    organizationData: [],

    error: {},
};
const OrganizationManagementSlice = createSlice({
    name: 'OrganizationManagementSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // === organization ===
        builder.addCase(getOrganization.fulfilled, (state, action) => {
            state.organizationData = action.payload;
        });
        builder.addCase(getOrganization.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

    }
});

export default OrganizationManagementSlice.reducer;