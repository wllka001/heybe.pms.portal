import { createSlice } from "@reduxjs/toolkit";
import {
  addMaintenanceAttachment,
  addMaintenanceCost,
  assignMaintenanceRequest,
  completeMaintenanceRequest,
  createVendor,
  createMaintenanceRequest,
  getVendors,
  getMaintenanceRequests,
  updateVendor,
  updateMaintenanceRequest,
  updateMaintenanceStatus,
} from "./thunk";

const initialState = {
  requests: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  loading: false,
  vendors: [],
  error: null,
};

const MaintenanceSlice = createSlice({
  name: "MaintenanceSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getMaintenanceRequests.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getMaintenanceRequests.fulfilled, (state, action) => {
      state.loading = false;
      state.requests = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getMaintenanceRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    const upsertRequest = (state, request) => {
      if (!request?._id) return;
      state.requests = state.requests.map((item) =>
        item._id === request._id ? request : item,
      );
      if (!state.requests.find((item) => item._id === request._id)) {
        state.requests = [request, ...state.requests];
      }
    };

    builder.addCase(createMaintenanceRequest.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });
    builder.addCase(updateMaintenanceRequest.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });
    builder.addCase(updateMaintenanceStatus.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });
    builder.addCase(completeMaintenanceRequest.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });
    builder.addCase(assignMaintenanceRequest.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });
    builder.addCase(addMaintenanceCost.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });
    builder.addCase(addMaintenanceAttachment.fulfilled, (state, action) => {
      upsertRequest(state, action.payload);
    });

    builder.addCase(getVendors.fulfilled, (state, action) => {
      state.vendors = Array.isArray(action.payload) ? action.payload : [];
    });

    const upsertVendor = (state, vendor) => {
      if (!vendor?._id) return;
      const idx = state.vendors.findIndex((item) => item._id === vendor._id);
      if (idx >= 0) {
        state.vendors[idx] = vendor;
      } else {
        state.vendors = [vendor, ...state.vendors];
      }
    };

    builder.addCase(createVendor.fulfilled, (state, action) => {
      upsertVendor(state, action.payload);
    });
    builder.addCase(updateVendor.fulfilled, (state, action) => {
      upsertVendor(state, action.payload);
    });
  },
});

export default MaintenanceSlice.reducer;
