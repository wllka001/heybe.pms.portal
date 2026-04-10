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
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  FiEye,
  FiPrinter,
  FiDownload,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiChevronRight,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import ActionIconButton from "../../../Components/Common/ActionIconButton";
import { FinanceAPI } from "../../../helpers/backend_helper";
import { getInvoices as onGetInvoices, getLeases as onGetLeases } from "../../../slices/thunks";
import { downloadInvoicePdf } from "../../../utils/financeDocuments";

const today = new Date();
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
}));
const yearOptions = Array.from({ length: 7 }, (_, i) => String(today.getFullYear() - 2 + i));

const getTenantName = (lease) =>
  `${lease?.tenantId?.personalInfo?.firstName || ""} ${lease?.tenantId?.personalInfo?.lastName || ""}`.trim() || "Unknown tenant";

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

// Invoice Detail Card Component
const InvoiceDetailCard = ({ title, children, icon: Icon, color = "primary" }) => (
  <Card className="border-0 shadow-sm h-100 overflow-hidden">
    <div className={`bg-${color} bg-opacity-10 dark-bg-opacity-20 p-3 d-flex align-items-center border-bottom border-${color} border-opacity-10`}>
      <div className={`bg-${color} bg-opacity-20 rounded-circle p-2 me-3`}>
        <Icon size={18} className={`text-${color}`} />
      </div>
      <h6 className="mb-0 fw-bold text-uppercase tracking-wider small">{title}</h6>
    </div>
    <CardBody className="p-4">
      {children}
    </CardBody>
  </Card>
);

