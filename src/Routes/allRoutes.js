import React from "react";
import { Navigate } from "react-router-dom";

// //AuthenticationInner pages
import SignIn from "../pages/AuthenticationInner/Login";
import Dashboard from "../pages/Dashboard";
import Organization from "../pages/Organization";
import Buildings from "../pages/Buildings";
import Units from "../pages/Units";
import Tenants from "../pages/Tenants";
import Leases from "../pages/Leases";
import Maintenance from "../pages/Maintenance";
import Employees from "../pages/Employees";
import Reports from "../pages/Reports";
import ExpenseReport from "../pages/Reports/Expenses";
import GeneralFinanceReport from "../pages/Reports/Gen_Finance";
import InvoiceReport from "../pages/Reports/Invoices";
import PaymentReport from "../pages/Reports/payments";
import TenantBalanceReport from "../pages/Reports/Tenant_Balance";
import TenantInvoiceHistoryReport from "../pages/Reports/Tenant_Invoices_History";
import UtilityBillsReport from "../pages/Reports/Utility_Bills";

import UtilityUsages from "../pages/UtilityUsages";
import MaintenanceVendors from "../pages/MaintenanceVendors";
import Expenses from "../pages/Finance/Expenses";
import Invoices from "../pages/Finance/Invoices";
import Payments from "../pages/Finance/Payments";
import UtilityBills from "../pages/Finance/UtilityBills";

//pages

import Packages from "../pages/Content_Management/SurplusPackages";

import TwosVerify from "../pages/AuthenticationInner/TwoStepVerification";
import ChangePassword from "../pages/AuthenticationInner/ChangePassword";
import Cover404 from "../pages/AuthenticationInner/Errors/Cover404";
import Alt404 from "../pages/AuthenticationInner/Errors/Alt404";
import Error500 from "../pages/AuthenticationInner/Errors/Error500";

import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";

const authProtectedRoutes = [
  // Dashboard
  { path: "/dashboard", component: <Dashboard /> },

  // Content
  { path: "/content/packages", component: <Packages /> },
  { path: "/organization", component: <Organization /> },
  { path: "/buildings", component: <Buildings /> },
  { path: "/units", component: <Units /> },
  { path: "/tenants", component: <Tenants /> },
  { path: "/leases", component: <Leases /> },
  { path: "/maintenance", component: <Maintenance /> },
  { path: "/maintenance/vendors", component: <MaintenanceVendors /> },
  { path: "/employees", component: <Employees /> },
  { path: "/reports", component: <Reports /> },
  { path: "/reports/utility-bills-report", component: <UtilityBillsReport /> },
  { path: "/reports/invoice-report", component: <InvoiceReport /> },
  { path: "/reports/payment-report", component: <PaymentReport /> },
  { path: "/reports/expense-report", component: <ExpenseReport /> },
  { path: "/reports/general-finance-report", component: <GeneralFinanceReport /> },
  { path: "/reports/tenant-balance-report", component: <TenantBalanceReport /> },
  { path: "/reports/tenant-invoice-payment-history", component: <TenantInvoiceHistoryReport /> },

  { path: "/utility-usages", component: <UtilityUsages /> },
  { path: "/finance/expenses", component: <Expenses /> },
  { path: "/finance/invoices", component: <Invoices /> },
  { path: "/finance/payments", component: <Payments /> },
  { path: "/finance/utility-bills", component: <UtilityBills /> },


  // Default
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  // { path: "*", component: <Navigate to="/not-found-404" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/login", component: <SignIn /> },

  //AuthenticationInner pages
  { path: "/auth-twostep", component: <TwosVerify /> },
  // { path: "/auth-change-password", component: <ChangePassword /> },
  { path: "/not-found-404", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },

  { path: "/auth-offline", component: <Offlinepage /> },
];

export { authProtectedRoutes, publicRoutes };
