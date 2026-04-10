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
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiHome,
  FiPlus,
  FiRefreshCw,
  FiThumbsDown,
  FiThumbsUp,
  FiTrendingUp,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import ActionIconButton from "../../../Components/Common/ActionIconButton";
import { FinanceAPI } from "../../../helpers/backend_helper";
import {
  createExpense as onCreateExpense,
  getBuildings as onGetBuildings,
  getExpenses as onGetExpenses,
} from "../../../slices/thunks";

const categoryOptions = [
  { value: "", label: "All categories" },
  { value: "salary", label: "Employee Salary" },
  { value: "maintenance", label: "Maintenance Repairing" },
  { value: "utilities", label: "Utilities" },
  { value: "security", label: "Security" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

const createCategoryOptions = categoryOptions.filter((item) => item.value);

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "evc", label: "EVC" },
  { value: "merchant", label: "Merchant" },
  { value: "bank", label: "Bank" },
];

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
  }),
};

const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString()}`;
const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const generateExpenseNumber = () =>
  `EXP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getBuildingId = (expense) =>
  typeof expense?.buildingId === "object" ? expense?.buildingId?._id : expense?.buildingId;

const getBuildingLabel = (expense, buildingMap) => {
  const directBuilding = typeof expense?.buildingId === "object" ? expense?.buildingId : null;
  if (directBuilding?.name) {
    return directBuilding?.code ? `${directBuilding.name} (${directBuilding.code})` : directBuilding.name;
  }

  const buildingId = getBuildingId(expense);
  const building = buildingMap.get(buildingId);
  if (!building) return "All Buildings";
  return `${building.name}${building.code ? ` (${building.code})` : ""}`;
};

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

