import { createSlice } from "@reduxjs/toolkit";
import {
  createExpense,
  createInvoice,
  createPayment,
  getExpenses,
  getInvoices,
  getPayments,
} from "./thunk";

const initialPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const initialState = {
  invoices: [],
  invoicePagination: initialPagination,
  payments: [],
  paymentPagination: initialPagination,
  expenses: [],
  expensePagination: initialPagination,
  loadingInvoices: false,
  loadingPayments: false,
  loadingExpenses: false,
  error: null,
};

const FinanceSlice = createSlice({
  name: "FinanceSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getInvoices.pending, (state) => {
      state.loadingInvoices = true;
      state.error = null;
    });
    builder.addCase(getInvoices.fulfilled, (state, action) => {
      state.loadingInvoices = false;
      state.invoices = action.payload?.data || [];
      state.invoicePagination = action.payload?.meta || initialPagination;
    });
    builder.addCase(getInvoices.rejected, (state, action) => {
      state.loadingInvoices = false;
      state.error = action.payload || action.error;
    });
    builder.addCase(createInvoice.fulfilled, (state, action) => {
      if (!action.payload?._id) return;
      state.invoices = [action.payload, ...state.invoices];
    });

    builder.addCase(getPayments.pending, (state) => {
      state.loadingPayments = true;
      state.error = null;
    });
    builder.addCase(getPayments.fulfilled, (state, action) => {
      state.loadingPayments = false;
      state.payments = action.payload?.data || [];
      state.paymentPagination = action.payload?.meta || initialPagination;
    });
    builder.addCase(getPayments.rejected, (state, action) => {
      state.loadingPayments = false;
      state.error = action.payload || action.error;
    });
    builder.addCase(createPayment.fulfilled, (state, action) => {
      if (!action.payload?._id) return;
      state.payments = [action.payload, ...state.payments];
    });

    builder.addCase(getExpenses.pending, (state) => {
      state.loadingExpenses = true;
      state.error = null;
    });
    builder.addCase(getExpenses.fulfilled, (state, action) => {
      state.loadingExpenses = false;
      state.expenses = action.payload?.data || [];
      state.expensePagination = action.payload?.meta || initialPagination;
    });
    builder.addCase(getExpenses.rejected, (state, action) => {
      state.loadingExpenses = false;
      state.error = action.payload || action.error;
    });
    builder.addCase(createExpense.fulfilled, (state, action) => {
      if (!action.payload?._id) return;
      state.expenses = [action.payload, ...state.expenses];
    });
  },
});

export default FinanceSlice.reducer;
