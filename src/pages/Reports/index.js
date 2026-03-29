import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../Components/Common/AppDataTable";
import Select from "../../Components/Common/AppSelect";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
  TabContent,
  TabPane,
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import {
  FiBarChart2,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiPrinter,
  FiRefreshCw,
} from "react-icons/fi";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../helpers/backend_helper";
import { getBuildings as onGetBuildings, getLeases as onGetLeases } from "../../slices/thunks";
import {
  downloadGenericReportPdf,
  exportGenericRowsExcel,
  printGenericReport,
} from "../../utils/financeDocuments";

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
  }),
};

const reportOptions = [
  { value: "utility-bills", label: "Utility Bills Report", api: ReportsAPI.utilityBills },
  { value: "invoices", label: "Invoice Report", api: ReportsAPI.invoices },
  { value: "payments", label: "Payment Report", api: ReportsAPI.payments },
  { value: "expenses", label: "Expense Report", api: ReportsAPI.expenses },
  { value: "general-finance", label: "General Finance Report", api: ReportsAPI.generalFinance },
  { value: "tenant-balances", label: "Tenant Balance Report", api: ReportsAPI.tenantBalances },
  { value: "tenant-history", label: "Tenant Invoice & Payments History", api: ReportsAPI.tenantHistory },
];

