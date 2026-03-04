import { createSlice } from "@reduxjs/toolkit";
import {
  createUtilityUsage,
  deleteUtilityUsage,
  getUtilityUsages,
  updateUtilityUsage,
} from "./thunk";

const initialState = {
  usages: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  loading: false,
  error: null,
};

const UtilityUsagesSlice = createSlice({
  name: "UtilityUsagesSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUtilityUsages.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUtilityUsages.fulfilled, (state, action) => {
      state.loading = false;
      state.usages = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getUtilityUsages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    const upsertUsage = (state, usage) => {
      if (!usage?._id) return;
      const idx = state.usages.findIndex((item) => item._id === usage._id);
      if (idx >= 0) {
        state.usages[idx] = usage;
      } else {
        state.usages = [usage, ...state.usages];
      }
    };

    builder.addCase(createUtilityUsage.fulfilled, (state, action) => {
      upsertUsage(state, action.payload);
    });
    builder.addCase(updateUtilityUsage.fulfilled, (state, action) => {
      upsertUsage(state, action.payload);
    });
    builder.addCase(deleteUtilityUsage.fulfilled, (state, action) => {
      const deletedId = action.payload?.id;
      if (!deletedId) return;
      state.usages = state.usages.filter((item) => item._id !== deletedId);
    });
  },
});

export default UtilityUsagesSlice.reducer;

