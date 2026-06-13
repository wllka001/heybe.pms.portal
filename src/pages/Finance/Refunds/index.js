import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../../Components/Common/AppDataTable";
import Select from "../../../Components/Common/AppSelect";
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
import {
  FiPlus,
  FiEye,
  FiTrendingUp,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiAlertCircle,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { FinanceAPI } from "../../../helpers/backend_helper";
import { getLeases as onGetLeases } from "../../../slices/thunks";

const today = new Date();

const methodOptions = [
  { value: "evc", label: "EVC", icon: "💳" },
  { value: "merchant", label: "Merchant", icon: "🏪" },
  { value: "bank", label: "Bank Transfer", icon: "🏦" },
  { value: "cash", label: "Cash", icon: "💵" },
];

const getTenantName = (tenant) =>
  `${tenant?.personalInfo?.firstName || ""} ${tenant?.personalInfo?.lastName || ""}`.trim() || "Unknown tenant";

const getLeaseLabel = (lease, tenant) =>
  `${lease?.unitId?.unitNumber || lease?.unitNumber || "Unit"} - ${getTenantName(tenant)}`;

const getAuditLabel = (user) => {
  if (!user) return "-";
  if (typeof user === "string") return user;
  return user.fullName || user.username || user.email || "-";
};

const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
  }),
};

