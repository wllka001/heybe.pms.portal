import { createSlice } from "@reduxjs/toolkit";
import {
  createBuilding,
  deleteBuilding,
  getBuilding,
  getBuildings,
  getBuildingStats,
  getBuildingUnits,
  updateBuilding,
} from "./thunk";

export const initialState = {
  buildings: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  building: null,
  buildingStats: null,
  buildingUnits: [],
  loading: false,
  error: null,
};

const BuildingsSlice = createSlice({
  name: "BuildingsSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getBuildings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getBuildings.fulfilled, (state, action) => {
      state.loading = false;
      state.buildings = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getBuildings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    builder.addCase(getBuilding.fulfilled, (state, action) => {
      state.building = action.payload;
    });
    builder.addCase(getBuilding.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(getBuildingStats.fulfilled, (state, action) => {
      state.buildingStats = action.payload;
    });
    builder.addCase(getBuildingStats.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(getBuildingUnits.fulfilled, (state, action) => {
      state.buildingUnits = action.payload || [];
    });
    builder.addCase(getBuildingUnits.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(createBuilding.fulfilled, (state, action) => {
      const created = action.payload;
      if (created) {
        state.buildings = [created, ...state.buildings];
      }
    });
    builder.addCase(createBuilding.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(updateBuilding.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated?._id) {
        return;
      }
      state.buildings = state.buildings.map((item) =>
        item._id === updated._id ? updated : item,
      );
      if (state.building?._id === updated._id) {
        state.building = updated;
      }
    });
    builder.addCase(updateBuilding.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });

    builder.addCase(deleteBuilding.fulfilled, (state, action) => {
      const deletedId = action.payload?.id;
      if (!deletedId) {
        return;
      }
      state.buildings = state.buildings.filter((item) => item._id !== deletedId);
      if (state.building?._id === deletedId) {
        state.building = null;
      }
    });
    builder.addCase(deleteBuilding.rejected, (state, action) => {
      state.error = action.payload || action.error;
    });
  },
});

export default BuildingsSlice.reducer;
