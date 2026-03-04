import { createSlice } from "@reduxjs/toolkit";
import {
  createTenant,
  deleteTenant,
  getTenant,
  getTenantDocuments,
  getTenantLeases,
  getTenants,
  uploadTenantDocument,
  updateTenant,
  verifyTenantDocument,
} from "./thunk";

const initialState = {
  tenants: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  tenant: null,
  tenantLeases: [],
  tenantDocuments: [],
  loading: false,
  error: null,
};

const TenantsSlice = createSlice({
  name: "TenantsSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getTenants.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getTenants.fulfilled, (state, action) => {
      state.loading = false;
      state.tenants = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getTenants.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    builder.addCase(getTenant.fulfilled, (state, action) => {
      state.tenant = action.payload;
    });
    builder.addCase(getTenantLeases.fulfilled, (state, action) => {
      state.tenantLeases = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(getTenantDocuments.fulfilled, (state, action) => {
      state.tenantDocuments = Array.isArray(action.payload?.documents)
        ? action.payload.documents
        : [];
    });

    builder.addCase(createTenant.fulfilled, (state, action) => {
      if (action.payload) {
        state.tenants = [action.payload, ...state.tenants];
      }
    });

    builder.addCase(updateTenant.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated?._id) return;
      state.tenants = state.tenants.map((item) =>
        item._id === updated._id ? updated : item,
      );
      if (state.tenant?._id === updated._id) {
        state.tenant = updated;
      }
    });

    builder.addCase(deleteTenant.fulfilled, (state, action) => {
      const deletedId = action.payload?.id;
      if (!deletedId) return;
      state.tenants = state.tenants.filter((item) => item._id !== deletedId);
      if (state.tenant?._id === deletedId) {
        state.tenant = null;
      }
    });

    const upsertDocument = (state, document) => {
      if (!document?._id) return;
      const idx = state.tenantDocuments.findIndex((item) => item._id === document._id);
      if (idx >= 0) {
        state.tenantDocuments[idx] = document;
      } else {
        state.tenantDocuments = [document, ...state.tenantDocuments];
      }
    };

    builder.addCase(uploadTenantDocument.fulfilled, (state, action) => {
      upsertDocument(state, action.payload);
    });

    builder.addCase(verifyTenantDocument.fulfilled, (state, action) => {
      upsertDocument(state, action.payload);
    });
  },
});

export default TenantsSlice.reducer;
