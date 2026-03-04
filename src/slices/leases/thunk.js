import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { LeasesAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => error?.message || fallback;

export const getLeases = createAsyncThunk(
  "leases/getLeases",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await LeasesAPI.list(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load leases");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getLease = createAsyncThunk(
  "leases/getLease",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await LeasesAPI.get(id);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load lease");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createLease = createAsyncThunk(
  "leases/createLease",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await LeasesAPI.create(data);
      if (!res.success) throw res;
      toast.success(res.message || "Lease created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create lease");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateLease = createAsyncThunk(
  "leases/updateLease",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await LeasesAPI.update(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Lease updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update lease");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const terminateLease = createAsyncThunk(
  "leases/terminateLease",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await LeasesAPI.terminate(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Lease terminated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to terminate lease");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
