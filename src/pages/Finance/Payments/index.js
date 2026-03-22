import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { FinanceAPI } from "../../../helpers/backend_helper";
import {
  createPayment as onCreatePayment,
  getInvoices as onGetInvoices,
  getLeases as onGetLeases,
  getPayments as onGetPayments,
  getTenants as onGetTenants,
} from "../../../slices/thunks";

const methodOptions = [
  { value: "evc", label: "EVC" },
  { value: "merchant", label: "Merchant" },
  { value: "bank", label: "Bank" },
];

const Payments = () => {
  document.title = "Finance - Payments | Apartment Management";
  const dispatch = useDispatch();

  const financeSelector = createSelector(
    (state) => state.Finance,
    (s) => ({
      payments: s.payments || [],
      paymentPagination: s.paymentPagination || {},
      invoices: s.invoices || [],
      loading: s.loadingPayments,
    }),
  );
  const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const tenantSelector = createSelector((state) => state.Tenants, (s) => s.tenants || []);
  const { payments, paymentPagination, invoices, loading } = useSelector(financeSelector);
  const leases = useSelector(leaseSelector);
  const tenants = useSelector(tenantSelector);

  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(false);

  const fetchPayments = useCallback(() => {
    dispatch(onGetPayments({ params: { page: currentPage, limit: 10 } }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
    dispatch(onGetTenants({ params: { page: 1, limit: 100 } }));
    dispatch(onGetInvoices({ params: { page: 1, limit: 100, status: "pending" } }));
  }, [dispatch]);

  const tenantMap = useMemo(() => {
    const map = new Map();
    tenants.forEach((tenant) => map.set(tenant._id, tenant));
    return map;
  }, [tenants]);

  const leaseOptions = useMemo(
    () =>
      leases.map((lease) => ({
        value: lease._id,
        label: `${lease.leaseNumber} - ${lease.unitId?.unitNumber || "Unit"}`,
      })),
    [leases],
  );

  const tenantOptions = useMemo(
    () =>
      tenants.map((tenant) => ({
        value: tenant._id,
        label: `${tenant.personalInfo?.firstName || ""} ${tenant.personalInfo?.lastName || ""}`.trim(),
      })),
    [tenants],
  );

  const paymentFormik = useFormik({
    initialValues: {
      leaseId: "",
      tenantId: "",
      invoiceId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      method: "evc",
      referenceNumber: "",
      notes: "",
      unitId: "",
      buildingId: "",
    },
    validationSchema: Yup.object({
      leaseId: Yup.string().required("Lease is required"),
      tenantId: Yup.string().required("Tenant is required"),
      amount: Yup.number().min(0.01).required("Amount is required"),
      paymentDate: Yup.string().required("Payment date is required"),
      referenceNumber: Yup.string().required("Reference is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const methodDetails =
        values.method === "evc"
          ? { evc: { referenceNumber: values.referenceNumber } }
          : values.method === "merchant"
            ? { merchant: { referenceNumber: values.referenceNumber } }
            : { bank: { transactionId: values.referenceNumber } };

      try {
        await dispatch(
          onCreatePayment({
            data: {
              tenantId: values.tenantId,
              leaseId: values.leaseId,
              invoiceId: values.invoiceId || undefined,
              amount: Number(values.amount),
              paymentDate: values.paymentDate,
              method: values.method,
              methodDetails,
              notes: values.notes || undefined,
              unitId: values.unitId,
              buildingId: values.buildingId,
            },
          }),
        );
        setModal(false);
        resetForm();
        fetchPayments();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (!paymentFormik.values.leaseId) return true;
      return invoice.leaseId === paymentFormik.values.leaseId;
    });
  }, [invoices, paymentFormik.values.leaseId]);

  useEffect(() => {
    if (!paymentFormik.values.leaseId) return;
    const selectedLease = leases.find((lease) => lease._id === paymentFormik.values.leaseId);
    if (!selectedLease) return;
    const tenantId =
      typeof selectedLease.tenantId === "object"
        ? selectedLease.tenantId?._id
        : selectedLease.tenantId;
    const unitId =
      typeof selectedLease.unitId === "object" ? selectedLease.unitId?._id : selectedLease.unitId;
    const buildingId =
      typeof selectedLease.buildingId === "object"
        ? selectedLease.buildingId?._id
        : selectedLease.buildingId;

    paymentFormik.setFieldValue("tenantId", tenantId || "");
    paymentFormik.setFieldValue("unitId", unitId || "");
    paymentFormik.setFieldValue("buildingId", buildingId || "");
  }, [leases, paymentFormik.values.leaseId]);

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_row, i) => (currentPage - 1) * (paymentPagination?.limit || 10) + i + 1,
    },
    {
      name: "Payment",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.paymentNumber || "-"}</div>
          <small className="text-muted">
            {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : "-"}
          </small>
        </div>
      ),
    },
    {
      name: "Tenant",
      grow: 2,
      cell: (row) => {
        const tenant = tenantMap.get(row.tenantId);
        if (!tenant) return "-";
        return `${tenant.personalInfo?.firstName || ""} ${tenant.personalInfo?.lastName || ""}`.trim();
      },
    },
    {
      name: "Amount",
      cell: (row) => `$${Number(row.amount || 0).toLocaleString()}`,
    },
    {
      name: "Method",
      cell: (row) => <span className="text-uppercase">{row.method || "-"}</span>,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color="info" className="text-capitalize">
          {row.lifecycle?.status || "recorded"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            size="sm"
            color="outline-primary"
            onClick={async () => {
              const res = await FinanceAPI.paymentReceipt(row._id);
              if (res.success && res.data?.downloadUrl) {
                window.open(res.data.downloadUrl, "_blank");
              }
            }}
          >
            Receipt
          </Button>
          <Button
            size="sm"
            color="outline-info"
            onClick={async () => {
              const res = await FinanceAPI.verifyPayment(row._id, { status: "verified", note: "Verified from UI" });
              if (res.success) {
                toast.success("Payment verified.");
                fetchPayments();
              }
            }}
          >
            Verify
          </Button>
          <Button
            size="sm"
            color="outline-success"
            onClick={async () => {
              const res = await FinanceAPI.reconcilePayment(row._id);
              if (res.success) {
                toast.success("Payment reconciled.");
                fetchPayments();
              }
            }}
          >
            Reconcile
          </Button>
          <Button
            size="sm"
            color="outline-danger"
            onClick={async () => {
              const res = await FinanceAPI.reversePayment(row._id, { note: "Reversed from UI" });
              if (res.success) {
                toast.success("Payment reversed.");
                fetchPayments();
              }
            }}
          >
            Reverse
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Payments" pageTitle="Finance" />
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0">Collected Payments</h5>
            <Button color="primary" onClick={() => setModal(true)}>
              Collect Payment
            </Button>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={columns}
              data={payments}
              progressPending={loading}
              pagination
              paginationServer
              paginationTotalRows={paymentPagination?.total || 0}
              paginationPerPage={paymentPagination?.limit || 10}
              paginationDefaultPage={currentPage}
              onChangePage={(p) => setCurrentPage(p)}
              responsive
            />
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} centered size="lg">
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          Collect Payment
        </ModalHeader>
        <Form onSubmit={paymentFormik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Lease *</Label>
                  <Select
                    options={leaseOptions}
                    placeholder="Select active lease"
                    value={leaseOptions.find((x) => x.value === paymentFormik.values.leaseId) || null}
                    onChange={(opt) => paymentFormik.setFieldValue("leaseId", opt?.value || "")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Tenant *</Label>
                  <Select
                    options={tenantOptions}
                    placeholder="Select tenant"
                    value={tenantOptions.find((x) => x.value === paymentFormik.values.tenantId) || null}
                    onChange={(opt) => paymentFormik.setFieldValue("tenantId", opt?.value || "")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Invoice (Optional)</Label>
                  <Input
                    type="select"
                    name="invoiceId"
                    value={paymentFormik.values.invoiceId}
                    onChange={paymentFormik.handleChange}
                  >
                    <option value="">Select invoice</option>
                    {filteredInvoices.map((invoice) => (
                      <option key={invoice._id} value={invoice._id}>
                        {invoice.invoiceNumber}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Amount *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    name="amount"
                    placeholder="Enter amount paid"
                    value={paymentFormik.values.amount}
                    onChange={paymentFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Payment Date *</Label>
                  <Input
                    type="date"
                    name="paymentDate"
                    value={paymentFormik.values.paymentDate}
                    onChange={paymentFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Method *</Label>
                  <Select
                    options={methodOptions}
                    placeholder="Select payment method"
                    value={methodOptions.find((x) => x.value === paymentFormik.values.method) || null}
                    onChange={(opt) => paymentFormik.setFieldValue("method", opt?.value || "evc")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label className="form-label">Reference Number *</Label>
              <Input
                name="referenceNumber"
                placeholder="Enter payment reference number"
                value={paymentFormik.values.referenceNumber}
                onChange={paymentFormik.handleChange}
              />
            </FormGroup>
            <FormGroup className="mb-0">
              <Label className="form-label">Notes</Label>
              <Input
                type="textarea"
                rows="3"
                name="notes"
                placeholder="Add optional notes"
                value={paymentFormik.values.notes}
                onChange={paymentFormik.handleChange}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter className="bg-light">
            <Button color="light" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={paymentFormik.isSubmitting}>
              {paymentFormik.isSubmitting ? "Saving..." : "Save Payment"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default Payments;