const Invoices = () => {
  document.title = "Finance - Invoices | Apartment Management";
  const dispatch = useDispatch();

  const financeSelector = createSelector(
    (state) => state.Finance,
    (s) => ({
      invoices: s.invoices || [],
      pagination: s.invoicePagination || {},
      loading: s.loadingInvoices,
    }),
  );
  const leasesSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const { invoices, pagination, loading } = useSelector(financeSelector);
  const leases = useSelector(leasesSelector);

  const [currentPage, setCurrentPage] = useState(1);
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [generateLoading, setGenerateLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [periodInvoiceCount, setPeriodInvoiceCount] = useState(0);
  const yearSelectOptions = useMemo(() => yearOptions.map((item) => ({ value: item, label: item })), []);

  const fetchInvoices = useCallback(() => {
    dispatch(onGetInvoices({ params: { page: currentPage, limit: 10 } }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
  }, [dispatch]);

  useEffect(() => {
    const checkPeriod = async () => {
      try {
        const res = await FinanceAPI.listInvoices({
          page: 1,
          limit: 1,
          month: Number(month),
          year: Number(year),
        });
        if (res.success) {
          setPeriodInvoiceCount(res.data?.meta?.total || 0);
        }
      } catch (_error) {
        setPeriodInvoiceCount(0);
      }
    };
    checkPeriod();
  }, [month, year]);

  const leaseMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => map.set(lease._id, lease));
    return map;
  }, [leases]);

  const openPreview = async () => {
    setPreviewLoading(true);
    try {
      const regenerate = periodInvoiceCount > 0;
      const res = await FinanceAPI.previewInvoices({
        month: Number(month),
        year: Number(year),
        regenerate,
      });
      if (res.success) {
        setPreview(res.data);
        setPreviewModal(true);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const generateInvoices = async () => {
    setGenerateLoading(true);
    try {
      const regenerate = periodInvoiceCount > 0;
      const res = await FinanceAPI.generateInvoices({
        month: Number(month),
        year: Number(year),
        regenerate,
      });
      if (res.success) {
        toast.success(regenerate ? "Monthly invoices regenerated successfully." : "Monthly invoices generated successfully.");
        setPreviewModal(false);
        fetchInvoices();
        const periodRes = await FinanceAPI.listInvoices({
          page: 1,
          limit: 1,
          month: Number(month),
          year: Number(year),
        });
        if (periodRes.success) {
          setPeriodInvoiceCount(periodRes.data?.meta?.total || 0);
        }
      }
    } finally {
      setGenerateLoading(false);
    }
  };

  const openInvoiceDetails = async (invoiceId) => {
    const res = await FinanceAPI.getInvoice(invoiceId);
    if (res.success) {
      setSelectedInvoice(res.data);
      setDetailsModal(true);
    }
  };

  const handleInvoicePdf = async (invoice) => {
    const lease = leaseMap.get(invoice.leaseId);
    await downloadInvoicePdf({
      invoice,
      lease,
      buildingLabel:
        lease?.buildingId?.name ||
        invoice?.buildingId?.name ||
        "-",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "success";
      case "partially_paid": return "info";
      case "overdue": return "danger";
      default: return "warning";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid": return <FiCheckCircle size={12} />;
      case "overdue": return <FiAlertCircle size={12} />;
      default: return <FiTrendingUp size={12} />;
    }
  };

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
    },
    {
      name: "Invoice Details",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold mb-1">{row.invoiceNumber}</div>
          <div className="d-flex align-items-center gap-2">
            <FiCalendar size={12} className="text-muted" />
            <small className="text-muted">
              {row.period?.year}-{String(row.period?.month || "").padStart(2, "0")}
            </small>
          </div>
        </div>
      ),
    },
    {
      name: "Tenant",
      grow: 2,
      cell: (row) => {
        const lease = leaseMap.get(row.leaseId);
        return (
          <div>
            <div className="fw-semibold">{lease ? getTenantName(lease) : "-"}</div>
            <small className="text-muted">Unit {lease?.unitId?.unitNumber || "-"}</small>
          </div>
        );
      },
    },
    {
      name: "Base Rent",
      cell: (row) => <span className="fw-semibold">{formatCurrency(row.summary?.rentSubtotal || 0)}</span>,
    },
    {
      name: "Utilities",
      cell: (row) => <span className="fw-semibold">{formatCurrency(row.summary?.utilitiesSubtotal || 0)}</span>,
    },
    {
      name: "Total",
      cell: (row) => <span className="fw-bold text-success">{formatCurrency(row.summary?.totalAmount || 0)}</span>,
    },
    {
      name: "Balance",
      cell: (row) => <span className={row.balance > 0 ? "text-danger" : "text-success"}>{formatCurrency(row.balance || 0)}</span>,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={getStatusColor(row.status)} className="d-flex align-items-center gap-1 px-3 py-2" style={{ width: "fit-content" }}>
          {getStatusIcon(row.status)}
          <span className="text-capitalize ms-1">{row.status?.replace("_", " ") || "Pending"}</span>
        </Badge>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <ActionIconButton
            onClick={() => openInvoiceDetails(row._id)}
            id={`view-${row._id}`}
            icon={<FiEye size={16} />}
            tooltip="View Details"
          />
          <ActionIconButton
            onClick={() => handleInvoicePdf(row)}
            id={`print-${row._id}`}
            icon={<FiPrinter size={16} />}
            tooltip="Print Invoice"
          />
        </div>
      ),
    },
  ];

  const previewRows = preview?.invoices || [];
  const currentLease = selectedInvoice ? leaseMap.get(selectedInvoice.leaseId) : null;

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.summary?.totalAmount || 0), 0);
    const paidAmount = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const overdueCount = invoices.filter(inv => inv.status === "overdue").length;

    return { totalInvoices, totalAmount, paidAmount, overdueCount, pendingAmount: totalAmount - paidAmount };
  }, [invoices]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Invoices" pageTitle="Finance" />

        {/* Header Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <FiFileText size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1">Invoice Management</h4>
                    <p className="text-muted mb-0">Generate, view and manage tenant invoices</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <Button
                  color="primary"
                  onClick={openPreview}
                  disabled={previewLoading}
                  className="w-100 py-2"
                >
                  {previewLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="me-2" size={18} />
                      {periodInvoiceCount > 0 ? "Regenerate Invoices" : "Generate Invoices"}
                    </>
                  )}
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiFileText}
              title="Total Invoices"
              value={stats.totalInvoices}
              color="primary"
              subtitle="This period"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiDollarSign}
              title="Total Amount"
              value={formatCurrency(stats.totalAmount)}
              color="success"
              subtitle="All invoices"
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiCheckCircle}
              title="Paid Amount"
              value={formatCurrency(stats.paidAmount)}
              color="info"
              subtitle={`${((stats.paidAmount / stats.totalAmount) * 100).toFixed(1)}% paid`}
            />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <StatCard
              icon={FiAlertCircle}
              title="Overdue"
              value={stats.overdueCount}
              color="danger"
              subtitle="Pending collection"
            />
          </Col>
        </Row>

        {/* Filter Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <h6 className="mb-3">Filter by Period</h6>
            <Row className="g-3">
              <Col md={5}>
                <Label className="form-label text-muted small mb-1">Month</Label>
                <Select
                  options={monthOptions}
                  value={monthOptions.find((item) => item.value === month) || null}
                  onChange={(option) => setMonth(option?.value || String(today.getMonth() + 1))}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col md={5}>
                <Label className="form-label text-muted small mb-1">Year</Label>
                <Select
                  options={yearSelectOptions}
                  value={yearSelectOptions.find((item) => item.value === year) || null}
                  onChange={(option) => setYear(option?.value || String(today.getFullYear()))}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col md={2}>
                <Label className="form-label text-muted small mb-1">&nbsp;</Label>
                <Button
                  color="outline-primary"
                  onClick={fetchInvoices}
                  className="w-100"
                >
                  <FiRefreshCw size={14} className="me-1" /> Refresh
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Data Table Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-white border-0 pt-4 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Invoice List</h5>
              <Badge color="light" className="px-3 py-2 text-primary">
                Total: {pagination?.total || 0} invoices
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={invoices}
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

      {/* Preview Modal */}
      <Modal isOpen={previewModal} toggle={() => setPreviewModal(false)} centered size="xl" className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setPreviewModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Invoice Generation Preview</h5>
            <small className="text-muted">
              {monthOptions.find(m => m.value === month)?.label} {year}
            </small>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {periodInvoiceCount > 0 && (
            <div className="alert alert-warning d-flex align-items-center mb-4">
              <FiAlertCircle className="me-2" size={18} />
              Existing invoices were found for this period. Proceeding will regenerate them with current data.
            </div>
          )}

          <Row className="g-3 mb-4">
            <Col md={4}>
              <div className="bg-primary bg-opacity-10 rounded-3 p-4 text-center">
                <FiUsers size={24} className="text-primary mb-2" />
                <div className="text-muted small">Active Leases</div>
                <div className="fs-3 fw-bold">{preview?.summary?.leaseCount || 0}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="bg-warning bg-opacity-10 rounded-3 p-4 text-center">
                <FiRefreshCw size={24} className="text-warning mb-2" />
                <div className="text-muted small">Will Regenerate</div>
                <div className="fs-3 fw-bold">{preview?.summary?.regenerateCount || 0}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="bg-success bg-opacity-10 rounded-3 p-4 text-center">
                <FiDollarSign size={24} className="text-success mb-2" />
                <div className="text-muted small">Projected Total</div>
                <div className="fs-3 fw-bold">{formatCurrency(preview?.summary?.totalAmount || 0)}</div>
              </div>
            </Col>
          </Row>

          <h6 className="mb-3">Invoice Preview</h6>
          <DataTable
            columns={[
              { name: "Lease", grow: 2, cell: (row) => `${row.unitCode || "Unit"} - ${row.tenantName || "-"}` },
              {
                name: "Action",
                cell: (row) => (
                  <Badge color={row.action === "regenerate" ? "warning" : "success"} className="px-3 py-1">
                    {row.action === "regenerate" ? "Update" : "New"}
                  </Badge>
                )
              },
              { name: "Rent", cell: (row) => formatCurrency(row.rentAmount || 0) },
              { name: "Utilities", cell: (row) => formatCurrency(row.summary?.utilitiesSubtotal || 0) },
              { name: "Total", cell: (row) => <span className="fw-bold">{formatCurrency(row.summary?.totalAmount || 0)}</span> },
            ]}
            data={previewRows}
            noHeader
            responsive
            highlightOnHover
          />
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <Button color="light" onClick={() => setPreviewModal(false)}>
            <FiX className="me-1" size={16} /> Cancel
          </Button>
          <Button color="primary" onClick={generateInvoices} disabled={generateLoading}>
            {generateLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <FiCheckCircle className="me-1" size={16} />
                {periodInvoiceCount > 0 ? "Confirm Regeneration" : "Confirm Generation"}
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Invoice Details Modal */}
      <Modal isOpen={detailsModal} toggle={() => setDetailsModal(false)} centered size="xl" className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setDetailsModal(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Invoice Details</h5>
            <small className="text-muted">{selectedInvoice?.invoiceNumber}</small>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          <Row className="g-4">
            <Col md={6}>
              <InvoiceDetailCard title="Tenant Information" icon={FiUsers}>
                <div className="fw-semibold mb-1">{getTenantName(currentLease)}</div>
                <div className="text-muted small">{currentLease?.tenantId?.contact?.primaryPhone || "-"}</div>
                <div className="text-muted small">{currentLease?.tenantId?.contact?.email || "-"}</div>
              </InvoiceDetailCard>
            </Col>
            <Col md={6}>
              <InvoiceDetailCard title="Lease Information" icon={FiFileText}>
                <div className="fw-semibold mb-1">Unit {currentLease?.unitId?.unitNumber || "-"}</div>
                <div className="text-muted small">Lease: {currentLease?.leaseNumber || "-"}</div>
                <div className="text-muted small">
                  Period: {selectedInvoice?.period?.year}-{String(selectedInvoice?.period?.month || "").padStart(2, "0")}
                </div>
              </InvoiceDetailCard>
            </Col>
            <Col md={4}>
              <InvoiceDetailCard title="Rent Amount" icon={FiDollarSign} color="primary">
                <div className="d-flex align-items-baseline gap-1">
                  <span className="fs-5 text-muted">$</span>
                  <span className="display-6 fw-bold text-primary">{Number(selectedInvoice?.items?.rent?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="text-muted small mt-2">Base rent for current period</div>
              </InvoiceDetailCard>
            </Col>
            <Col md={4}>
              <InvoiceDetailCard title="Utilities" icon={FiTrendingUp} color="info">
                <div className="d-flex align-items-baseline gap-1">
                  <span className="fs-5 text-muted">$</span>
                  <span className="display-6 fw-bold text-info">{Number(selectedInvoice?.summary?.utilitiesSubtotal || 0).toLocaleString()}</span>
                </div>
                <div className="text-muted small mt-2">Total utility consumption charges</div>
              </InvoiceDetailCard>
            </Col>
            <Col md={4}>
              <InvoiceDetailCard title="Grand Total" icon={FiCheckCircle} color="success">
                <div className="d-flex align-items-baseline gap-1">
                  <span className="fs-5 text-muted">$</span>
                  <span className="display-6 fw-bold text-success">{Number(selectedInvoice?.summary?.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-success border-opacity-10">
                  <span className="text-muted small">Current Status</span>
                  <Badge color={getStatusColor(selectedInvoice?.status)} className="px-3 py-1 text-uppercase tracking-wider">
                    {selectedInvoice?.status?.replace("_", " ")}
                  </Badge>
                </div>
              </InvoiceDetailCard>
            </Col>
            <Col md={12}>
              <div className="border rounded-3 p-4">
                <div className="d-flex align-items-center mb-3">
                  <FiTrendingUp size={18} className="text-primary me-2" />
                  <h6 className="mb-0 fw-semibold">Utility Breakdown</h6>
                </div>
                {(selectedInvoice?.items?.utilities || []).length ? (
                  <DataTable
                    columns={[
                      { name: "Utility", cell: (row) => <span className="fw-semibold">{row.description || row.type || "-"}</span> },
                      { name: "Consumption", cell: (row) => Number(row.consumption || 0).toLocaleString() },
                      { name: "Rate", cell: (row) => formatCurrency(row.rate || 0) },
                      { name: "Amount", cell: (row) => <span className="fw-semibold">{formatCurrency(row.total || 0)}</span> },
                    ]}
                    data={selectedInvoice?.items?.utilities || []}
                    noHeader
                    responsive
                    highlightOnHover
                  />
                ) : (
                  <div className="text-center py-4 text-muted">
                    <FiTrendingUp size={32} className="mb-2 opacity-50" />
                    <p className="mb-0">No utility charges for this invoice</p>
                  </div>
                )}
              </div>
            </Col>
            {selectedInvoice?.paymentHistory?.length > 0 && (
              <Col md={12}>
                <div className="border rounded-3 p-4">
                  <div className="d-flex align-items-center mb-3">
                    <FiCheckCircle size={18} className="text-success me-2" />
                    <h6 className="mb-0 fw-semibold">Payment History</h6>
                  </div>
                  {selectedInvoice.paymentHistory.map((payment, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold">Payment #{payment.paymentId?.slice(-6)}</div>
                        <small className="text-muted">{formatDate(payment.date)}</small>
                      </div>
                      <div className="fw-bold text-success">{formatCurrency(payment.amount)}</div>
                    </div>
                  ))}
                </div>
              </Col>
            )}
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <Button
            color="primary"
            onClick={async () => {
              if (selectedInvoice) {
                await handleInvoicePdf(selectedInvoice);
              }
            }}
          >
            <FiPrinter className="me-1" size={16} /> Print Invoice
          </Button>
          <Button color="light" onClick={() => setDetailsModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Invoices;
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import DataTable from "react-data-table-component";
// import {
//   Badge,
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   Col,
//   Container,
//   FormGroup,
//   Input,
//   Label,
//   Modal,
//   ModalBody,
//   ModalFooter,
//   ModalHeader,
//   Row,
//   Spinner,
// } from "reactstrap";
// import { createSelector } from "reselect";
// import { useDispatch, useSelector } from "react-redux";
// import { toast, ToastContainer } from "react-toastify";
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import { FinanceAPI } from "../../../helpers/backend_helper";
// import { getInvoices as onGetInvoices, getLeases as onGetLeases } from "../../../slices/thunks";

// const today = new Date();
// const monthOptions = Array.from({ length: 12 }, (_, i) => ({
//   value: String(i + 1),
//   label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
// }));
// const yearOptions = Array.from({ length: 7 }, (_, i) => String(today.getFullYear() - 2 + i));

// const getTenantName = (lease) =>
//   `${lease?.tenantId?.personalInfo?.firstName || ""} ${lease?.tenantId?.personalInfo?.lastName || ""}`.trim() || "Unknown tenant";

// const Invoices = () => {
//   document.title = "Finance - Invoices | Apartment Management";
//   const dispatch = useDispatch();

//   const financeSelector = createSelector(
//     (state) => state.Finance,
//     (s) => ({
//       invoices: s.invoices || [],
//       pagination: s.invoicePagination || {},
//       loading: s.loadingInvoices,
//     }),
//   );
//   const leasesSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
//   const { invoices, pagination, loading } = useSelector(financeSelector);
//   const leases = useSelector(leasesSelector);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [month, setMonth] = useState(String(today.getMonth() + 1));
//   const [year, setYear] = useState(String(today.getFullYear()));
//   const [generateLoading, setGenerateLoading] = useState(false);
//   const [previewLoading, setPreviewLoading] = useState(false);
//   const [previewModal, setPreviewModal] = useState(false);
//   const [preview, setPreview] = useState(null);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [detailsModal, setDetailsModal] = useState(false);
//   const [periodInvoiceCount, setPeriodInvoiceCount] = useState(0);

//   const fetchInvoices = useCallback(() => {
//     dispatch(onGetInvoices({ params: { page: currentPage, limit: 10 } }));
//   }, [currentPage, dispatch]);

//   useEffect(() => {
//     fetchInvoices();
//   }, [fetchInvoices]);

//   useEffect(() => {
//     dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
//   }, [dispatch]);

//   useEffect(() => {
//     const checkPeriod = async () => {
//       try {
//         const res = await FinanceAPI.listInvoices({
//           page: 1,
//           limit: 1,
//           month: Number(month),
//           year: Number(year),
//         });
//         if (res.success) {
//           setPeriodInvoiceCount(res.data?.meta?.total || 0);
//         }
//       } catch (_error) {
//         setPeriodInvoiceCount(0);
//       }
//     };
//     checkPeriod();
//   }, [month, year]);

//   const leaseMap = useMemo(() => {
//     const map = new Map();
//     leases.forEach((lease) => map.set(lease._id, lease));
//     return map;
//   }, [leases]);

//   const openPreview = async () => {
//     setPreviewLoading(true);
//     try {
//       const regenerate = periodInvoiceCount > 0;
//       const res = await FinanceAPI.previewInvoices({
//         month: Number(month),
//         year: Number(year),
//         regenerate,
//       });
//       if (res.success) {
//         setPreview(res.data);
//         setPreviewModal(true);
//       }
//     } finally {
//       setPreviewLoading(false);
//     }
//   };

//   const generateInvoices = async () => {
//     setGenerateLoading(true);
//     try {
//       const regenerate = periodInvoiceCount > 0;
//       const res = await FinanceAPI.generateInvoices({
//         month: Number(month),
//         year: Number(year),
//         regenerate,
//       });
//       if (res.success) {
//         toast.success(regenerate ? "Monthly invoices regenerated successfully." : "Monthly invoices generated successfully.");
//         setPreviewModal(false);
//         fetchInvoices();
//         const periodRes = await FinanceAPI.listInvoices({
//           page: 1,
//           limit: 1,
//           month: Number(month),
//           year: Number(year),
//         });
//         if (periodRes.success) {
//           setPeriodInvoiceCount(periodRes.data?.meta?.total || 0);
//         }
//       }
//     } finally {
//       setGenerateLoading(false);
//     }
//   };

//   const openInvoiceDetails = async (invoiceId) => {
//     const res = await FinanceAPI.getInvoice(invoiceId);
//     if (res.success) {
//       setSelectedInvoice(res.data);
//       setDetailsModal(true);
//     }
//   };

//   const printInvoice = () => {
//     if (!selectedInvoice) return;
//     const lease = leaseMap.get(selectedInvoice.leaseId);
//     const utilityRows = (selectedInvoice.items?.utilities || [])
//       .map(
//         (item) =>
//           `<tr><td>${item.description || item.type || "-"}</td><td>${Number(item.consumption || 0).toLocaleString()}</td><td>${Number(item.rate || 0).toLocaleString()}</td><td>${Number(item.total || 0).toLocaleString()}</td></tr>`,
//       )
//       .join("");
//     const printWindow = window.open("", "_blank", "width=1000,height=750");
//     if (!printWindow) return;
//     printWindow.document.write(`
//       <html>
//         <head><title>${selectedInvoice.invoiceNumber}</title></head>
//         <body style="font-family:Segoe UI, sans-serif;padding:24px">
//           <h2 style="margin-bottom:8px">Invoice ${selectedInvoice.invoiceNumber}</h2>
//           <p>Tenant: ${getTenantName(lease)}</p>
//           <p>Unit: ${lease?.unitId?.unitNumber || "-"}</p>
//           <p>Period: ${selectedInvoice.period?.year}-${String(selectedInvoice.period?.month || "").padStart(2, "0")}</p>
//           <table border="1" cellspacing="0" cellpadding="8" style="width:100%;border-collapse:collapse">
//             <thead><tr><th>Item</th><th>Usage</th><th>Rate</th><th>Amount</th></tr></thead>
//             <tbody>
//               <tr><td>Rent</td><td>-</td><td>-</td><td>${Number(selectedInvoice.items?.rent?.amount || 0).toLocaleString()}</td></tr>
//               ${utilityRows}
//               <tr><td colspan="3"><strong>Total</strong></td><td><strong>${Number(selectedInvoice.summary?.totalAmount || 0).toLocaleString()}</strong></td></tr>
//             </tbody>
//           </table>
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//     printWindow.focus();
//     printWindow.print();
//   };

//   const columns = [
//     {
//       name: "Invoice",
//       grow: 2,
//       cell: (row) => (
//         <div>
//           <div className="fw-semibold">{row.invoiceNumber}</div>
//           <small className="text-muted">
//             {row.period?.year}-{String(row.period?.month || "").padStart(2, "0")}
//           </small>
//         </div>
//       ),
//     },
//     {
//       name: "Lease",
//       grow: 2,
//       cell: (row) => {
//         const lease = leaseMap.get(row.leaseId);
//         return lease ? `${lease.unitId?.unitNumber || "Unit"} - ${getTenantName(lease)}` : "-";
//       },
//     },
//     { name: "Utilities", cell: (row) => `$${Number(row.summary?.utilitiesSubtotal || 0).toLocaleString()}` },
//     { name: "Total", cell: (row) => `$${Number(row.summary?.totalAmount || 0).toLocaleString()}` },
//     { name: "Balance", cell: (row) => `$${Number(row.balance || 0).toLocaleString()}` },
//     {
//       name: "Status",
//       cell: (row) => (
//         <Badge color={row.status === "paid" ? "success" : row.status === "partially_paid" ? "info" : "warning"} className="text-capitalize">
//           {row.status || "-"}
//         </Badge>
//       ),
//     },
//     {
//       name: "Actions",
//       width: "180px",
//       cell: (row) => (
//         <div className="d-flex gap-1">
//           <Button color="outline-info" size="sm" onClick={() => openInvoiceDetails(row._id)}>
//             View
//           </Button>
//           <Button
//             color="outline-primary"
//             size="sm"
//             onClick={async () => {
//               const res = await FinanceAPI.invoicePdf(row._id);
//               if (res.success && res.data?.downloadUrl) {
//                 window.open(res.data.downloadUrl, "_blank");
//               }
//             }}
//           >
//             Print
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   const previewRows = preview?.invoices || [];
//   const currentLease = selectedInvoice ? leaseMap.get(selectedInvoice.leaseId) : null;

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Invoices" pageTitle="Finance" />

//         <Card className="mb-4">
//           <CardBody>
//             <Row className="g-3 align-items-end">
//               <Col md={4}>
//                 <FormGroup className="mb-0">
//                   <Label className="form-label">Billing Month</Label>
//                   <Input type="select" value={month} onChange={(e) => setMonth(e.target.value)}>
//                     {monthOptions.map((item) => (
//                       <option key={item.value} value={item.value}>
//                         {item.label}
//                       </option>
//                     ))}
//                   </Input>
//                 </FormGroup>
//               </Col>
//               <Col md={4}>
//                 <FormGroup className="mb-0">
//                   <Label className="form-label">Billing Year</Label>
//                   <Input type="select" value={year} onChange={(e) => setYear(e.target.value)}>
//                     {yearOptions.map((item) => (
//                       <option key={item} value={item}>
//                         {item}
//                       </option>
//                     ))}
//                   </Input>
//                 </FormGroup>
//               </Col>
//               <Col md={4}>
//                 <Button color="primary" className="w-100 mb-3" onClick={openPreview} disabled={previewLoading}>
//                   {previewLoading ? (
//                     <>
//                       <Spinner size="sm" className="me-2" />
//                       Loading Preview...
//                     </>
//                   ) : periodInvoiceCount > 0 ? (
//                     "Regenerate Monthly Invoices"
//                   ) : (
//                     "Generate Monthly Invoices"
//                   )}
//                 </Button>
//               </Col>
//             </Row>
//           </CardBody>
//         </Card>

//         <Card>
//           <CardHeader className="bg-light">
//             <h5 className="card-title mb-0">Invoice List</h5>
//           </CardHeader>
//           <CardBody>
//             <DataTable
//               columns={columns}
//               data={invoices}
//               progressPending={loading}
//               pagination
//               paginationServer
//               paginationTotalRows={pagination?.total || 0}
//               paginationPerPage={pagination?.limit || 10}
//               paginationDefaultPage={currentPage}
//               onChangePage={(page) => setCurrentPage(page)}
//               responsive
//             />
//           </CardBody>
//         </Card>
//       </Container>

//       <Modal isOpen={previewModal} toggle={() => setPreviewModal(false)} centered size="xl">
//         <ModalHeader toggle={() => setPreviewModal(false)} className="bg-light">
//           Invoice Generation Preview
//         </ModalHeader>
//         <ModalBody>
//           {periodInvoiceCount > 0 ? (
//             <div className="alert alert-warning mb-4">
//               Existing invoices were found for this period. Only current invoice data and utility edits will be previewed and regenerated after confirmation.
//             </div>
//           ) : null}
//           <Row className="g-3 mb-3">
//             <Col md={4}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Active leases</div>
//                 <div className="fs-4 fw-semibold">{preview?.summary?.leaseCount || 0}</div>
//               </div>
//             </Col>
//             <Col md={4}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Will regenerate</div>
//                 <div className="fs-4 fw-semibold">{preview?.summary?.regenerateCount || 0}</div>
//               </div>
//             </Col>
//             <Col md={4}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small">Projected total</div>
//                 <div className="fs-4 fw-semibold">${Number(preview?.summary?.totalAmount || 0).toLocaleString()}</div>
//               </div>
//             </Col>
//           </Row>
//           <DataTable
//             columns={[
//               { name: "Lease", grow: 2, cell: (row) => `${row.unitCode || "Unit"} - ${row.tenantName || "-"}` },
//               { name: "Action", cell: (row) => <Badge color={row.action === "regenerate" ? "warning" : "success"}>{row.action}</Badge> },
//               { name: "Rent", cell: (row) => `$${Number(row.rentAmount || 0).toLocaleString()}` },
//               { name: "Utilities", cell: (row) => `$${Number(row.summary?.utilitiesSubtotal || 0).toLocaleString()}` },
//               { name: "Total", cell: (row) => `$${Number(row.summary?.totalAmount || 0).toLocaleString()}` },
//             ]}
//             data={previewRows}
//             noHeader
//             responsive
//           />
//         </ModalBody>
//         <ModalFooter className="bg-light">
//           <Button color="light" onClick={() => setPreviewModal(false)}>
//             Cancel
//           </Button>
//           <Button color="primary" onClick={generateInvoices} disabled={generateLoading}>
//             {generateLoading ? "Saving..." : periodInvoiceCount > 0 ? "Confirm Regeneration" : "Confirm Generation"}
//           </Button>
//         </ModalFooter>
//       </Modal>

//       <Modal isOpen={detailsModal} toggle={() => setDetailsModal(false)} centered size="lg">
//         <ModalHeader toggle={() => setDetailsModal(false)} className="bg-light">
//           Invoice Details
//         </ModalHeader>
//         <ModalBody>
//           <Row className="g-4">
//             <Col md={6}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small mb-2">Tenant Info</div>
//                 <div className="fw-semibold">{getTenantName(currentLease)}</div>
//                 <div>{currentLease?.tenantId?.contact?.primaryPhone || "-"}</div>
//               </div>
//             </Col>
//             <Col md={6}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small mb-2">Lease Info</div>
//                 <div className="fw-semibold">{currentLease?.leaseNumber || "-"}</div>
//                 <div>{currentLease?.unitId?.unitNumber || "-"}</div>
//               </div>
//             </Col>
//             <Col md={4}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small mb-1">Rent Amount</div>
//                 <div className="fw-semibold">${Number(selectedInvoice?.items?.rent?.amount || 0).toLocaleString()}</div>
//               </div>
//             </Col>
//             <Col md={8}>
//               <div className="border rounded p-3 h-100">
//                 <div className="text-muted small mb-1">Total</div>
//                 <div className="fw-semibold">${Number(selectedInvoice?.summary?.totalAmount || 0).toLocaleString()}</div>
//               </div>
//             </Col>
//             <Col md={12}>
//               <div className="border rounded p-3">
//                 <div className="text-muted small mb-3">Utility Breakdown</div>
//                 {(selectedInvoice?.items?.utilities || []).length ? (
//                   <DataTable
//                     columns={[
//                       { name: "Utility", cell: (row) => row.description || row.type || "-" },
//                       { name: "Usage", cell: (row) => Number(row.consumption || 0).toLocaleString() },
//                       { name: "Rate", cell: (row) => `$${Number(row.rate || 0).toLocaleString()}` },
//                       { name: "Amount", cell: (row) => `$${Number(row.total || 0).toLocaleString()}` },
//                     ]}
//                     data={selectedInvoice?.items?.utilities || []}
//                     noHeader
//                     responsive
//                   />
//                 ) : (
//                   <div className="text-muted">No utility lines for this invoice.</div>
//                 )}
//               </div>
//             </Col>
//           </Row>
//         </ModalBody>
//         <ModalFooter className="bg-light">
//           <Button color="primary" onClick={printInvoice}>
//             Print
//           </Button>
//           <Button color="light" onClick={() => setDetailsModal(false)}>
//             Close
//           </Button>
//         </ModalFooter>
//       </Modal>
//       <ToastContainer />
//     </div>
//   );
// };

// export default Invoices;
