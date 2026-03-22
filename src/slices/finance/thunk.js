import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { FinanceAPI } from "../../helpers/backend_helper";

const getErrorMessage = (error, fallback) => error?.message || fallback;

export const getInvoices = createAsyncThunk(
  "finance/getInvoices",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.listInvoices(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load invoices");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const generateMonthlyInvoices = createAsyncThunk(
  "finance/generateMonthlyInvoices",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.generateInvoices(data);
      if (!res.success) throw res;
      toast.success(res.message || "Monthly invoices generated successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to generate monthly invoices");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createInvoice = createAsyncThunk(
  "finance/createInvoice",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.createInvoice(data);
      if (!res.success) throw res;
      toast.success(res.message || "Invoice created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create invoice");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getPayments = createAsyncThunk(
  "finance/getPayments",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.listPayments(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load payments");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createPayment = createAsyncThunk(
  "finance/createPayment",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.createPayment(data);
      if (!res.success) throw res;
      toast.success(res.message || "Payment collected successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to collect payment");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const getExpenses = createAsyncThunk(
  "finance/getExpenses",
  async ({ params } = {}, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.listExpenses(params);
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load expenses");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);

export const createExpense = createAsyncThunk(
  "finance/createExpense",
  async ({ data }, { rejectWithValue }) => {
    try {
      const res = await FinanceAPI.createExpense(data);
      if (!res.success) throw res;
      toast.success(res.message || "Expense created successfully");
      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create expense");
      toast.error(message);
      return rejectWithValue(error);
    }
  },
);
