import { createSlice } from "@reduxjs/toolkit";
import {
  createLease,
  getLease,
  getLeases,
  terminateLease,
  updateLease,
} from "./thunk";

const initialState = {
  leases: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  lease: null,
  loading: false,
  error: null,
};

const LeasesSlice = createSlice({
  name: "LeasesSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getLeases.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getLeases.fulfilled, (state, action) => {
      state.loading = false;
      state.leases = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getLeases.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    builder.addCase(getLease.fulfilled, (state, action) => {
      state.lease = action.payload;
    });

    const upsertLease = (state, lease) => {
      if (!lease?._id) return;
      state.leases = state.leases.map((item) =>
        item._id === lease._id ? lease : item,
      );
      if (!state.leases.find((item) => item._id === lease._id)) {
        state.leases = [lease, ...state.leases];
      }
      if (state.lease?._id === lease._id) {
        state.lease = lease;
      }
    };

    builder.addCase(createLease.fulfilled, (state, action) => {
      upsertLease(state, action.payload);
    });
    builder.addCase(updateLease.fulfilled, (state, action) => {
      upsertLease(state, action.payload);
    });
    builder.addCase(terminateLease.fulfilled, (state, action) => {
      upsertLease(state, action.payload);
    });
  },
});

export default LeasesSlice.reducer;
