import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { UtilityUsagesAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => error?.message || fallback;

export const getUtilityUsages = createAsyncThunk(
  "utilityUsages/getUtilityUsages",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await UtilityUsagesAPI.list(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load utility usages");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createUtilityUsage = createAsyncThunk(
  "utilityUsages/createUtilityUsage",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await UtilityUsagesAPI.create(data);
      if (!res.success) throw res;
      toast.success(res.message || "Utility usage created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create utility usage");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateUtilityUsage = createAsyncThunk(
  "utilityUsages/updateUtilityUsage",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await UtilityUsagesAPI.update(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Utility usage updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update utility usage");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const deleteUtilityUsage = createAsyncThunk(
  "utilityUsages/deleteUtilityUsage",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await UtilityUsagesAPI.delete(id);
      if (!res.success) throw res;
      toast.success(res.message || "Utility usage deleted successfully");
      return { id };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete utility usage");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

