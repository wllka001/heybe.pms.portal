import { createSlice } from "@reduxjs/toolkit";
import {
  bulkCreateUnits,
  createUnit,
  deleteUnit,
  getUnit,
  getUnits,
  updateUnit,
  updateUnitStatus,
} from "./thunk";

export const initialState = {
  units: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  unit: null,
  loading: false,
  error: null,
};

const UnitsSlice = createSlice({
  name: "UnitsSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getUnits.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUnits.fulfilled, (state, action) => {
      state.loading = false;
      state.units = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getUnits.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    builder.addCase(getUnit.fulfilled, (state, action) => {
      state.unit = action.payload;
    });
    builder.addCase(getUnit.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(createUnit.fulfilled, (state, action) => {
      const created = action.payload;
      if (created) {
        state.units = [created, ...state.units];
      }
    });
    builder.addCase(createUnit.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(bulkCreateUnits.fulfilled, (state, action) => {
      const created = Array.isArray(action.payload) ? action.payload : [];
      if (created.length) {
        state.units = [...created, ...state.units];
      }
    });
    builder.addCase(bulkCreateUnits.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(updateUnit.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated?._id) {
        return;
      }
      state.units = state.units.map((item) =>
        item._id === updated._id ? updated : item,
      );
      if (state.unit?._id === updated._id) {
        state.unit = updated;
      }
    });
    builder.addCase(updateUnit.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(updateUnitStatus.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated?._id) {
        return;
      }
      state.units = state.units.map((item) =>
        item._id === updated._id ? updated : item,
      );
      if (state.unit?._id === updated._id) {
        state.unit = updated;
      }
    });
    builder.addCase(updateUnitStatus.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(deleteUnit.fulfilled, (state, action) => {
      const deletedId = action.payload?.id;
      if (!deletedId) {
        return;
      }
      state.units = state.units.filter((item) => item._id !== deletedId);
      if (state.unit?._id === deletedId) {
        state.unit = null;
      }
    });
    builder.addCase(deleteUnit.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });
  },
});

export default UnitsSlice.reducer;
