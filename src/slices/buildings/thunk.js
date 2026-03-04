import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { BuildingsAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => {
  return error?.message || fallback;
};

export const getBuildings = createAsyncThunk(
  "buildings/getBuildings",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.list(params);
      if (!res.success) {
        throw res;
      }
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load buildings");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getBuilding = createAsyncThunk(
  "buildings/getBuilding",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.get(id);
      if (!res.success) {
        throw res;
      }
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load building");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getBuildingStats = createAsyncThunk(
  "buildings/getBuildingStats",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.stats(id);
      if (!res.success) {
        throw res;
      }
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load building stats");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getBuildingUnits = createAsyncThunk(
  "buildings/getBuildingUnits",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.units(id);
      if (!res.success) {
        throw res;
      }
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load building units");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createBuilding = createAsyncThunk(
  "buildings/createBuilding",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.create(data);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Building created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create building");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateBuilding = createAsyncThunk(
  "buildings/updateBuilding",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.update(id, data);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Building updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update building");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const deleteBuilding = createAsyncThunk(
  "buildings/deleteBuilding",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await BuildingsAPI.delete(id);
      if (!res.success) {
        throw res;
      }
      toast.success(res.message || "Building deleted successfully");
      return { id, data: res.data };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete building");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
