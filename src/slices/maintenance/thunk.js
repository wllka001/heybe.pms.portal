import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { MaintenanceAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => error?.message || fallback;

export const getMaintenanceRequests = createAsyncThunk(
  "maintenance/getRequests",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.listRequests(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load maintenance requests");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createMaintenanceRequest = createAsyncThunk(
  "maintenance/createRequest",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.createRequest(data);
      if (!res.success) throw res;
      toast.success(res.message || "Maintenance request created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create maintenance request");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateMaintenanceRequest = createAsyncThunk(
  "maintenance/updateRequest",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.updateRequest(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Maintenance request updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update maintenance request");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateMaintenanceStatus = createAsyncThunk(
  "maintenance/updateStatus",
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.updateStatus(id, status, notes);
      if (!res.success) throw res;
      toast.success(res.message || "Maintenance status updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update maintenance status");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const completeMaintenanceRequest = createAsyncThunk(
  "maintenance/completeRequest",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.complete(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Maintenance request completed");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to complete maintenance request");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const assignMaintenanceRequest = createAsyncThunk(
  "maintenance/assignRequest",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.assignRequest(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Maintenance request assigned");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to assign maintenance request");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const addMaintenanceCost = createAsyncThunk(
  "maintenance/addCost",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.addCost(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Maintenance cost updated");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to add maintenance cost");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const addMaintenanceAttachment = createAsyncThunk(
  "maintenance/addAttachment",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.addAttachment(id, formData);
      if (!res.success) throw res;
      toast.success(res.message || "Attachment uploaded");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload attachment");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getVendors = createAsyncThunk(
  "maintenance/getVendors",
  async (_, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.listVendors();
      if (!res.success) throw res;
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load vendors");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createVendor = createAsyncThunk(
  "maintenance/createVendor",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.createVendor(data);
      if (!res.success) throw res;
      toast.success(res.message || "Vendor created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create vendor");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateVendor = createAsyncThunk(
  "maintenance/updateVendor",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await MaintenanceAPI.updateVendor(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Vendor updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update vendor");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
