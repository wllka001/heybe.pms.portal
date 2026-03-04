import { createSlice } from "@reduxjs/toolkit";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} from "./thunk";

const initialState = {
  employees: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  employee: null,
  loading: false,
  error: null,
};

const EmployeesSlice = createSlice({
  name: "EmployeesSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getEmployees.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getEmployees.fulfilled, (state, action) => {
      state.loading = false;
      state.employees = action.payload?.data || [];
      state.pagination = action.payload?.meta || initialState.pagination;
    });
    builder.addCase(getEmployees.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
    });

    builder.addCase(getEmployee.fulfilled, (state, action) => {
      state.employee = action.payload;
    });

    builder.addCase(createEmployee.fulfilled, (state, action) => {
      if (action.payload) {
        state.employees = [action.payload, ...state.employees];
      }
    });

    builder.addCase(updateEmployee.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated?._id) return;
      state.employees = state.employees.map((item) =>
        item._id === updated._id ? updated : item,
      );
      if (state.employee?._id === updated._id) {
        state.employee = updated;
      }
    });

    builder.addCase(deleteEmployee.fulfilled, (state, action) => {
      const deletedId = action.payload?.id;
      if (!deletedId) return;
      state.employees = state.employees.filter((item) => item._id !== deletedId);
      if (state.employee?._id === deletedId) {
        state.employee = null;
      }
    });
  },
});

export default EmployeesSlice.reducer;
