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
  FiPrinter,
  FiEdit2,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiHash,
  FiAlertCircle,
  FiRotateCcw,
  FiThumbsUp,
  FiThumbsDown,
} from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import ActionIconButton from "../../../Components/Common/ActionIconButton";
import { FinanceAPI } from "../../../helpers/backend_helper";
import { getLeases as onGetLeases, getPayments as onGetPayments, getOrganization as onGetOrganization } from "../../../slices/thunks";
import useAuthUser from "../../../Components/Hooks/useAuthUser";
import { downloadReceiptPdf } from "../../../utils/financeDocuments";

const today = new Date();
const monthOptions = [
  { value: "", label: "All" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
  })),
];
const yearOptions = [
  { value: "", label: "Select Year" },
  ...Array.from({ length: 7 }, (_, i) => {
    const value = String(today.getFullYear() - 2 + i);
    return { value, label: value };
  }),
];
const paymentStatusOptions = [
  { value: "", label: "All" },
  { value: "recorded", label: "Recorded" },
  { value: "verified", label: "Verified" },
  { value: "reconciled", label: "Reconciled" },
  { value: "rejected", label: "Rejected" },
  { value: "reversed", label: "Reversed" },
];

const methodOptions = [
  { value: "evc", label: "EVC", icon: "💳" },
  { value: "merchant", label: "Merchant", icon: "🏪" },
  { value: "bank", label: "Bank Transfer", icon: "🏦" },
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

const getReferenceNumber = (payment) =>
  payment?.method === "evc"
    ? payment?.methodDetails?.evc?.referenceNumber || ""
    : payment?.method === "merchant"
      ? payment?.methodDetails?.merchant?.referenceNumber || ""
      : payment?.methodDetails?.bank?.transactionId || "";

const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString()}`;
const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
  }),
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
  <Card className="border-0 shadow-sm h-100">
    <CardBody className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
          <Icon size={24} className={`text-${color}`} />
        </div>
        <Badge color="light" className="px-3 py-2 text-primary">
          {subtitle}
        </Badge>
      </div>
      <h3 className="mb-1 fw-bold">{value}</h3>
      <p className="text-muted mb-0 small">{title}</p>
    </CardBody>
  </Card>
);

// Detail Card Component
const DetailCard = ({ title, children, icon: Icon }) => (
  <div className="border rounded-3 p-4 bg-white h-100">
    <div className="d-flex align-items-center mb-3">
      <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
        <Icon size={16} className="text-primary" />
      </div>
      <h6 className="mb-0 fw-semibold">{title}</h6>
    </div>
    {children}
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    recorded: { color: "info", icon: FiRefreshCw, label: "Recorded" },
    verified: { color: "primary", icon: FiCheckCircle, label: "Verified" },
    reconciled: { color: "success", icon: FiThumbsUp, label: "Reconciled" },
    rejected: { color: "danger", icon: FiThumbsDown, label: "Rejected" },
    reversed: { color: "warning", icon: FiRotateCcw, label: "Reversed" },
    mixed: { color: "dark", icon: FiFileText, label: "Mixed" },
  };
  const config = statusConfig[status] || statusConfig.recorded;
  const Icon = config.icon;
  return (
    <Badge color={config.color} className="d-inline-flex align-items-center gap-1 px-3 py-2">
      <Icon size={12} />
      <span className="ms-1">{config.label}</span>
    </Badge>
  );
};

const Payments = () => {
  document.title = "Finance - Payments | Degaanly";
  const dispatch = useDispatch();

  const financeSelector = createSelector(
    (state) => state.Finance,
    (s) => ({
      payments: s.payments || [],
      paymentPagination: s.paymentPagination || {},
      loading: s.loadingPayments,
    }),
  );
  const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const { payments, paymentPagination, loading } = useSelector(financeSelector);
  const leases = useSelector(leaseSelector);

  const userAuth = useAuthUser();
  const businessId = userAuth.businessId;

  const selectOrganizationData = createSelector(
    (state) => state.Organization,
    (organizationData) => organizationData.organizationData
  );
  const organization = useSelector(selectOrganizationData);

  useEffect(() => {
    if (businessId) {
      dispatch(onGetOrganization(businessId));
    }
  }, [dispatch, businessId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [paymentModal, setPaymentModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPaymentGroup, setSelectedPaymentGroup] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ action: "", payment: null });
  const [confirmReason, setConfirmReason] = useState("");
  const [openInvoices, setOpenInvoices] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const fetchPayments = useCallback(() => {
    const params = { page: 1, limit: 200 };
    if (filterMonth) params.month = Number(filterMonth);
    if (filterYear) params.year = Number(filterYear);
    if (filterStatus) params.status = filterStatus;
    if (debouncedSearchText) params.search = debouncedSearchText;

    dispatch(onGetPayments({ params }));
  }, [debouncedSearchText, dispatch, filterMonth, filterStatus, filterYear]);

  const fetchOpenInvoices = useCallback(async () => {
    const res = await FinanceAPI.listInvoices({ page: 1, limit: 200 });
    if (res.success) {
      setOpenInvoices((res.data?.data || []).filter((invoice) => Number(invoice.balance || 0) > 0));
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, filterMonth, filterStatus, filterYear]);

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
    fetchOpenInvoices();
  }, [dispatch, fetchOpenInvoices]);

  const leaseMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => map.set(lease._id, lease));
    return map;
  }, [leases]);

  const invoiceMap = useMemo(() => {
    const map = new Map();
    openInvoices.forEach((invoice) => map.set(invoice._id, invoice));
    return map;
  }, [openInvoices]);

  const leaseOptions = useMemo(() => {
    const leaseIdsWithOpenInvoices = new Set(openInvoices.map((invoice) => invoice.leaseId));
    return leases
      .filter((lease) => leaseIdsWithOpenInvoices.has(lease._id))
      .map((lease) => ({
        value: lease._id,
        label: getLeaseLabel(lease, lease?.tenantId),
      }));
  }, [leases, openInvoices]);

  const allLeaseOptions = useMemo(() => {
    return leases
      .filter((lease) => lease.terms?.depositPaid !== true)
      .map((lease) => ({
        value: lease._id,
        label: getLeaseLabel(lease, lease?.tenantId),
      }));
  }, [leases]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingVerification = payments.filter(p => p.lifecycle?.status === "recorded").length;
    const reconciled = payments.filter(p => p.lifecycle?.status === "reconciled").length;
    return { totalPayments, totalAmount, pendingVerification, reconciled };
  }, [payments]);

  const paymentFormik = useFormik({
    initialValues: {
      paymentType: "invoice",
      leaseId: "",
      invoiceId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      method: "evc",
      referenceNumber: "",
      notes: "",
      unitId: "",
      buildingId: "",
      tenantId: "",
    },
    validationSchema: Yup.object({
      paymentType: Yup.string().required("Payment type is required"),
      leaseId: Yup.string().required("Lease is required"),
      invoiceId: Yup.string().when("paymentType", {
        is: "invoice",
        then: (schema) => schema.required("Invoice is required"),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
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
        const action = editMode && selectedPayment ? "update" : "create";
        const payload = {
          tenantId: values.tenantId,
          leaseId: values.leaseId,
          amount: Number(values.amount),
          paymentDate: values.paymentDate,
          method: values.method,
          methodDetails,
          notes: values.notes || undefined,
          unitId: values.unitId,
          buildingId: values.buildingId,
        };

        if (values.paymentType === "deposit") {
          payload.allocation = [{ itemType: "deposit", amount: Number(values.amount) }];
        } else if (values.paymentType === "beginning_balance") {
          payload.allocation = [{ itemType: "beginning_balance", amount: Number(values.amount) }];
        } else {
          payload.invoiceId = values.invoiceId;
        }

        const res =
          action === "update"
            ? await FinanceAPI.updatePayment(selectedPayment._id, {
              amount: Number(values.amount),
              paymentDate: values.paymentDate,
              method: values.method,
              methodDetails,
              notes: values.notes || undefined,
            })
            : await FinanceAPI.createPayment(payload);

        if (res.success) {
          toast.success(action === "update" ? "Payment updated successfully." : "Payment recorded successfully.");
          setPaymentModal(false);
          setEditMode(false);
          setSelectedPayment(null);
          resetForm();
          fetchPayments();
          fetchOpenInvoices();
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const beginningBalanceLeaseOptions = useMemo(() => {
    return leases
      .filter((lease) => (lease.tenantId?.beginningBalance || 0) > 0)
      .map((lease) => ({
        value: lease._id,
        label: getLeaseLabel(lease, lease?.tenantId),
      }));
  }, [leases]);

  const leaseOptionsToUse =
    paymentFormik.values.paymentType === "beginning_balance"
      ? beginningBalanceLeaseOptions
      : paymentFormik.values.paymentType === "deposit"
        ? allLeaseOptions
        : leaseOptions;

  const filteredInvoices = useMemo(
    () => openInvoices.filter((invoice) => invoice.leaseId === paymentFormik.values.leaseId),
    [openInvoices, paymentFormik.values.leaseId],
  );

  const filteredInvoiceOptions = useMemo(
    () =>
      filteredInvoices.map((invoice) => ({
        value: invoice._id,
        label: `${invoice.invoiceNumber} - ${formatCurrency(invoice.balance)}`,
      })),
    [filteredInvoices],
  );

  const groupedPayments = useMemo(() => {
    const groups = new Map();

    payments.forEach((payment) => {
      const invoiceKey = payment?.invoiceId?._id || payment?.invoiceId || payment?._id;
      const existing = groups.get(invoiceKey) || {
        _id: String(invoiceKey),
        invoiceId: payment.invoiceId,
        tenantId: payment.tenantId,
        leaseId: payment.leaseId,
        unitId: payment.unitId,
        buildingId: payment.buildingId,
        payments: [],
      };

      existing.payments.push(payment);
      groups.set(invoiceKey, existing);
    });

    return Array.from(groups.values())
      .map((group) => {
        const paymentLayers = [...group.payments].sort((a, b) => {
          const aDate = new Date(a.paymentDate || a.createdAt || 0).getTime();
          const bDate = new Date(b.paymentDate || b.createdAt || 0).getTime();
          return bDate - aDate;
        });
        const latestPayment = paymentLayers[0];
        const statuses = [...new Set(paymentLayers.map((payment) => payment.lifecycle?.status || "recorded"))];

        return {
          ...group,
          payments: paymentLayers,
          latestPayment,
          paymentCount: paymentLayers.length,
          totalAmount: paymentLayers.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
          latestPaymentDate: latestPayment?.paymentDate || latestPayment?.createdAt,
          aggregateStatus: statuses.length === 1 ? statuses[0] : "mixed",
        };
      })
      .sort((a, b) => {
        const aDate = new Date(a.latestPaymentDate || 0).getTime();
        const bDate = new Date(b.latestPaymentDate || 0).getTime();
        return bDate - aDate;
      });
  }, [payments]);

  useEffect(() => {
    const selectedLease = leaseMap.get(paymentFormik.values.leaseId);
    if (!selectedLease) return;
    paymentFormik.setFieldValue(
      "tenantId",
      typeof selectedLease.tenantId === "object" ? selectedLease.tenantId?._id : selectedLease.tenantId,
    );
    paymentFormik.setFieldValue(
      "unitId",
      typeof selectedLease.unitId === "object" ? selectedLease.unitId?._id : selectedLease.unitId,
    );
    paymentFormik.setFieldValue(
      "buildingId",
      typeof selectedLease.buildingId === "object" ? selectedLease.buildingId?._id : selectedLease.buildingId,
    );
    if (paymentFormik.values.paymentType === "deposit") {
      paymentFormik.setFieldValue("amount", String(selectedLease.terms?.securityDeposit || ""));
    } else if (paymentFormik.values.paymentType === "beginning_balance") {
      paymentFormik.setFieldValue("amount", String(selectedLease.tenantId?.beginningBalance || ""));
    }
  }, [leaseMap, paymentFormik.values.leaseId, paymentFormik.values.paymentType]);

  useEffect(() => {
    const invoice = invoiceMap.get(paymentFormik.values.invoiceId);
    if (invoice && !editMode) {
      paymentFormik.setFieldValue("amount", String(invoice.balance || ""));
    }
  }, [editMode, invoiceMap, paymentFormik.values.invoiceId]);

  const openCreateModal = () => {
    setEditMode(false);
    setSelectedPayment(null);
    paymentFormik.resetForm();
    paymentFormik.setFieldValue("paymentType", "invoice");
    setPaymentModal(true);
  };

  const openEditModal = async (payment) => {
    const res = await FinanceAPI.getPayment(payment._id);
    if (!res.success) return;
    const data = res.data;
    setSelectedPayment(data);
    setEditMode(true);
    paymentFormik.setValues({
      paymentType: data.allocation?.some(a => a.itemType === 'deposit') ? "deposit" : "invoice",
      leaseId: typeof data.leaseId === "object" ? data.leaseId?._id : data.leaseId || "",
      invoiceId: typeof data.invoiceId === "object" ? data.invoiceId?._id : data.invoiceId || "",
      amount: String(data.amount || ""),
      paymentDate: data.paymentDate?.split?.("T")?.[0] || new Date().toISOString().split("T")[0],
      method: data.method || "evc",
      referenceNumber: getReferenceNumber(data),
      notes: data.notes || "",
      unitId: typeof data.unitId === "object" ? data.unitId?._id : data.unitId || "",
      buildingId: typeof data.buildingId === "object" ? data.buildingId?._id : data.buildingId || "",
      tenantId: typeof data.tenantId === "object" ? data.tenantId?._id : data.tenantId || "",
    });
    setPaymentModal(true);
  };

  const openDetails = (group) => {
    setSelectedPaymentGroup(group);
    setDetailModal(true);
  };

  const openConfirm = (action, payment) => {
    setConfirmState({ action, payment });
    setConfirmReason("");
    setConfirmModal(true);
  };

  const runConfirmedAction = async () => {
    const { action, payment } = confirmState;
    if (!payment) return;
    if (action === "reject" && !confirmReason.trim()) {
      toast.error("Reject reason is required.");
      return;
    }

    let res;
    if (action === "reject") res = await FinanceAPI.rejectPayment(payment._id, { note: confirmReason.trim() });
    if (action === "reverse") res = await FinanceAPI.reversePayment(payment._id, { note: "Reversed from payments page" });
    if (action === "verify") res = await FinanceAPI.verifyPayment(payment._id, { status: "verified", note: "Verified from payments page" });
    if (action === "reconcile") res = await FinanceAPI.reconcilePayment(payment._id);

    if (res?.success) {
      toast.success(`Payment ${action}ed successfully.`);
      setConfirmModal(false);
      setDetailModal(false);
      fetchPayments();
      fetchOpenInvoices();
    }
  };

  const printReceipt = async (payment) => {
    const leaseId = payment.leaseId?._id || payment.leaseId;
    const lease = leaseMap.get(leaseId);
    const tenant = payment.tenantId || lease?.tenantId;

    await downloadReceiptPdf({
      payment,
      lease,
      tenant,
      organization,
    });
  };

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
    },
    {
      name: "Payment Details",
      grow: 1.8,
      cell: (row) => (
        <div>
          <div className="fw-semibold mb-1">{row.paymentCount > 1 ? `${row.paymentCount} payments` : row.latestPayment?.paymentNumber}</div>
          <div className="d-flex align-items-center gap-2">
            <FiCalendar size={12} className="text-muted" />
            <small className="text-muted">{formatDate(row.latestPaymentDate)}</small>
          </div>
        </div>
      ),
    },
    {
      name: "Tenant",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{getTenantName(row.tenantId)}</div>
          <small className="text-muted">{row.tenantId?.contact?.primaryPhone || "-"}</small>
        </div>
      ),
    },
    {
      name: "Invoice",
      grow: 1.8,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.invoiceId?.invoiceNumber || "-"}</div>
          <small className="text-muted">
            Rent: {formatCurrency(row.invoiceId?.items?.rent?.amount || 0)} | Utilities: {formatCurrency(row.invoiceId?.summary?.utilitiesSubtotal || 0)}
          </small>
        </div>
      ),
    },
    {
      name: "Amount",
      cell: (row) => (
        <div>
          <div className="fw-bold text-success">{formatCurrency(row.totalAmount || 0)}</div>
          <small className="text-muted">
            {row.paymentCount > 1 ? `${row.paymentCount} layers` : "Single payment"}
          </small>
        </div>
      ),
    },
    {
      name: "Status",
      cell: (row) => <StatusBadge status={row.aggregateStatus} />,
    },
    {
      name: "Actions",
      width: "140px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <ActionIconButton
            onClick={() => openDetails(row)}
            id={`view-${row._id}`}
            icon={<FiEye size={16} />}
            tooltip="View Details"
          />
          <ActionIconButton
            onClick={() => printReceipt(row.latestPayment)}
            disabled={row.paymentCount > 1}
            id={`print-${row._id}`}
            icon={<FiPrinter size={16} />}
            tooltip={row.paymentCount > 1 ? "Open view to print a specific payment layer" : "Print Receipt"}
          />
          <ActionIconButton
            onClick={() => openEditModal(row.latestPayment)}
            disabled={row.paymentCount > 1 || !["recorded", "verified"].includes(row.latestPayment?.lifecycle?.status)}
            id={`edit-${row._id}`}
            icon={<FiEdit2 size={16} />}
            tooltip={row.paymentCount > 1 ? "Open view to edit a specific payment layer" : "Edit Payment"}
          />
        </div>
      ),
    },
  ];

  const selectedLease = leaseMap.get(paymentFormik.values.leaseId);
  const selectedInvoice = invoiceMap.get(paymentFormik.values.invoiceId);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Payments" pageTitle="Finance" />

        {/* Header Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <FiCreditCard size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1">Payment Management</h4>
                    <p className="text-muted mb-0">Record, verify and manage tenant payments</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <Button color="primary" onClick={openCreateModal} className="w-100 py-2">
                  <FiPlus className="me-2" size={18} />
                  Record Payment
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiCreditCard}
              title="Total Payments"
              value={stats.totalPayments}
              color="primary"
              subtitle="All time"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiDollarSign}
              title="Total Amount"
              value={formatCurrency(stats.totalAmount)}
              color="success"
              subtitle="Collected"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiRefreshCw}
              title="Pending Verification"
              value={stats.pendingVerification}
              color="warning"
              subtitle="Need review"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiCheckCircle}
              title="Reconciled"
              value={stats.reconciled}
              color="info"
              subtitle="Completed"
            />
          </Col>
        </Row>

        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Filter Payments</h5>

            </div>
            <Row className="g-3">
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Search</Label>
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tenant, payment #, invoice #, phone..."
                />
              </Col>
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Year</Label>
                <Select
                  options={yearOptions}
                  value={yearOptions.find((option) => option.value === filterYear) || yearOptions[0]}
                  onChange={(option) => setFilterYear(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Month</Label>
                <Select
                  options={monthOptions}
                  value={monthOptions.find((option) => option.value === filterMonth) || monthOptions[0]}
                  onChange={(option) => setFilterMonth(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>

              <Col lg={2} md={6}>
                <Label className="form-label text-muted small mb-1">Status</Label>
                <Select
                  options={paymentStatusOptions}
                  value={paymentStatusOptions.find((option) => option.value === filterStatus) || paymentStatusOptions[0]}
                  onChange={(option) => setFilterStatus(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={1} md={6}>
                <Button
                  color="light mt-4"
                  onClick={() => {
                    setFilterMonth("");
                    setFilterYear("");
                    setFilterStatus("");
                    setSearchText("");
                  }}
                >
                  <FiRefreshCw className="me-1" size={14} />
                  Reset
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Data Table Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-white border-0 pt-4 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Payment History</h5>
              <Badge color="light" className="px-3 py-2 text-primary">
                Total: {groupedPayments.length} invoices / {payments.length} payments
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={groupedPayments}
              progressPending={loading}
              pagination
              paginationPerPage={10}
              paginationDefaultPage={currentPage}
              onChangePage={(page) => setCurrentPage(page)}
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
                    minHeight: '72px',
                  },
                },
              }}
            />
          </CardBody>
        </Card>
      </Container>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} toggle={() => setPaymentModal(false)} centered size="lg" className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setPaymentModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">{editMode ? "Edit Payment" : "Record Payment"}</h5>
            <small className="text-muted">
              {editMode ? "Update payment details" : "Add a new payment record"}
            </small>
          </div>
        </ModalHeader>
        <Form onSubmit={paymentFormik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-4">
              <Col md={12}>
                <Label className="form-label text-muted small mb-1">Payment Type *</Label>
                <div className="d-flex gap-4 flex-wrap">
                  <FormGroup check>
                    <Input
                      type="radio"
                      name="paymentType"
                      id="paymentTypeInvoice"
                      value="invoice"
                      checked={paymentFormik.values.paymentType === "invoice"}
                      onChange={() => {
                        paymentFormik.setFieldValue("paymentType", "invoice");
                        paymentFormik.setFieldValue("invoiceId", "");
                      }}
                      disabled={editMode}
                    />
                    <Label check for="paymentTypeInvoice" style={{ fontWeight: 500 }}>
                      Invoice Payment
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Input
                      type="radio"
                      name="paymentType"
                      id="paymentTypeDeposit"
                      value="deposit"
                      checked={paymentFormik.values.paymentType === "deposit"}
                      onChange={() => {
                        paymentFormik.setFieldValue("paymentType", "deposit");
                        paymentFormik.setFieldValue("invoiceId", "");
                        const selectedLease = leaseMap.get(paymentFormik.values.leaseId);
                        if (selectedLease) {
                          paymentFormik.setFieldValue("amount", String(selectedLease.terms?.securityDeposit || ""));
                        }
                      }}
                      disabled={editMode}
                    />
                    <Label check for="paymentTypeDeposit" style={{ fontWeight: 500 }}>
                      Security Deposit
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Input
                      type="radio"
                      name="paymentType"
                      id="paymentTypeBeginningBalance"
                      value="beginning_balance"
                      checked={paymentFormik.values.paymentType === "beginning_balance"}
                      onChange={() => {
                        paymentFormik.setFieldValue("paymentType", "beginning_balance");
                        paymentFormik.setFieldValue("invoiceId", "");
                        const selectedLease = leaseMap.get(paymentFormik.values.leaseId);
                        if (selectedLease && selectedLease.tenantId) {
                          paymentFormik.setFieldValue("amount", String(selectedLease.tenantId.beginningBalance || ""));
                        }
                      }}
                      disabled={editMode}
                    />
                    <Label check for="paymentTypeBeginningBalance" style={{ fontWeight: 500 }}>
                      Beginning Balance
                    </Label>
                  </FormGroup>
                </div>
              </Col>

              <Col md={12}>
                <Label className="form-label text-muted small mb-1">Lease *</Label>
                <Select
                  options={leaseOptionsToUse}
                  placeholder="Select lease..."
                  value={leaseOptionsToUse.find((option) => option.value === paymentFormik.values.leaseId) || null}
                  onChange={(option) => {
                    paymentFormik.setFieldValue("leaseId", option?.value || "");
                    if (!editMode) paymentFormik.setFieldValue("invoiceId", "");
                  }}
                  classNamePrefix="select"
                  isDisabled={editMode}
                  styles={selectStyles}
                />
                {paymentFormik.errors.leaseId && paymentFormik.touched.leaseId && (
                  <small className="text-danger">{paymentFormik.errors.leaseId}</small>
                )}
              </Col>

              {paymentFormik.values.paymentType === "invoice" && (
                <Col md={12}>
                  <Label className="form-label text-muted small mb-1">Invoice *</Label>
                  <Select
                    options={filteredInvoiceOptions}
                    placeholder="Select invoice..."
                    value={filteredInvoiceOptions.find((option) => option.value === paymentFormik.values.invoiceId) || null}
                    onChange={(option) => paymentFormik.setFieldValue("invoiceId", option?.value || "")}
                    isDisabled={editMode}
                    classNamePrefix="select"
                    styles={selectStyles}
                  />
                  {paymentFormik.errors.invoiceId && paymentFormik.touched.invoiceId && (
                    <small className="text-danger">{paymentFormik.errors.invoiceId}</small>
                  )}
                </Col>
              )}

              {selectedLease && (
                <Col md={12}>
                  <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-25 rounded-circle p-2 me-3">
                        <FiUser size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="fw-semibold">{getLeaseLabel(selectedLease, selectedLease?.tenantId)}</div>
                        <small className="text-muted">
                          {paymentFormik.values.paymentType === "deposit" ? (
                            <>Security Deposit: {formatCurrency(selectedLease.terms?.securityDeposit || 0)}</>
                          ) : paymentFormik.values.paymentType === "beginning_balance" ? (
                            <>Beginning Balance: {formatCurrency(selectedLease?.tenantId?.beginningBalance || 0)}</>
                          ) : selectedInvoice ? (
                            <>Invoice: {selectedInvoice.invoiceNumber} | Balance: {formatCurrency(selectedInvoice.balance)}</>
                          ) : (
                            <>Select an invoice to see details</>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Amount *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentFormik.values.amount}
                  onChange={(e) => paymentFormik.setFieldValue("amount", e.target.value)}
                  className="form-control"
                  placeholder="Enter amount"
                />
                {paymentFormik.errors.amount && paymentFormik.touched.amount && (
                  <small className="text-danger">{paymentFormik.errors.amount}</small>
                )}
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentFormik.values.paymentDate}
                  onChange={(e) => paymentFormik.setFieldValue("paymentDate", e.target.value)}
                  className="form-control"
                />
                {paymentFormik.errors.paymentDate && paymentFormik.touched.paymentDate && (
                  <small className="text-danger">{paymentFormik.errors.paymentDate}</small>
                )}
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Method *</Label>
                <Select
                  options={methodOptions}
                  value={methodOptions.find((option) => option.value === paymentFormik.values.method) || null}
                  onChange={(option) => paymentFormik.setFieldValue("method", option?.value || "evc")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Reference Number *</Label>
                <Input
                  value={paymentFormik.values.referenceNumber}
                  onChange={(e) => paymentFormik.setFieldValue("referenceNumber", e.target.value)}
                  className="form-control"
                  placeholder="Enter reference number"
                />
                {paymentFormik.errors.referenceNumber && paymentFormik.touched.referenceNumber && (
                  <small className="text-danger">{paymentFormik.errors.referenceNumber}</small>
                )}
              </Col>

              <Col md={12}>
                <Label className="form-label text-muted small mb-1">Notes</Label>
                <Input
                  type="textarea"
                  rows="3"
                  value={paymentFormik.values.notes}
                  onChange={(e) => paymentFormik.setFieldValue("notes", e.target.value)}
                  className="form-control"
                  placeholder="Additional notes (optional)"
                />
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light border-0">
            <Button color="light" onClick={() => setPaymentModal(false)}>
              <FiXCircle className="me-1" size={16} /> Cancel
            </Button>
            <Button color="primary" type="submit" disabled={paymentFormik.isSubmitting}>
              {paymentFormik.isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <FiCheckCircle className="me-1" size={16} />
                  {editMode ? "Update Payment" : "Save Payment"}
                </>
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Payment Details Modal */}
      <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} centered size="xl" className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setDetailModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Payment Details</h5>
            <small className="text-muted">{selectedPaymentGroup?.invoiceId?.invoiceNumber || "-"}</small>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          <Row className="g-4">
            <Col md={6}>
              <DetailCard title="Tenant Information" icon={FiUser}>
                <div className="fw-semibold mb-1">{getTenantName(selectedPaymentGroup?.tenantId)}</div>
                <div className="text-muted small">{selectedPaymentGroup?.tenantId?.contact?.primaryPhone || "-"}</div>
                <div className="text-muted small">{selectedPaymentGroup?.tenantId?.contact?.email || "-"}</div>
              </DetailCard>
            </Col>
            <Col md={6}>
              <DetailCard title="Lease & Unit" icon={FiHome}>
                <div className="fw-semibold mb-1">Unit {selectedPaymentGroup?.unitId?.unitNumber || "-"}</div>
                <div className="text-muted small">Lease: {selectedPaymentGroup?.leaseId?.leaseNumber || "-"}</div>
                <div className="text-muted small">Building: {selectedPaymentGroup?.buildingId?.name || "-"}</div>
              </DetailCard>
            </Col>
            <Col md={4}>
              <DetailCard title="Collected Amount" icon={FiDollarSign}>
                <div className="fs-3 fw-bold text-success">{formatCurrency(selectedPaymentGroup?.totalAmount || 0)}</div>
                <div className="text-muted small">Layers: {selectedPaymentGroup?.paymentCount || 0}</div>
                <div className="text-muted small">Latest: {formatDate(selectedPaymentGroup?.latestPaymentDate)}</div>
              </DetailCard>
            </Col>
            <Col md={4}>
              <DetailCard title="Invoice Balance" icon={FiCalendar}>
                <div className="fs-5 fw-semibold">{formatCurrency(selectedPaymentGroup?.invoiceId?.balance || 0)}</div>
                <div className="text-muted small">Invoice total: {formatCurrency(selectedPaymentGroup?.invoiceId?.summary?.totalAmount || 0)}</div>
              </DetailCard>
            </Col>
            <Col md={4}>
              <DetailCard title="Status" icon={FiTrendingUp}>
                <StatusBadge status={selectedPaymentGroup?.aggregateStatus || "recorded"} />
                <div className="text-muted small mt-2">
                  {selectedPaymentGroup?.paymentCount > 1 ? "This invoice has multiple payment layers." : "Single payment layer."}
                </div>
              </DetailCard>
            </Col>
            <Col md={12}>
              <div className="border rounded-3 p-4">
                <div className="d-flex align-items-center mb-3">
                  <FiFileText size={18} className="text-primary me-2" />
                  <h6 className="mb-0 fw-semibold">Invoice Details</h6>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Invoice Number:</span>
                  <span className="fw-semibold">{selectedPaymentGroup?.invoiceId?.invoiceNumber || "-"}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Rent Amount:</span>
                  <span>{formatCurrency(selectedPaymentGroup?.invoiceId?.items?.rent?.amount || 0)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Utilities:</span>
                  <span>{formatCurrency(selectedPaymentGroup?.invoiceId?.summary?.utilitiesSubtotal || 0)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                  <span className="text-muted fw-semibold">Total Balance:</span>
                  <span className="fw-bold text-danger">{formatCurrency(selectedPaymentGroup?.invoiceId?.balance || 0)}</span>
                </div>
              </div>
            </Col>
            <Col md={12}>
              <div className="border rounded-3 p-4">
                <div className="d-flex align-items-center mb-3">
                  <FiHash size={18} className="text-primary me-2" />
                  <h6 className="mb-0 fw-semibold">Payment Layers</h6>
                </div>
                {(selectedPaymentGroup?.payments || []).map((payment) => (
                  <div key={payment._id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                      <div>
                        <div className="fw-semibold">{payment.paymentNumber}</div>
                        <small className="text-muted">
                          {formatDate(payment.paymentDate)} | {payment.method?.toUpperCase() || "-"} | Ref: {getReferenceNumber(payment) || "-"}
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-success">{formatCurrency(payment.amount || 0)}</div>
                        <StatusBadge status={payment.lifecycle?.status || "recorded"} />
                      </div>
                    </div>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <div className="text-muted small">Recorded by</div>
                        <div className="fw-semibold">{getAuditLabel(payment.recordedBy)}</div>
                        <div className="text-muted small">{formatDate(payment.recordedAt)}</div>
                      </Col>
                      <Col md={6}>
                        <div className="text-muted small">Lifecycle note</div>
                        <div>{payment.lifecycle?.notes || payment.notes || "-"}</div>
                      </Col>
                    </Row>
                    <div className="mb-3">
                      <div className="text-muted small mb-2">Allocation</div>
                      {(payment.allocation || []).map((item, idx) => (
                        <div key={`${payment._id}-${idx}`} className="d-flex justify-content-between align-items-center py-2 border-top">
                          <div>
                            <div className="fw-semibold">{item.itemType?.toUpperCase() || "-"}</div>
                            <small className="text-muted">{item.invoiceId?.invoiceNumber || selectedPaymentGroup?.invoiceId?.invoiceNumber}</small>
                          </div>
                          <div className="fw-semibold text-success">{formatCurrency(item.amount)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <Button color="primary" size="sm" onClick={() => printReceipt(payment)}>
                        <FiPrinter className="me-1" size={14} /> Print
                      </Button>
                      <Button
                        color="outline-secondary"
                        size="sm"
                        onClick={() => openEditModal(payment)}
                        disabled={!["recorded", "verified"].includes(payment.lifecycle?.status)}
                      >
                        <FiEdit2 className="me-1" size={14} /> Edit
                      </Button>
                      <Button
                        color="info"
                        size="sm"
                        onClick={() => openConfirm("verify", payment)}
                        disabled={payment.lifecycle?.status !== "recorded"}
                      >
                        <FiCheckCircle className="me-1" size={14} /> Verify
                      </Button>
                      <Button
                        color="success"
                        size="sm"
                        onClick={() => openConfirm("reconcile", payment)}
                        disabled={payment.lifecycle?.status !== "verified"}
                      >
                        <FiThumbsUp className="me-1" size={14} /> Reconcile
                      </Button>
                      <Button
                        color="warning"
                        size="sm"
                        onClick={() => openConfirm("reject", payment)}
                        disabled={payment.lifecycle?.status !== "recorded"}
                      >
                        <FiThumbsDown className="me-1" size={14} /> Reject
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => openConfirm("reverse", payment)}
                        disabled={payment.lifecycle?.status !== "reconciled"}
                      >
                        <FiRotateCcw className="me-1" size={14} /> Reverse
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <div className="text-muted small">Use the payment layers above to print, edit, verify, reconcile, reject, or reverse a specific payment.</div>
        </ModalFooter>
      </Modal>

      {/* Confirm Modal */}
      <Modal isOpen={confirmModal} toggle={() => setConfirmModal(false)} centered>
        <ModalHeader toggle={() => setConfirmModal(false)} className="bg-light border-0">
          <div className="d-flex align-items-center">
            <FiAlertCircle size={20} className="text-warning me-2" />
            <h5 className="mb-0 text-capitalize">Confirm {confirmState.action}</h5>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="mb-3">
            Are you sure you want to <strong className="text-capitalize">{confirmState.action}</strong> payment{' '}
            <span className="fw-semibold">{confirmState.payment?.paymentNumber || ""}</span>?
          </p>
          {confirmState.action === "reject" && (
            <FormGroup className="mb-0">
              <Label className="form-label">Reject Reason *</Label>
              <Input
                type="textarea"
                rows="3"
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="form-control"
              />
            </FormGroup>
          )}
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <Button color="light" onClick={() => setConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            color={confirmState.action === "reject" || confirmState.action === "reverse" ? "danger" : "primary"}
            onClick={runConfirmedAction}
            disabled={confirmState.action === "reject" && !confirmReason.trim()}
          >
            Confirm {confirmState.action}
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Payments;

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import DataTable from "react-data-table-component";
// import Select from "react-select";
// import {
//   Badge,
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   Col,
//   Container,
//   Form,
//   FormGroup,
//   Input,
//   Label,
//   Modal,
//   ModalBody,
//   ModalFooter,
//   ModalHeader,
//   Row,
// } from "reactstrap";
// import { createSelector } from "reselect";
// import { useDispatch, useSelector } from "react-redux";
// import { useFormik } from "formik";
// import * as Yup from "yup";
// import { toast, ToastContainer } from "react-toastify";
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import { FinanceAPI } from "../../../helpers/backend_helper";
// import { getLeases as onGetLeases, getPayments as onGetPayments } from "../../../slices/thunks";

// const methodOptions = [
//   { value: "evc", label: "EVC" },
//   { value: "merchant", label: "Merchant" },
//   { value: "bank", label: "Bank" },
// ];

// const getTenantName = (tenant) =>
//   `${tenant?.personalInfo?.firstName || ""} ${tenant?.personalInfo?.lastName || ""}`.trim() || "Unknown tenant";

// const getLeaseLabel = (lease, tenant) =>
//   `${lease?.unitId?.unitNumber || lease?.unitNumber || "Unit"} - ${getTenantName(tenant)} (${tenant?.contact?.primaryPhone || "No phone"})`;

// const getAuditLabel = (user) => {
//   if (!user) return "-";
//   if (typeof user === "string") return user;
//   return user.fullName || user.username || user.email || "-";
// };

// const getReferenceNumber = (payment) =>
//   payment?.method === "evc"
//     ? payment?.methodDetails?.evc?.referenceNumber || ""
//     : payment?.method === "merchant"
//       ? payment?.methodDetails?.merchant?.referenceNumber || ""
//       : payment?.methodDetails?.bank?.transactionId || "";

// const Payments = () => {
//   document.title = "Finance - Payments | Degaanly";
//   const dispatch = useDispatch();

//   const financeSelector = createSelector(
//     (state) => state.Finance,
//     (s) => ({
//       payments: s.payments || [],
//       paymentPagination: s.paymentPagination || {},
//       loading: s.loadingPayments,
//     }),
//   );
//   const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
//   const { payments, paymentPagination, loading } = useSelector(financeSelector);
//   const leases = useSelector(leaseSelector);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [paymentModal, setPaymentModal] = useState(false);
//   const [detailModal, setDetailModal] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedPayment, setSelectedPayment] = useState(null);
//   const [confirmModal, setConfirmModal] = useState(false);
//   const [confirmState, setConfirmState] = useState({ action: "", payment: null });
//   const [confirmReason, setConfirmReason] = useState("");
//   const [openInvoices, setOpenInvoices] = useState([]);

//   const fetchPayments = useCallback(() => {
//     dispatch(onGetPayments({ params: { page: currentPage, limit: 10 } }));
//   }, [currentPage, dispatch]);

//   const fetchOpenInvoices = useCallback(async () => {
//     const res = await FinanceAPI.listInvoices({ page: 1, limit: 200 });
//     if (res.success) {
//       setOpenInvoices((res.data?.data || []).filter((invoice) => Number(invoice.balance || 0) > 0));
//     }
//   }, []);

//   useEffect(() => {
//     fetchPayments();
//   }, [fetchPayments]);

//   useEffect(() => {
//     dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
//     fetchOpenInvoices();
//   }, [dispatch, fetchOpenInvoices]);

//   const leaseMap = useMemo(() => {
//     const map = new Map();
//     leases.forEach((lease) => map.set(lease._id, lease));
//     return map;
//   }, [leases]);

//   const invoiceMap = useMemo(() => {
//     const map = new Map();
//     openInvoices.forEach((invoice) => map.set(invoice._id, invoice));
//     return map;
//   }, [openInvoices]);

//   const leaseOptions = useMemo(() => {
//     const leaseIdsWithOpenInvoices = new Set(openInvoices.map((invoice) => invoice.leaseId));
//     return leases
//       .filter((lease) => leaseIdsWithOpenInvoices.has(lease._id))
//       .map((lease) => ({
//         value: lease._id,
//         label: getLeaseLabel(lease, lease?.tenantId),
//       }));
//   }, [leases, openInvoices]);

//   const paymentFormik = useFormik({
//     initialValues: {
//       leaseId: "",
//       invoiceId: "",
//       amount: "",
//       paymentDate: new Date().toISOString().split("T")[0],
//       method: "evc",
//       referenceNumber: "",
//       notes: "",
//       unitId: "",
//       buildingId: "",
//       tenantId: "",
//     },
//     validationSchema: Yup.object({
//       leaseId: Yup.string().required("Lease is required"),
//       invoiceId: Yup.string().required("Invoice is required"),
//       amount: Yup.number().min(0.01).required("Amount is required"),
//       paymentDate: Yup.string().required("Payment date is required"),
//       referenceNumber: Yup.string().required("Reference is required"),
//     }),
//     onSubmit: async (values, { setSubmitting, resetForm }) => {
//       const methodDetails =
//         values.method === "evc"
//           ? { evc: { referenceNumber: values.referenceNumber } }
//           : values.method === "merchant"
//             ? { merchant: { referenceNumber: values.referenceNumber } }
//             : { bank: { transactionId: values.referenceNumber } };

//       try {
//         const action = editMode && selectedPayment ? "update" : "create";
//         const res =
//           action === "update"
//             ? await FinanceAPI.updatePayment(selectedPayment._id, {
//                 amount: Number(values.amount),
//                 paymentDate: values.paymentDate,
//                 method: values.method,
//                 methodDetails,
//                 notes: values.notes || undefined,
//               })
//             : await FinanceAPI.createPayment({
//                 tenantId: values.tenantId,
//                 leaseId: values.leaseId,
//                 invoiceId: values.invoiceId,
//                 amount: Number(values.amount),
//                 paymentDate: values.paymentDate,
//                 method: values.method,
//                 methodDetails,
//                 notes: values.notes || undefined,
//                 unitId: values.unitId,
//                 buildingId: values.buildingId,
//               });

//         if (res.success) {
//           toast.success(action === "update" ? "Payment updated." : "Payment recorded.");
//           setPaymentModal(false);
//           setEditMode(false);
//           setSelectedPayment(null);
//           resetForm();
//           fetchPayments();
//           fetchOpenInvoices();
//         }
//       } finally {
//         setSubmitting(false);
//       }
//     },
//   });

//   const filteredInvoices = useMemo(
//     () => openInvoices.filter((invoice) => invoice.leaseId === paymentFormik.values.leaseId),
//     [openInvoices, paymentFormik.values.leaseId],
//   );

//   useEffect(() => {
//     const selectedLease = leaseMap.get(paymentFormik.values.leaseId);
//     if (!selectedLease) return;
//     paymentFormik.setFieldValue(
//       "tenantId",
//       typeof selectedLease.tenantId === "object" ? selectedLease.tenantId?._id : selectedLease.tenantId,
//     );
//     paymentFormik.setFieldValue(
//       "unitId",
//       typeof selectedLease.unitId === "object" ? selectedLease.unitId?._id : selectedLease.unitId,
//     );
//     paymentFormik.setFieldValue(
//       "buildingId",
//       typeof selectedLease.buildingId === "object" ? selectedLease.buildingId?._id : selectedLease.buildingId,
//     );
//   }, [leaseMap, paymentFormik.values.leaseId]);

//   useEffect(() => {
//     const invoice = invoiceMap.get(paymentFormik.values.invoiceId);
//     if (invoice && !editMode) {
//       paymentFormik.setFieldValue("amount", String(invoice.balance || ""));
//     }
//   }, [editMode, invoiceMap, paymentFormik.values.invoiceId]);

//   const openCreateModal = () => {
//     setEditMode(false);
//     setSelectedPayment(null);
//     paymentFormik.resetForm();
//     setPaymentModal(true);
//   };

//   const openEditModal = async (payment) => {
//     const res = await FinanceAPI.getPayment(payment._id);
//     if (!res.success) return;
//     const data = res.data;
//     setSelectedPayment(data);
//     setEditMode(true);
//     paymentFormik.setValues({
//       leaseId: typeof data.leaseId === "object" ? data.leaseId?._id : data.leaseId || "",
//       invoiceId: typeof data.invoiceId === "object" ? data.invoiceId?._id : data.invoiceId || "",
//       amount: String(data.amount || ""),
//       paymentDate: data.paymentDate?.split?.("T")?.[0] || new Date().toISOString().split("T")[0],
//       method: data.method || "evc",
//       referenceNumber: getReferenceNumber(data),
//       notes: data.notes || "",
//       unitId: typeof data.unitId === "object" ? data.unitId?._id : data.unitId || "",
//       buildingId: typeof data.buildingId === "object" ? data.buildingId?._id : data.buildingId || "",
//       tenantId: typeof data.tenantId === "object" ? data.tenantId?._id : data.tenantId || "",
//     });
//     setPaymentModal(true);
//   };

//   const openDetails = async (payment) => {
//     const res = await FinanceAPI.getPayment(payment._id);
//     if (res.success) {
//       setSelectedPayment(res.data);
//       setDetailModal(true);
//     }
//   };

//   const openConfirm = (action, payment) => {
//     setConfirmState({ action, payment });
//     setConfirmReason("");
//     setConfirmModal(true);
//   };

//   const runConfirmedAction = async () => {
//     const { action, payment } = confirmState;
//     if (!payment) return;
//     if (action === "reject" && !confirmReason.trim()) {
//       toast.error("Reject reason is required.");
//       return;
//     }

//     let res;
//     if (action === "reject") res = await FinanceAPI.rejectPayment(payment._id, { note: confirmReason.trim() });
//     if (action === "reverse") res = await FinanceAPI.reversePayment(payment._id, { note: "Reversed from payments page" });
//     if (action === "verify") res = await FinanceAPI.verifyPayment(payment._id, { status: "verified", note: "Verified from payments page" });
//     if (action === "reconcile") res = await FinanceAPI.reconcilePayment(payment._id);

//     if (res?.success) {
//       toast.success(`Payment ${action}d successfully.`);
//       setConfirmModal(false);
//       setDetailModal(false);
//       fetchPayments();
//       fetchOpenInvoices();
//     }
//   };

//   const printReceipt = async (payment) => {
//     const res = await FinanceAPI.paymentReceipt(payment._id);
//     if (res.success && res.data?.downloadUrl) {
//       window.open(res.data.downloadUrl, "_blank");
//     }
//   };

//   const columns = [
//     {
//       name: "Payment",
//       grow: 1.8,
//       cell: (row) => (
//         <div>
//           <div className="fw-semibold">{row.paymentNumber}</div>
//           <small className="text-muted">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : "-"}</small>
//         </div>
//       ),
//     },
//     {
//       name: "Tenant",
//       grow: 2,
//       cell: (row) => (
//         <div>
//           <div className="fw-semibold">{getTenantName(row.tenantId)}</div>
//           <small className="text-muted">{row.tenantId?.contact?.primaryPhone || "-"}</small>
//         </div>
//       ),
//     },
//     {
//       name: "Invoice",
//       grow: 1.8,
//       cell: (row) => (
//         <div>
//           <div className="fw-semibold">{row.invoiceId?.invoiceNumber || "-"}</div>
//           <small className="text-muted">
//             Rent: ${Number(row.invoiceId?.items?.rent?.amount || 0).toLocaleString()} | Utilities: $
//             {Number(row.invoiceId?.summary?.utilitiesSubtotal || 0).toLocaleString()}
//           </small>
//         </div>
//       ),
//     },
//     { name: "Amount", cell: (row) => `$${Number(row.amount || 0).toLocaleString()}` },
//     {
//       name: "Status",
//       cell: (row) => <Badge color="info" className="text-capitalize">{row.lifecycle?.status || "recorded"}</Badge>,
//     },
//     {
//       name: "Audit",
//       grow: 1.8,
//       cell: (row) => (
//         <div>
//           <div className="small">Recorded: {getAuditLabel(row.recordedBy)}</div>
//           <div className="small">Last action: {getAuditLabel(row.lifecycle?.rejectedBy || row.lifecycle?.reversedBy || row.lifecycle?.reconciledBy || row.lifecycle?.verifiedBy)}</div>
//         </div>
//       ),
//     },
//     {
//       name: "Actions",
//       width: "360px",
//       cell: (row) => (
//         <div className="d-flex flex-wrap gap-1">
//           <Button size="sm" color="outline-info" onClick={() => openDetails(row)}>View</Button>
//           <Button size="sm" color="outline-primary" onClick={() => printReceipt(row)}>Print</Button>
//           <Button size="sm" color="outline-secondary" onClick={() => openEditModal(row)} disabled={!["recorded", "verified"].includes(row.lifecycle?.status)}>Edit</Button>
//           <Button size="sm" color="outline-danger" onClick={() => openConfirm("reverse", row)} disabled={row.lifecycle?.status !== "reconciled"}>Reverse</Button>
//           <Button size="sm" color="outline-warning" onClick={() => openConfirm("reject", row)} disabled={row.lifecycle?.status !== "recorded"}>Reject</Button>
//         </div>
//       ),
//     },
//   ];

//   const selectedLease = leaseMap.get(paymentFormik.values.leaseId);
//   const selectedInvoice = invoiceMap.get(paymentFormik.values.invoiceId);

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Payments" pageTitle="Finance" />
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//             <h5 className="card-title mb-0">Payment Lifecycle</h5>
//             <Button color="primary" onClick={openCreateModal}>
//               Record Payment
//             </Button>
//           </CardHeader>
//           <CardBody>
//             <DataTable
//               columns={columns}
//               data={payments}
//               progressPending={loading}
//               pagination
//               paginationServer
//               paginationTotalRows={paymentPagination?.total || 0}
//               paginationPerPage={paymentPagination?.limit || 10}
//               paginationDefaultPage={currentPage}
//               onChangePage={(page) => setCurrentPage(page)}
//               responsive
//             />
//           </CardBody>
//         </Card>
//       </Container>

//       <Modal isOpen={paymentModal} toggle={() => setPaymentModal(false)} centered size="lg">
//         <ModalHeader toggle={() => setPaymentModal(false)} className="bg-light">
//           {editMode ? "Edit Payment" : "Record Payment"}
//         </ModalHeader>
//         <Form onSubmit={paymentFormik.handleSubmit}>
//           <ModalBody>
//             <Row className="g-3">
//               <Col md={12}>
//                 <FormGroup>
//                   <Label className="form-label">Lease *</Label>
//                   <Select
//                     options={leaseOptions}
//                     placeholder="Select active lease with unpaid invoices"
//                     value={leaseOptions.find((option) => option.value === paymentFormik.values.leaseId) || null}
//                     onChange={(option) => {
//                       paymentFormik.setFieldValue("leaseId", option?.value || "");
//                       if (!editMode) paymentFormik.setFieldValue("invoiceId", "");
//                     }}
//                     classNamePrefix="select"
//                     isDisabled={editMode}
//                   />
//                 </FormGroup>
//               </Col>
//               <Col md={12}>
//                 <FormGroup>
//                   <Label className="form-label">Invoice *</Label>
//                   <Input type="select" value={paymentFormik.values.invoiceId} onChange={(e) => paymentFormik.setFieldValue("invoiceId", e.target.value)} disabled={editMode}>
//                     <option value="">Select invoice</option>
//                     {filteredInvoices.map((invoice) => (
//                       <option key={invoice._id} value={invoice._id}>
//                         {invoice.invoiceNumber} (${Number(invoice.balance || 0).toLocaleString()})
//                       </option>
//                     ))}
//                   </Input>
//                 </FormGroup>
//               </Col>
//               {selectedLease ? (
//                 <Col md={12}>
//                   <div className="border rounded p-3 bg-light-subtle">
//                     <div className="fw-semibold">{getLeaseLabel(selectedLease, selectedLease?.tenantId)}</div>
//                     <small className="text-muted">
//                       Outstanding invoice: {selectedInvoice?.invoiceNumber || "-"} | Rent: $
//                       {Number(selectedInvoice?.items?.rent?.amount || 0).toLocaleString()} | Utilities: $
//                       {Number(selectedInvoice?.summary?.utilitiesSubtotal || 0).toLocaleString()}
//                     </small>
//                   </div>
//                 </Col>
//               ) : null}
//               <Col md={6}>
//                 <FormGroup>
//                   <Label className="form-label">Amount *</Label>
//                   <Input type="number" min="0.01" value={paymentFormik.values.amount} onChange={(e) => paymentFormik.setFieldValue("amount", e.target.value)} />
//                 </FormGroup>
//               </Col>
//               <Col md={6}>
//                 <FormGroup>
//                   <Label className="form-label">Payment Date *</Label>
//                   <Input type="date" value={paymentFormik.values.paymentDate} onChange={(e) => paymentFormik.setFieldValue("paymentDate", e.target.value)} />
//                 </FormGroup>
//               </Col>
//               <Col md={6}>
//                 <FormGroup>
//                   <Label className="form-label">Method *</Label>
//                   <Select
//                     options={methodOptions}
//                     value={methodOptions.find((option) => option.value === paymentFormik.values.method) || null}
//                     onChange={(option) => paymentFormik.setFieldValue("method", option?.value || "evc")}
//                     classNamePrefix="select"
//                   />
//                 </FormGroup>
//               </Col>
//               <Col md={6}>
//                 <FormGroup>
//                   <Label className="form-label">Reference Number *</Label>
//                   <Input value={paymentFormik.values.referenceNumber} onChange={(e) => paymentFormik.setFieldValue("referenceNumber", e.target.value)} />
//                 </FormGroup>
//               </Col>
//               <Col md={12}>
//                 <FormGroup className="mb-0">
//                   <Label className="form-label">Notes</Label>
//                   <Input type="textarea" rows="3" value={paymentFormik.values.notes} onChange={(e) => paymentFormik.setFieldValue("notes", e.target.value)} />
//                 </FormGroup>
//               </Col>
//             </Row>
//           </ModalBody>
//           <ModalFooter className="bg-light">
//             <Button color="light" onClick={() => setPaymentModal(false)}>Cancel</Button>
//             <Button color="primary" type="submit" disabled={paymentFormik.isSubmitting}>
//               {paymentFormik.isSubmitting ? "Saving..." : editMode ? "Update Payment" : "Save Payment"}
//             </Button>
//           </ModalFooter>
//         </Form>
//       </Modal>

//       <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} centered size="xl">
//         <ModalHeader toggle={() => setDetailModal(false)} className="bg-light">
//           Payment Details
//         </ModalHeader>
//         <ModalBody>
//           <Row className="g-3">
//             <Col md={6}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Tenant</div>
//                 <div className="fw-semibold">{getTenantName(selectedPayment?.tenantId)}</div>
//                 <div>{selectedPayment?.tenantId?.contact?.primaryPhone || "-"}</div>
//               </div>
//             </Col>
//             <Col md={6}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Invoice</div>
//                 <div className="fw-semibold">{selectedPayment?.invoiceId?.invoiceNumber || "-"}</div>
//                 <div>{selectedPayment?.leaseId?.leaseNumber || "-"}</div>
//               </div>
//             </Col>
//             <Col md={3}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Payment Amount</div>
//                 <div className="fw-semibold">${Number(selectedPayment?.amount || 0).toLocaleString()}</div>
//               </div>
//             </Col>
//             <Col md={3}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Rent</div>
//                 <div className="fw-semibold">${Number(selectedPayment?.invoiceId?.items?.rent?.amount || 0).toLocaleString()}</div>
//               </div>
//             </Col>
//             <Col md={3}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Utilities</div>
//                 <div className="fw-semibold">${Number(selectedPayment?.invoiceId?.summary?.utilitiesSubtotal || 0).toLocaleString()}</div>
//               </div>
//             </Col>
//             <Col md={3}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Status</div>
//                 <div className="fw-semibold text-capitalize">{selectedPayment?.lifecycle?.status || "recorded"}</div>
//               </div>
//             </Col>
//             <Col md={12}>
//               <div className="border rounded p-3">
//                 <div className="text-muted small mb-2">Allocation</div>
//                 {(selectedPayment?.allocation || []).map((row) => (
//                   <div key={row._id || `${row.itemType}-${row.itemIndex}`} className="small mb-1">
//                     {row.invoiceId?.invoiceNumber || "-"} | {row.itemType} | ${Number(row.amount || 0).toLocaleString()}
//                   </div>
//                 ))}
//               </div>
//             </Col>
//             <Col md={12}>
//               <div className="border rounded p-3">
//                 <div className="text-muted small mb-2">Audit Trail</div>
//                 <div className="small">Recorded by: {getAuditLabel(selectedPayment?.recordedBy)}</div>
//                 <div className="small">Verified by: {getAuditLabel(selectedPayment?.lifecycle?.verifiedBy)}</div>
//                 <div className="small">Reconciled by: {getAuditLabel(selectedPayment?.lifecycle?.reconciledBy)}</div>
//                 <div className="small">Rejected by: {getAuditLabel(selectedPayment?.lifecycle?.rejectedBy)}</div>
//                 <div className="small">Reversed by: {getAuditLabel(selectedPayment?.lifecycle?.reversedBy)}</div>
//               </div>
//             </Col>
//             <Col md={12}>
//               <div className="border rounded p-3">
//                 <div className="text-muted small mb-2">Notes</div>
//                 <div>{selectedPayment?.notes || selectedPayment?.lifecycle?.notes || "No notes recorded."}</div>
//               </div>
//             </Col>
//           </Row>
//         </ModalBody>
//         <ModalFooter className="bg-light justify-content-between">
//           <div className="d-flex gap-2">
//             <Button color="outline-primary" onClick={() => printReceipt(selectedPayment)}>Print</Button>
//             <Button color="outline-secondary" onClick={() => openEditModal(selectedPayment)} disabled={!["recorded", "verified"].includes(selectedPayment?.lifecycle?.status)}>Edit</Button>
//           </div>
//           <div className="d-flex gap-2">
//             <Button color="info" onClick={() => openConfirm("verify", selectedPayment)} disabled={selectedPayment?.lifecycle?.status !== "recorded"}>Verify</Button>
//             <Button color="success" onClick={() => openConfirm("reconcile", selectedPayment)} disabled={selectedPayment?.lifecycle?.status !== "verified"}>Reconcile</Button>
//             <Button color="warning" onClick={() => openConfirm("reject", selectedPayment)} disabled={selectedPayment?.lifecycle?.status !== "recorded"}>Reject</Button>
//             <Button color="danger" onClick={() => openConfirm("reverse", selectedPayment)} disabled={selectedPayment?.lifecycle?.status !== "reconciled"}>Reverse</Button>
//           </div>
//         </ModalFooter>
//       </Modal>

//       <Modal isOpen={confirmModal} toggle={() => setConfirmModal(false)} centered>
//         <ModalHeader toggle={() => setConfirmModal(false)} className="bg-light text-capitalize">
//           Confirm {confirmState.action}
//         </ModalHeader>
//         <ModalBody>
//           <p className="mb-3">
//             Are you sure you want to {confirmState.action} payment{" "}
//             <span className="fw-semibold">{confirmState.payment?.paymentNumber || ""}</span>?
//           </p>
//           {confirmState.action === "reject" ? (
//             <FormGroup className="mb-0">
//               <Label className="form-label">Reject Reason *</Label>
//               <Input
//                 type="textarea"
//                 rows="3"
//                 value={confirmReason}
//                 onChange={(e) => setConfirmReason(e.target.value)}
//                 placeholder="Enter the reject reason"
//               />
//             </FormGroup>
//           ) : null}
//         </ModalBody>
//         <ModalFooter className="bg-light">
//           <Button color="light" onClick={() => setConfirmModal(false)}>Cancel</Button>
//           <Button color="primary" onClick={runConfirmedAction} disabled={confirmState.action === "reject" && !confirmReason.trim()}>
//             Confirm
//           </Button>
//         </ModalFooter>
//       </Modal>
//       <ToastContainer />
//     </div>
//   );
// };

// export default Payments;
