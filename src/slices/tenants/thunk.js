import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { TenantsAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => error?.message || fallback;

export const getTenants = createAsyncThunk(
  "tenants/getTenants",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.list(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load tenants");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getTenant = createAsyncThunk(
  "tenants/getTenant",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.get(id);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load tenant");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createTenant = createAsyncThunk(
  "tenants/createTenant",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.create(data);
      if (!res.success) throw res;
      toast.success(res.message || "Tenant created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create tenant");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateTenant = createAsyncThunk(
  "tenants/updateTenant",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.update(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Tenant updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update tenant");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const deleteTenant = createAsyncThunk(
  "tenants/deleteTenant",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.delete(id);
      if (!res.success) throw res;
      toast.success(res.message || "Tenant deleted successfully");
      return { id };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete tenant");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getTenantLeases = createAsyncThunk(
  "tenants/getTenantLeases",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.leases(id);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load tenant leases");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getTenantDocuments = createAsyncThunk(
  "tenants/getTenantDocuments",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.listDocuments(id);
      if (!res.success) throw res;
      return { tenantId: id, documents: res.data };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load tenant documents");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const uploadTenantDocument = createAsyncThunk(
  "tenants/uploadTenantDocument",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.uploadDocument(id, formData);
      if (!res.success) throw res;
      toast.success(res.message || "Tenant document uploaded successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload tenant document");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const verifyTenantDocument = createAsyncThunk(
  "tenants/verifyTenantDocument",
  async ({ tenantId, documentId, isVerified }, { rejectWithValue }) => {
    try {
      const res = await TenantsAPI.verifyDocument(tenantId, documentId, { isVerified });
      if (!res.success) throw res;
      toast.success(res.message || "Document verification updated");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to verify tenant document");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
