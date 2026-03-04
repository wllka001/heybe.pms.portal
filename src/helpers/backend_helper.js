// src/helpers/backend_helper.js
import axios from "axios";
import api from "./api_helper";
import * as url from "./url_helper";

export const getLoggedInUser = () => {
  const user = localStorage.getItem("user");
  if (user) return JSON.parse(user);
  return null;
};

// //is user is logged in
export const isUserAuthenticated = () => {
  return getLoggedInUser() !== null;
};

// generic CRUD function
const makeCRUD = (endpoint) => ({
  list: () => api.get(endpoint),
  create: (payload) => api.post(endpoint, payload),
  update: (payload) => api.update(`${endpoint}/${payload._id}`, payload),
  delete: (id) => api.delete(`${endpoint}/${id}`),
});

// Auth
export const login = (data) => api.post(url.POST_LOGIN, data);
export const getDashboardOverview = () => api.get(url.DASHBOARD_OVERVIEW);


// // ==================================  URL ===================================================

export const Surplus_PackageAPI = {
  list: (id) => api.get(url.SURPLUS_PACKAGE, { businessId: id }),
  delete: (id) => api.delete(`${url.SURPLUS_PACKAGE}/${id}`),
  createOrUpdate: (payload) =>
    axios.post(url.SURPLUS_PACKAGE, payload, {
      headers: { "Content-Type": undefined },
    }),
};


export const OrganizationsAPI = {
  list: (id) => api.get(url.ORGANIZATIONS, { businessId: id }),
  get: (id) => api.get(`${url.ORGANIZATIONS}/${id}`),
  delete: (id) => api.delete(`${url.ORGANIZATIONS}/${id}`),
  create: (payload) =>
    axios.post(url.ORGANIZATIONS, payload, {
      headers: { "Content-Type": undefined },
    }),
  update: (id, payload) =>
    axios.patch(`${url.ORGANIZATIONS}/${id}`, payload, {
      headers: { "Content-Type": undefined },
    }),
};

export const BuildingsAPI = {
  list: (params) => api.get(url.BUILDINGS, params),
  get: (id) => api.get(`${url.BUILDINGS}/${id}`),
  stats: (id) => api.get(`${url.BUILDINGS}/${id}/stats`),
  units: (id) => api.get(`${url.BUILDINGS}/${id}/units`),
  create: (payload) => api.post(url.BUILDINGS, payload),
  update: (id, payload) => api.patch(`${url.BUILDINGS}/${id}`, payload),
  delete: (id) => api.delete(`${url.BUILDINGS}/${id}`),
};

export const UnitsAPI = {
  list: (params) => api.get(url.UNITS, params),
  get: (id) => api.get(`${url.UNITS}/${id}`),
  leaseHistory: (id) => api.get(`${url.UNITS}/${id}/lease-history`),
  create: (payload) => api.post(url.UNITS, payload),
  bulkCreate: (payload) => api.post(`${url.UNITS}/bulk`, payload),
  update: (id, payload) => api.patch(`${url.UNITS}/${id}`, payload),
  updateStatus: (id, status) => api.patch(`${url.UNITS}/${id}/status`, { status }),
  delete: (id) => api.delete(`${url.UNITS}/${id}`),
};

export const TenantsAPI = {
  list: (params) => api.get(url.TENANTS, params),
  get: (id) => api.get(`${url.TENANTS}/${id}`),
  create: (payload) => api.post(url.TENANTS, payload),
  update: (id, payload) => api.patch(`${url.TENANTS}/${id}`, payload),
  delete: (id) => api.delete(`${url.TENANTS}/${id}`),
  leases: (id) => api.get(`${url.TENANTS}/${id}/leases`),
  listDocuments: (id) => api.get(`${url.TENANTS}/${id}/documents`),
  uploadDocument: (id, formData) =>
    axios.post(`${url.TENANTS}/${id}/documents`, formData, {
      headers: { "Content-Type": undefined },
    }),
  verifyDocument: (id, documentId, payload) =>
    api.patch(`${url.TENANTS}/${id}/documents/${documentId}/verify`, payload),
};

export const LeasesAPI = {
  list: (params) => api.get(url.LEASES, params),
  get: (id) => api.get(`${url.LEASES}/${id}`),
  active: () => api.get(`${url.LEASES}/active`),
  create: (payload) => api.post(url.LEASES, payload),
  update: (id, payload) => api.patch(`${url.LEASES}/${id}`, payload),
  terminate: (id, payload) => api.post(`${url.LEASES}/${id}/terminate`, payload),
  renew: (id, payload) => api.post(`${url.LEASES}/${id}/renew`, payload),
  invoices: (id) => api.get(`${url.LEASES}/${id}/invoices`),
};

export const MaintenanceAPI = {
  listRequests: (params) => api.get(`${url.MAINTENANCE}/requests`, params),
  getRequest: (id) => api.get(`${url.MAINTENANCE}/requests/${id}`),
  createRequest: (payload) => api.post(`${url.MAINTENANCE}/requests`, payload),
  updateRequest: (id, payload) => api.patch(`${url.MAINTENANCE}/requests/${id}`, payload),
  assignRequest: (id, payload) => api.post(`${url.MAINTENANCE}/requests/${id}/assign`, payload),
  updateStatus: (id, status, notes) =>
    api.post(`${url.MAINTENANCE}/requests/${id}/status`, { status, notes }),
  addCost: (id, payload) => api.post(`${url.MAINTENANCE}/requests/${id}/cost`, payload),
  addAttachment: (id, formData) =>
    axios.post(`${url.MAINTENANCE}/requests/${id}/attachments`, formData, {
      headers: { "Content-Type": undefined },
    }),
  complete: (id, payload) => api.post(`${url.MAINTENANCE}/requests/${id}/complete`, payload),
  createVendor: (payload) => api.post(`${url.MAINTENANCE}/vendors`, payload),
  listVendors: () => api.get(`${url.MAINTENANCE}/vendors`),
  getVendor: (id) => api.get(`${url.MAINTENANCE}/vendors/${id}`),
  updateVendor: (id, payload) => api.patch(`${url.MAINTENANCE}/vendors/${id}`, payload),
};

export const EmployeesAPI = {
  list: (params) => api.get(url.EMPLOYEES, params),
  get: (id) => api.get(`${url.EMPLOYEES}/${id}`),
  create: (payload) => api.post(url.EMPLOYEES, payload),
  update: (id, payload) => api.patch(`${url.EMPLOYEES}/${id}`, payload),
  delete: (id) => api.delete(`${url.EMPLOYEES}/${id}`),
};

export const UtilityUsagesAPI = {
  list: (params) => api.get(url.UTILITY_USAGES, params),
  get: (id) => api.get(`${url.UTILITY_USAGES}/${id}`),
  create: (payload) => api.post(url.UTILITY_USAGES, payload),
  update: (id, payload) => api.patch(`${url.UTILITY_USAGES}/${id}`, payload),
  delete: (id) => api.delete(`${url.UTILITY_USAGES}/${id}`),
};



// // ================================== END OF  URL ===================================================