const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString()}`;
const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const buildColumnName = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (text) => text.toUpperCase());

const flattenValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return Number.isFinite(value) ? value : "-";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object") {
    if (value.fullName) return value.fullName;
    if (value.name) return value.name;
    if (value.invoiceNumber) return value.invoiceNumber;
    if (value.leaseNumber) return value.leaseNumber;
    if (value.unitNumber) return value.unitNumber;
    if (value.period) return value.period;
    return JSON.stringify(value);
  }
  return String(value);
};

const normalizeRows = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.details)) return payload.details;
  if (payload.details?.invoices || payload.details?.payments || payload.details?.expenses) {
    return [
      ...(payload.details?.invoices || []).map((item) => ({ section: "Invoice", ...item })),
      ...(payload.details?.payments || []).map((item) => ({ section: "Payment", ...item })),
      ...(payload.details?.expenses || []).map((item) => ({ section: "Expense", ...item })),
      ...(payload.details?.income || []).map((item) => ({ section: "Income", ...item })),
    ];
  }
  if (payload.details && typeof payload.details === "object") {
    return Object.entries(payload.details).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((item) => ({ section: key, ...item })) : [],
    );
  }
  return [];
};

const Reports = () => {
  document.title = "Reports | Apartment Management";
  const dispatch = useDispatch();

  const buildingsSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
  const leasesSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const buildings = useSelector(buildingsSelector);
  const leases = useSelector(leasesSelector);

  const today = new Date();
  const [reportType, setReportType] = useState("general-finance");
  const [billingMonth, setBillingMonth] = useState(String(today.getMonth() + 1));
  const [billingYear, setBillingYear] = useState(String(today.getFullYear()));
  const [dateFrom, setDateFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]);
  const [leaseId, setLeaseId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
    dispatch(onGetLeases({ params: { page: 1, limit: 100 } }));
  }, [dispatch]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
      })),
    [],
  );
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const value = String(today.getFullYear() - 2 + i);
        return { value, label: value };
      }),
    [today],
  );
  const buildingOptions = useMemo(
    () => [{ value: "", label: "All buildings" }, ...buildings.map((item) => ({ value: item._id, label: `${item.name}${item.code ? ` (${item.code})` : ""}` }))],
    [buildings],
  );
  const leaseOptions = useMemo(
    () => [{ value: "", label: "All leases" }, ...leases.map((item) => ({ value: item._id, label: `${item.unitId?.unitNumber || "Unit"} - ${item.leaseNumber}` }))],
    [leases],
  );

  const selectedReport = reportOptions.find((item) => item.value === reportType) || reportOptions[0];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        billingMonth: billingMonth ? Number(billingMonth) : undefined,
        billingYear: billingYear ? Number(billingYear) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        leaseId: leaseId || undefined,
        buildingId: buildingId || undefined,
      };

      const response = await selectedReport.api(payload);
      if (response.success) {
        setReportData(response.data);
      }
    } finally {
      setLoading(false);
    }
  }, [billingMonth, billingYear, buildingId, dateFrom, dateTo, leaseId, selectedReport]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const detailRows = useMemo(() => normalizeRows(reportData), [reportData]);
  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return detailRows;
    return detailRows.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword));
  }, [detailRows, searchText]);

  const columns = useMemo(() => {
    const sample = filteredRows[0];
    if (!sample) return [];
    return Object.keys(sample)
      .slice(0, 8)
      .map((key) => ({
        name: buildColumnName(key),
        selector: (row) => flattenValue(row[key]),
        grow: 1.2,
        cell: (row) => <span>{String(flattenValue(row[key]))}</span>,
      }));
  }, [filteredRows]);

  const summaryRows = useMemo(() => {
    const source = reportData?.summary || {};
    return Object.entries(source).map(([key, value]) => ({
      label: buildColumnName(key),
      value: typeof value === "number" ? formatCurrency(value) : Array.isArray(value) ? value.length : String(flattenValue(value)),
    }));
  }, [reportData]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((row) =>
        Object.fromEntries(Object.entries(row).slice(0, 10).map(([key, value]) => [buildColumnName(key), flattenValue(value)])),
      ),
    [filteredRows],
  );

  const handleExcelExport = () => {
    if (activeTab === "summary") {
      exportGenericRowsExcel({
        fileName: `${reportType}-summary`,
        rows: summaryRows.map((item) => ({
          Metric: item.label,
          Value: item.value,
        })),
      });
      return;
    }

    exportGenericRowsExcel({
      fileName: `${reportType}-details`,
      rows: exportRows,
    });
  };

  const handlePdfExport = () =>
    downloadGenericReportPdf({
      title: `${selectedReport.label} ${activeTab === "summary" ? "Summary" : "Details"}`,
      summaryRows: activeTab === "summary" ? summaryRows : [{ label: "Rows", value: String(filteredRows.length) }],
      detailRows:
        activeTab === "summary"
          ? summaryRows.map((item) => `${item.label}: ${item.value}`)
          : exportRows.map((row) => Object.values(row).join(" | ")),
    });

  const handlePrint = () =>
    printGenericReport({
      title: `${selectedReport.label} ${activeTab === "summary" ? "Summary" : "Details"}`,
      summaryRows: activeTab === "summary" ? summaryRows : [{ label: "Rows", value: String(filteredRows.length) }],
      tableRows:
        activeTab === "summary"
          ? summaryRows.map((item) => ({
              Metric: item.label,
              Value: item.value,
            }))
          : exportRows,
    });

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Reports" pageTitle="Reports" />

        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <FiBarChart2 size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1">Reports Module</h4>
                    <p className="text-muted mb-0">Standalone ERP-style reporting across utility bills, invoices, payments, expenses, and tenant ledgers</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
                  <Button color="success" onClick={handleExcelExport}>
                    <FiFileText className="me-1" size={16} /> Excel
                  </Button>
                  <Button color="primary" onClick={handlePdfExport}>
                    <FiDownload className="me-1" size={16} /> PDF
                  </Button>
                  <Button color="light" onClick={handlePrint}>
                    <FiPrinter className="me-1" size={16} /> Print
                  </Button>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="g-3">
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Report Type</Label>
                <Select
                  options={reportOptions}
                  value={selectedReport}
                  onChange={(option) => setReportType(option?.value || "general-finance")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Billing Month</Label>
                <Select
                  options={monthOptions}
                  value={monthOptions.find((item) => item.value === billingMonth) || null}
                  onChange={(option) => setBillingMonth(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={2} md={6}>
                <Label className="form-label text-muted small mb-1">Billing Year</Label>
                <Select
                  options={yearOptions}
                  value={yearOptions.find((item) => item.value === billingYear) || null}
                  onChange={(option) => setBillingYear(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={2} md={6}>
                <Label className="form-label text-muted small mb-1">Building</Label>
                <Select
                  options={buildingOptions}
                  value={buildingOptions.find((item) => item.value === buildingId) || buildingOptions[0]}
                  onChange={(option) => setBuildingId(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={2} md={6}>
                <Label className="form-label text-muted small mb-1">Lease</Label>
                <Select
                  options={leaseOptions}
                  value={leaseOptions.find((item) => item.value === leaseId) || leaseOptions[0]}
                  onChange={(option) => setLeaseId(option?.value || "")}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Date From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Col>
              <Col lg={3} md={6}>
                <Label className="form-label text-muted small mb-1">Date To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Col>
              <Col lg={4} md={6}>
                <Label className="form-label text-muted small mb-1">Search Details</Label>
                <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search within report rows..." />
              </Col>
              <Col lg={2} md={6} className="d-flex align-items-end">
                <Button color="outline-primary" onClick={fetchReport} className="w-100">
                  <FiRefreshCw className="me-1" size={16} /> Refresh
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="p-5 text-center">
              <Spinner color="primary" />
            </CardBody>
          </Card>
        ) : (
          <>
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-white border-0 pt-4 px-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{selectedReport.label}</h5>
                  <Badge color="light" className="px-3 py-2 text-primary">
                    {activeTab === "summary" ? `Metrics: ${summaryRows.length}` : `Rows: ${filteredRows.length}`}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="px-4 pt-4">
                  <Nav tabs className="border-0">
                    <NavItem>
                      <NavLink
                        href="#"
                        className={activeTab === "summary" ? "active fw-semibold" : "text-muted"}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("summary");
                        }}
                      >
                        Summary
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        href="#"
                        className={activeTab === "details" ? "active fw-semibold" : "text-muted"}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("details");
                        }}
                      >
                        Details
                      </NavLink>
                    </NavItem>
                  </Nav>
                </div>
                <TabContent activeTab={activeTab}>
                  <TabPane tabId="summary">
                    <div className="p-4">
                      <Row>
                        {summaryRows.map((item) => (
                          <Col lg={3} md={6} className="mb-3" key={item.label}>
                            <Card className="border shadow-sm h-100 mb-0">
                              <CardBody className="p-4">
                                <div className="text-muted small mb-2">{item.label}</div>
                                <div className="fw-bold fs-4">{item.value}</div>
                              </CardBody>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </TabPane>
                  <TabPane tabId="details">
                    <DataTable
                      columns={columns}
                      data={filteredRows}
                      pagination
                      responsive
                      highlightOnHover
                      pointerOnHover
                      className="border-0"
                    />
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
};

export default Reports;