const Refunds = () => {
  document.title = "Finance - Deposit Refunds | Degaanly";
  const dispatch = useDispatch();

  const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const leases = useSelector(leaseSelector);

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailModal, setDetailModal] = useState(false);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FinanceAPI.listRefunds({ page: 1, limit: 100 });
      if (res.success) {
        setRefunds(res.data?.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch refunds list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
  }, [dispatch, fetchRefunds]);

  const leaseMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => map.set(lease._id, lease));
    return map;
  }, [leases]);

  const leaseOptions = useMemo(() => {
    return leases
      .filter((lease) => lease.terms?.depositPaid === true)
      .map((lease) => ({
        value: lease._id,
        label: getLeaseLabel(lease, lease?.tenantId),
      }));
  }, [leases]);

  const refundFormik = useFormik({
    initialValues: {
      leaseId: "",
      tenantId: "",
      amount: "",
      refundDate: new Date().toISOString().split("T")[0],
      method: "evc",
      notes: "",
    },
    validationSchema: Yup.object({
      leaseId: Yup.string().required("Lease is required"),
      amount: Yup.number().min(0.01, "Amount must be greater than 0").required("Amount is required"),
      refundDate: Yup.string().required("Refund date is required"),
      method: Yup.string().required("Method is required"),
      notes: Yup.string().optional(),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const res = await FinanceAPI.createRefund({
          tenantId: values.tenantId,
          leaseId: values.leaseId,
          amount: Number(values.amount),
          refundDate: values.refundDate,
          method: values.method,
          notes: values.notes || undefined,
        });

        if (res.success) {
          toast.success("Deposit refund logged successfully.");
          setRefundModal(false);
          resetForm();
          fetchRefunds();
          dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to log deposit refund.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const selectedLease = leaseMap.get(refundFormik.values.leaseId);
    if (!selectedLease) return;
    refundFormik.setFieldValue(
      "tenantId",
      typeof selectedLease.tenantId === "object" ? selectedLease.tenantId?._id : selectedLease.tenantId,
    );
    refundFormik.setFieldValue("amount", String(selectedLease.terms?.securityDeposit || ""));
  }, [leaseMap, refundFormik.values.leaseId]);

  const openCreateModal = () => {
    refundFormik.resetForm();
    setRefundModal(true);
  };

  const openDetails = (refund) => {
    setSelectedRefund(refund);
    setDetailModal(true);
  };

  const stats = useMemo(() => {
    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    return { totalRefunds, totalAmount };
  }, [refunds]);

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
      width: "60px",
    },
    {
      name: "Refund Date",
      cell: (row) => (
        <div className="d-flex align-items-center gap-2">
          <FiCalendar className="text-muted" size={14} />
          <span>{formatDate(row.refundDate)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Tenant",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{getTenantName(row.tenantId)}</div>
          <small className="text-muted">{row.tenantId?.contact?.primaryPhone || "-"}</small>
        </div>
      ),
      grow: 1.5,
    },
    {
      name: "Lease/Unit",
      cell: (row) => (
        <div>
          <div className="fw-semibold">Lease: {row.leaseId?.leaseNumber || "-"}</div>
          <small className="text-muted">Unit: {row.leaseId?.unitId?.unitNumber || "-"}</small>
        </div>
      ),
    },
    {
      name: "Amount",
      cell: (row) => <div className="fw-bold text-danger">{formatCurrency(row.amount)}</div>,
      sortable: true,
    },
    {
      name: "Method",
      cell: (row) => <Badge color="light" className="text-capitalize text-dark px-3 py-2">{row.method}</Badge>,
    },
    {
      name: "Recorded By",
      cell: (row) => <small>{getAuditLabel(row.recordedBy)}</small>,
    },
    {
      name: "Actions",
      cell: (row) => (
        <Button color="light" size="sm" onClick={() => openDetails(row)}>
          <FiEye className="me-1" /> View
        </Button>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Deposit Refunds" pageTitle="Finance" />

        {/* Header Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className="bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                    <FiDollarSign size={24} className="text-danger" />
                  </div>
                  <div>
                    <h4 className="mb-1">Deposit Refund Management</h4>
                    <p className="text-muted mb-0">Record and monitor refunded deposits for tenants</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <Button color="danger" onClick={openCreateModal} className="w-100 py-2">
                  <FiPlus className="me-2" size={18} />
                  Record Deposit Refund
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Stats */}
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <h3 className="mb-1 fw-bold">{stats.totalRefunds}</h3>
                  <p className="text-muted mb-0 small">Total Refunds Issued</p>
                </div>
                <div className="bg-danger bg-opacity-10 rounded-3 p-3">
                  <FiCreditCard size={24} className="text-danger" />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4 d-flex align-items-center justify-content-between">
                <div>
                  <h3 className="mb-1 fw-bold">{formatCurrency(stats.totalAmount)}</h3>
                  <p className="text-muted mb-0 small">Total Amount Refunded</p>
                </div>
                <div className="bg-success bg-opacity-10 rounded-3 p-3">
                  <FiTrendingUp size={24} className="text-success" />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* List Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-white border-0 pt-4 px-4">
            <h5 className="card-title mb-0">Refund Logs</h5>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={refunds}
              progressPending={loading}
              pagination
              paginationPerPage={10}
              responsive
              highlightOnHover
              pointerOnHover
              className="border-0"
              customStyles={{
                headRow: {
                  style: {
                    backgroundColor: '#f8f9fa',
                    borderTop: 'none',
                    fontWeight: 600,
                  },
                },
                rows: {
                  style: {
                    minHeight: '64px',
                  },
                },
              }}
            />
          </CardBody>
        </Card>
      </Container>

      {/* Record Modal */}
      <Modal isOpen={refundModal} toggle={() => setRefundModal(false)} centered size="lg">
        <ModalHeader toggle={() => setRefundModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Record Deposit Refund</h5>
            <small className="text-muted">Issue and log a security deposit refund for an active lease</small>
          </div>
        </ModalHeader>
        <Form onSubmit={refundFormik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-4">
              <Col md={12}>
                <Label className="form-label text-muted small mb-1">Active Lease *</Label>
                <Select
                  options={leaseOptions}
                  placeholder="Select active lease..."
                  value={leaseOptions.find((option) => option.value === refundFormik.values.leaseId) || null}
                  onChange={(option) => refundFormik.setFieldValue("leaseId", option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
                {refundFormik.errors.leaseId && refundFormik.touched.leaseId && (
                  <small className="text-danger d-block mt-1">{refundFormik.errors.leaseId}</small>
                )}
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Refund Amount *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={refundFormik.values.amount}
                  onChange={(e) => refundFormik.setFieldValue("amount", e.target.value)}
                  className="form-control"
                  placeholder="0.00"
                />
                {refundFormik.errors.amount && refundFormik.touched.amount && (
                  <small className="text-danger d-block mt-1">{refundFormik.errors.amount}</small>
                )}
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Refund Date *</Label>
                <Input
                  type="date"
                  value={refundFormik.values.refundDate}
                  onChange={(e) => refundFormik.setFieldValue("refundDate", e.target.value)}
                  className="form-control"
                />
                {refundFormik.errors.refundDate && refundFormik.touched.refundDate && (
                  <small className="text-danger d-block mt-1">{refundFormik.errors.refundDate}</small>
                )}
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Refund Method *</Label>
                <Select
                  options={methodOptions}
                  value={methodOptions.find((option) => option.value === refundFormik.values.method) || null}
                  onChange={(option) => refundFormik.setFieldValue("method", option?.value || "evc")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>

              <Col md={12}>
                <Label className="form-label text-muted small mb-1">Notes</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={refundFormik.values.notes}
                  onChange={(e) => refundFormik.setFieldValue("notes", e.target.value)}
                  className="form-control"
                  placeholder="Provide any additional details or reasoning..."
                />
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light border-0">
            <Button color="light" onClick={() => setRefundModal(false)}>
              <FiXCircle className="me-1" size={16} /> Cancel
            </Button>
            <Button color="danger" type="submit" disabled={refundFormik.isSubmitting}>
              {refundFormik.isSubmitting ? "Processing..." : (
                <>
                  <FiCheckCircle className="me-1" size={16} />
                  Record Refund
                </>
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} centered size="md">
        <ModalHeader toggle={() => setDetailModal(false)} className="bg-light border-0">
          <h5>Deposit Refund Log Details</h5>
        </ModalHeader>
        <ModalBody className="p-4">
          {selectedRefund && (
            <Row className="g-3">
              <Col xs={12} className="border-bottom pb-2">
                <div className="text-muted small">Tenant</div>
                <div className="fw-semibold fs-5">{getTenantName(selectedRefund.tenantId)}</div>
                <div className="text-muted small">Code: {selectedRefund.tenantId?.tenantCode || "-"}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted small">Lease Number</div>
                <div className="fw-semibold">{selectedRefund.leaseId?.leaseNumber || "-"}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted small">Unit Number</div>
                <div className="fw-semibold">Unit {selectedRefund.leaseId?.unitId?.unitNumber || "-"}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted small">Amount Refunded</div>
                <div className="fw-bold text-danger fs-5">{formatCurrency(selectedRefund.amount)}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted small">Refund Date</div>
                <div className="fw-semibold">{formatDate(selectedRefund.refundDate)}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted small">Payment Method</div>
                <div className="fw-semibold text-capitalize">{selectedRefund.method || "-"}</div>
              </Col>
              <Col xs={6}>
                <div className="text-muted small">Recorded By</div>
                <div className="fw-semibold">{getAuditLabel(selectedRefund.recordedBy)}</div>
              </Col>
              <Col xs={12} className="border-top pt-2">
                <div className="text-muted small">Notes / Reason</div>
                <div>{selectedRefund.notes || "No notes provided."}</div>
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <Button color="light" onClick={() => setDetailModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Refunds;
