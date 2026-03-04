import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { UnitsAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => {
  return error?.message || fallback;
};

export const getUnits = createAsyncThunk(
  "units/getUnits",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.list(params);
      if (!res.success) {
        throw res;
      }
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load units");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getUnit = createAsyncThunk(
  "units/getUnit",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.get(id);
      if (!res.success) {
        throw res;
      }
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load unit");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createUnit = createAsyncThunk(
  "units/createUnit",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.create(data);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Unit created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create unit");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const bulkCreateUnits = createAsyncThunk(
  "units/bulkCreateUnits",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.bulkCreate(data);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Units created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to bulk create units");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateUnit = createAsyncThunk(
  "units/updateUnit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.update(id, data);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Unit updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update unit");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateUnitStatus = createAsyncThunk(
  "units/updateUnitStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.updateStatus(id, status);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Unit status updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update unit status");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const deleteUnit = createAsyncThunk(
  "units/deleteUnit",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await UnitsAPI.delete(id);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Unit deleted successfully");
      return { id, data: res.data };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete unit");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