const DetailCard = ({ title, icon: Icon, children }) => (
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

const ApprovalBadge = ({ status }) => {
  const config = {
    approved: { color: "success", label: "Approved" },
    rejected: { color: "danger", label: "Rejected" },
    pending: { color: "warning", label: "Pending" },
  };

  const current = config[status] || config.pending;
  return <Badge color={current.color}>{current.label}</Badge>;
};

const Expenses = () => {
  document.title = "Finance - Expenses | Apartment Management";
  const dispatch = useDispatch();

  const financeSelector = createSelector(
    (state) => state.Finance,
    (s) => ({
      expenses: s.expenses || [],
      pagination: s.expensePagination || {},
      loading: s.loadingExpenses,
    }),
  );
  const buildingsSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
  const { expenses, pagination, loading } = useSelector(financeSelector);
  const buildings = useSelector(buildingsSelector);

  const [currentPage, setCurrentPage] = useState(1);
  const [expenseModal, setExpenseModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const fetchExpenses = useCallback(() => {
    const params = { page: currentPage, limit: 10 };
    if (categoryFilter) params.category = categoryFilter;
    if (buildingFilter) params.buildingId = buildingFilter;
    dispatch(onGetExpenses({ params }));
  }, [categoryFilter, buildingFilter, currentPage, dispatch]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, buildingFilter]);

  const buildingMap = useMemo(() => {
    const map = new Map();
    buildings.forEach((building) => map.set(building._id, building));
    return map;
  }, [buildings]);

  const buildingOptions = useMemo(
    () => [
      { value: "", label: "All buildings" },
      ...buildings.map((building) => ({
        value: building._id,
        label: `${building.name}${building.code ? ` (${building.code})` : ""}`,
      })),
    ],
    [buildings],
  );

  const filteredExpenses = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return expenses;

    return expenses.filter((expense) => {
      const haystack = [
        expense.expenseNumber,
        expense.description,
        expense.category,
        expense.subCategory,
        expense.payee?.name,
        expense.payee?.contact,
        expense.payee?.email,
        getBuildingLabel(expense, buildingMap),
        expense.payment?.transactionId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [buildingMap, expenses, searchText]);

  const stats = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const approvedCount = filteredExpenses.filter((expense) => expense.approval?.status === "approved").length;
    const pendingCount = filteredExpenses.filter((expense) => (expense.approval?.status || "pending") === "pending").length;

    return {
      totalExpenses: filteredExpenses.length,
      totalAmount,
      approvedCount,
      pendingCount,
    };
  }, [filteredExpenses]);

  const expenseFormik = useFormik({
    initialValues: {
      category: "salary",
      subCategory: "",
      description: "",
      amount: "",
      buildingId: "",
      payeeName: "",
      payeeContact: "",
      payeeEmail: "",
      expenseDate: new Date().toISOString().split("T")[0],
      paid: true,
      paymentMethod: "cash",
      transactionId: "",
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
      description: Yup.string().required("Description is required"),
      amount: Yup.number().min(0.01).required("Amount is required"),
      payeeName: Yup.string().required("Payee name is required"),
      expenseDate: Yup.string().required("Expense date is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await dispatch(
          onCreateExpense({
            data: {
              category: values.category,
              subCategory: values.subCategory || undefined,
              description: values.description,
              amount: Number(values.amount),
              buildingId: values.buildingId || undefined,
              payee: {
                name: values.payeeName,
                contact: values.payeeContact || undefined,
                email: values.payeeEmail || undefined,
              },
              expenseDate: values.expenseDate,
              payment: {
                method: values.paymentMethod,
                paid: Boolean(values.paid),
                paidDate: values.paid ? values.expenseDate : undefined,
                transactionId: values.transactionId || undefined,
              },
            },
          }),
        );

        setExpenseModal(false);
        resetForm({
          values: {
            category: "salary",
            subCategory: "",
            description: "",
            amount: "",
            buildingId: "",
            payeeName: "",
            payeeContact: "",
            payeeEmail: "",
            expenseDate: new Date().toISOString().split("T")[0],
            paid: true,
            paymentMethod: "cash",
            transactionId: "",
          },
        });
        fetchExpenses();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openDetails = async (expense) => {
    const res = await FinanceAPI.getExpense(expense._id);
    if (res.success) {
      setSelectedExpense(res.data);
      setDetailsModal(true);
    }
  };

  const applyApproval = async (expense, status) => {
    const res = await FinanceAPI.approveExpense(expense._id, { status });
    if (res.success) {
      toast.success(`Expense ${status}.`);
      if (selectedExpense?._id === expense._id) {
        setSelectedExpense(res.data);
      }
      fetchExpenses();
    }
  };

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_row, i) => (currentPage - 1) * (pagination?.limit || 10) + i + 1,
    },
    {
      name: "Expense Details",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold mb-1">{row.expenseNumber || "-"}</div>
          <small className="text-muted">{row.description || "-"}</small>
        </div>
      ),
    },
    {
      name: "Payee / Building",
      grow: 1.8,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.payee?.name || "-"}</div>
          <small className="text-muted">{getBuildingLabel(row, buildingMap)}</small>
        </div>
      ),
    },
    {
      name: "Category",
      cell: (row) => (
        <div>
          <div className="text-capitalize fw-semibold">{row.category || "-"}</div>
          <small className="text-muted">{row.subCategory || "General"}</small>
        </div>
      ),
    },
    {
      name: "Amount",
      cell: (row) => <span className="fw-bold text-danger">{formatCurrency(row.amount || 0)}</span>,
    },
    {
      name: "Payment",
      grow: 1.3,
      cell: (row) => (
        <div>
          <div className="fw-semibold text-capitalize">{row.payment?.method || "-"}</div>
          <small className="text-muted">{row.payment?.paid ? "Paid" : "Unpaid"}</small>
        </div>
      ),
    },
    {
      name: "Approval",
      cell: (row) => <ApprovalBadge status={row.approval?.status || "pending"} />,
    },
    {
      name: "Actions",
      width: "180px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <ActionIconButton
            onClick={() => openDetails(row)}
            id={`view-${row._id}`}
            icon={<FiEye size={16} />}
            tooltip="View Details"
          />
          <ActionIconButton
            onClick={() => applyApproval(row, "approved")}
            disabled={row.approval?.status === "approved"}
            id={`approve-${row._id}`}
            icon={<FiThumbsUp size={16} />}
            tooltip="Approve Expense"
          />
          <ActionIconButton
            onClick={() => applyApproval(row, "rejected")}
            disabled={row.approval?.status === "rejected"}
            id={`reject-${row._id}`}
            icon={<FiThumbsDown size={16} />}
            tooltip="Reject Expense"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Expenses" pageTitle="Finance" />

        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <FiFileText size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1">Expense Management</h4>
                    <p className="text-muted mb-0">Track, review and approve property expenses</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <Button color="primary" onClick={() => setExpenseModal(true)} className="w-100 py-2">
                  <FiPlus className="me-2" size={18} />
                  Record Expense
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <StatCard icon={FiFileText} title="Total Expenses" value={stats.totalExpenses} color="primary" subtitle="Current view" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard icon={FiDollarSign} title="Total Amount" value={formatCurrency(stats.totalAmount)} color="danger" subtitle="Tracked spend" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard icon={FiCheckCircle} title="Approved" value={stats.approvedCount} color="success" subtitle="Reviewed" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard icon={FiAlertCircle} title="Pending" value={stats.pendingCount} color="warning" subtitle="Awaiting action" />
          </Col>
        </Row>

        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Filter Expenses</h5>
              <Button
                color="light"
                onClick={() => {
                  setSearchText("");
                  setCategoryFilter("");
                  setBuildingFilter("");
                }}
              >
                <FiRefreshCw className="me-1" size={14} />
                Reset
              </Button>
            </div>
            <Row className="g-3">
              <Col lg={4} md={6}>
                <Label className="form-label text-muted small mb-1">Search</Label>
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Expense #, payee, description, building..."
                />
              </Col>
              <Col lg={4} md={6}>
                <Label className="form-label text-muted small mb-1">Category</Label>
                <Select
                  options={categoryOptions}
                  value={categoryOptions.find((item) => item.value === categoryFilter) || categoryOptions[0]}
                  onChange={(option) => setCategoryFilter(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={4} md={6}>
                <Label className="form-label text-muted small mb-1">Building</Label>
                <Select
                  options={buildingOptions}
                  value={buildingOptions.find((item) => item.value === buildingFilter) || buildingOptions[0]}
                  onChange={(option) => setBuildingFilter(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-white border-0 pt-4 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Expense History</h5>
              <Badge color="light" className="px-3 py-2 text-primary">
                Total: {pagination?.total || 0} expenses
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={filteredExpenses}
              progressPending={loading}
              pagination
              paginationServer
              paginationTotalRows={pagination?.total || 0}
              paginationPerPage={pagination?.limit || 10}
              paginationDefaultPage={currentPage}
              onChangePage={(page) => setCurrentPage(page)}
              responsive
              highlightOnHover
              pointerOnHover
              className="border-0"
              customStyles={{
                headRow: {
                  style: {
                    backgroundColor: "#f8f9fa",
                    borderTop: "none",
                    fontWeight: 600,
                  },
                },
                rows: {
                  style: {
                    minHeight: "72px",
                  },
                },
              }}
            />
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={expenseModal} toggle={() => setExpenseModal(false)} centered size="lg" className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setExpenseModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Record Expense</h5>
            <small className="text-muted">Create a new finance expense entry</small>
          </div>
        </ModalHeader>
        <Form onSubmit={expenseFormik.handleSubmit}>
          <ModalBody className="p-4">
            <Row className="g-4">
              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Category *</Label>
                <Select
                  options={createCategoryOptions}
                  value={createCategoryOptions.find((item) => item.value === expenseFormik.values.category) || null}
                  onChange={(option) => expenseFormik.setFieldValue("category", option?.value || "other")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Sub Category</Label>
                <Input
                  name="subCategory"
                  value={expenseFormik.values.subCategory}
                  onChange={expenseFormik.handleChange}
                  placeholder="Enter sub category"
                />
              </Col>
              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  name="amount"
                  value={expenseFormik.values.amount}
                  onChange={expenseFormik.handleChange}
                  placeholder="Enter expense amount"
                />
              </Col>

              <Col md={12}>
                <Label className="form-label text-muted small mb-1">Description *</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="description"
                  value={expenseFormik.values.description}
                  onChange={expenseFormik.handleChange}
                  placeholder="Describe the expense entry"
                />
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Building</Label>
                <Select
                  options={buildingOptions.filter((item) => item.value)}
                  value={buildingOptions.find((item) => item.value === expenseFormik.values.buildingId) || null}
                  onChange={(option) => expenseFormik.setFieldValue("buildingId", option?.value || "")}
                  isClearable
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Expense Date *</Label>
                <Input
                  type="date"
                  name="expenseDate"
                  value={expenseFormik.values.expenseDate}
                  onChange={expenseFormik.handleChange}
                />
              </Col>

              <Col md={4}>
                <Label className="form-label text-muted small mb-1">Payee Name *</Label>
                <Input
                  name="payeeName"
                  value={expenseFormik.values.payeeName}
                  onChange={expenseFormik.handleChange}
                  placeholder="Enter payee name"
                />
              </Col>
              <Col md={4}>
                <Label className="form-label text-muted small mb-1">Payee Contact</Label>
                <Input
                  name="payeeContact"
                  value={expenseFormik.values.payeeContact}
                  onChange={expenseFormik.handleChange}
                  placeholder="Enter payee contact"
                />
              </Col>
              <Col md={4}>
                <Label className="form-label text-muted small mb-1">Payee Email</Label>
                <Input
                  type="email"
                  name="payeeEmail"
                  value={expenseFormik.values.payeeEmail}
                  onChange={expenseFormik.handleChange}
                  placeholder="Enter payee email"
                />
              </Col>

              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Payment Method</Label>
                <Select
                  options={paymentMethodOptions}
                  value={paymentMethodOptions.find((item) => item.value === expenseFormik.values.paymentMethod) || null}
                  onChange={(option) => expenseFormik.setFieldValue("paymentMethod", option?.value || "cash")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Transaction ID</Label>
                <Input
                  name="transactionId"
                  value={expenseFormik.values.transactionId}
                  onChange={expenseFormik.handleChange}
                  placeholder="Enter transaction ID"
                />
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light border-0">
            <Button color="light" onClick={() => setExpenseModal(false)}>
              <FiXCircle className="me-1" size={16} /> Cancel
            </Button>
            <Button color="primary" type="submit" disabled={expenseFormik.isSubmitting}>
              {expenseFormik.isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <FiCheckCircle className="me-1" size={16} /> Save Expense
                </>
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={detailsModal} toggle={() => setDetailsModal(false)} centered size="xl" className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setDetailsModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Expense Details</h5>
            <small className="text-muted">{selectedExpense?.expenseNumber || "-"}</small>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          <Row className="g-4">
            <Col md={6}>
              <DetailCard title="Expense Summary" icon={FiFileText}>
                <div className="fw-semibold mb-1 text-capitalize">{selectedExpense?.category || "-"}</div>
                <div className="text-muted small mb-1">{selectedExpense?.subCategory || "General"}</div>
                <div>{selectedExpense?.description || "-"}</div>
              </DetailCard>
            </Col>
            <Col md={6}>
              <DetailCard title="Payee Information" icon={FiUser}>
                <div className="fw-semibold mb-1">{selectedExpense?.payee?.name || "-"}</div>
                <div className="text-muted small">{selectedExpense?.payee?.contact || "-"}</div>
                <div className="text-muted small">{selectedExpense?.payee?.email || "-"}</div>
              </DetailCard>
            </Col>
            <Col md={4}>
              <DetailCard title="Amount" icon={FiDollarSign}>
                <div className="fs-3 fw-bold text-danger">{formatCurrency(selectedExpense?.amount || 0)}</div>
                <div className="text-muted small">{selectedExpense?.currency || "USD"}</div>
              </DetailCard>
            </Col>
            <Col md={4}>
              <DetailCard title="Expense Date" icon={FiCalendar}>
                <div className="fs-5 fw-semibold">{formatDate(selectedExpense?.expenseDate)}</div>
                <div className="text-muted small">Created: {formatDate(selectedExpense?.createdAt)}</div>
              </DetailCard>
            </Col>
            <Col md={4}>
              <DetailCard title="Approval" icon={FiTrendingUp}>
                <ApprovalBadge status={selectedExpense?.approval?.status || "pending"} />
                <div className="text-muted small mt-2">
                  Approved At: {formatDate(selectedExpense?.approval?.approvedAt)}
                </div>
              </DetailCard>
            </Col>
            <Col md={6}>
              <DetailCard title="Building" icon={FiHome}>
                <div className="fw-semibold">{getBuildingLabel(selectedExpense, buildingMap)}</div>
              </DetailCard>
            </Col>
            <Col md={6}>
              <DetailCard title="Payment Information" icon={FiCheckCircle}>
                <div className="fw-semibold text-capitalize mb-1">{selectedExpense?.payment?.method || "-"}</div>
                <div className="text-muted small">Status: {selectedExpense?.payment?.paid ? "Paid" : "Unpaid"}</div>
                <div className="text-muted small">Transaction: {selectedExpense?.payment?.transactionId || "-"}</div>
              </DetailCard>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <div className="d-flex gap-2">
            <Button
              color="success"
              onClick={() => applyApproval(selectedExpense, "approved")}
              disabled={selectedExpense?.approval?.status === "approved"}
            >
              <FiThumbsUp className="me-1" size={16} /> Approve
            </Button>
            <Button
              color="danger"
              onClick={() => applyApproval(selectedExpense, "rejected")}
              disabled={selectedExpense?.approval?.status === "rejected"}
            >
              <FiThumbsDown className="me-1" size={16} /> Reject
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Expenses;
