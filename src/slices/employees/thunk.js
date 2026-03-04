import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { EmployeesAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => error?.message || fallback;

export const getEmployees = createAsyncThunk(
  "employees/getEmployees",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await EmployeesAPI.list(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load employees");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getEmployee = createAsyncThunk(
  "employees/getEmployee",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await EmployeesAPI.get(id);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load employee");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await EmployeesAPI.create(data);
      if (!res.success) throw res;
      toast.success(res.message || "Employee created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create employee");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const updateEmployee = createAsyncThunk(
  "employees/updateEmployee",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await EmployeesAPI.update(id, data);
      if (!res.success) throw res;
      toast.success(res.message || "Employee updated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update employee");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  "employees/deleteEmployee",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await EmployeesAPI.delete(id);
      if (!res.success) throw res;
      toast.success(res.message || "Employee deleted successfully");
      return { id };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete employee");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
