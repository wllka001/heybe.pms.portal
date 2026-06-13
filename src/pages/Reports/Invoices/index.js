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
    Input,
    Label,
    Row,
    Spinner,
    UncontrolledTooltip,
} from "reactstrap";
import {
    FiFileText,
    FiDownload,
    FiPrinter,
    FiRefreshCw,
    FiDollarSign,
    FiTrendingUp,
    FiPieChart,
    FiBarChart2,
    FiUsers,
    FiCalendar,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiActivity,
    FiZap,
} from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../../helpers/backend_helper";
import { getBuildings as onGetBuildings, getLeases as onGetLeases } from "../../../slices/thunks";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

const selectStyles = {
    control: (base) => ({
        ...base,
        borderRadius: "0.5rem",
        borderColor: "#e2e8f0",
        boxShadow: "none",
        "&:hover": {
            borderColor: "#3b82f6",
        },
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

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case "paid":
            return "success";
        case "overdue":
            return "danger";
        case "partially_paid":
            return "warning";
        default:
            return "info";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case "paid":
            return <FiCheckCircle size={12} />;
        case "overdue":
            return <FiAlertCircle size={12} />;
        case "partially_paid":
            return <FiClock size={12} />;
        default:
            return <FiActivity size={12} />;
    }
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, subtitle, trend }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
                    <Icon size={24} className={`text-${color}`} />
                </div>
                {trend && (
                    <Badge color="light" className="px-2 py-1">
                        {trend}
                    </Badge>
                )}
            </div>
            <h3 className="mb-1 fw-bold">{value}</h3>
            <p className="text-muted mb-0 small">{title}</p>
            {subtitle && <small className="text-muted">{subtitle}</small>}
        </CardBody>
    </Card>
);

const InvoiceReport = () => {
    document.title = "Invoice Report | Degaanly";
    const dispatch = useDispatch();

    const buildingsSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
    const leasesSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
    const buildings = useSelector(buildingsSelector);
    const leases = useSelector(leasesSelector);

    const today = new Date();
    const [billingMonth, setBillingMonth] = useState(String(today.getMonth() + 1));
    const [billingYear, setBillingYear] = useState(String(today.getFullYear()));
    const [leaseId, setLeaseId] = useState("");
    const [buildingId, setBuildingId] = useState("");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

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
        []
    );

    const yearOptions = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => {
                const value = String(today.getFullYear() - 2 + i);
                return { value, label: value };
            }),
        [today]
    );

    const buildingOptions = useMemo(
        () => [
            { value: "", label: "All Buildings" },
            ...buildings.map((item) => ({ value: item._id, label: `${item.name}${item.code ? ` (${item.code})` : ""}` })),
        ],
        [buildings]
    );

    const leaseOptions = useMemo(
        () => [
            { value: "", label: "All Leases" },
            ...leases.map((item) => ({
                value: item._id,
                label: `${item.unitId?.unitNumber || "Unit"} - ${item.leaseNumber}`,
            })),
        ],
        [leases]
    );

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const payload = {
                billingMonth: billingMonth ? Number(billingMonth) : undefined,
                billingYear: billingYear ? Number(billingYear) : undefined,
                leaseId: leaseId || undefined,
                buildingId: buildingId || undefined,
            };

            const response = await ReportsAPI.invoices(payload);
            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, [billingMonth, billingYear, buildingId, leaseId]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);



    const filteredRows = useMemo(() => {
        if (!reportData?.details) return [];
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return reportData.details;
        return reportData.details.filter((row) =>
            JSON.stringify(row).toLowerCase().includes(keyword)
        );
    }, [reportData, searchText]);

    const exportRows = useMemo(() => {
        return filteredRows.map((row) => ({
            "Invoice Number": row.invoiceNumber,
            "Tenant Name": row.tenant?.fullName || "-",
            "Unit Number": row.unit?.unitNumber || "-",
            "Building": row.building?.name || "-",
            "Period": `${row.period?.month}/${row.period?.year}`,
            "Due Date": formatDate(row.period?.dueDate),
            "Rent Amount": row.rentAmount,
            "Utility Amount": row.utilityAmount,
            "Additional Charges": row.additionalAmount || 0,
            "Tax Total": row.taxTotal || 0,
            "Total Amount": row.totalAmount,
            "Paid Amount": row.paidAmount,
            "Balance": row.balance,
            "Status": row.status?.toUpperCase() || "PENDING",
            "Utilities Count": row.utilityBreakdown?.length || 0,
            "Payment Count": row.paymentHistory?.length || 0,
            "Created Date": formatDate(row.createdAt),
        }));
    }, [filteredRows]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summary = reportData?.summary || {};
        const summaryHtml = `
      <div style="max-width: 500px; margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Report Summary</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Invoices</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${summary.totalInvoicesGenerated || 0}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Grand Total</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #3b82f6;">${formatCurrency(summary.grandTotalInvoiced)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Paid</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalPaid)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Outstanding</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #ef4444;">${formatCurrency(summary.totalOutstanding)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

        const totalAmount = filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
        const totalPaid = filteredRows.reduce((sum, row) => sum + (row.paidAmount || 0), 0);
        const totalBalance = filteredRows.reduce((sum, row) => sum + (row.balance || 0), 0);
        const totalUtilities = filteredRows.reduce((sum, row) => sum + (row.utilityAmount || 0), 0);

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">SQN</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Invoice #</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Tenant</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Total Amount</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Paid</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Balance</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Utilities</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                ${row.invoiceNumber}<br/>
                <small>Due: ${formatDate(row.period?.dueDate)}</small>
              </td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                ${row.tenant?.fullName || "-"}<br/>
                <small>Unit ${row.unit?.unitNumber || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; color: #3b82f6;">${formatCurrency(row.totalAmount)}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #10b981;">${formatCurrency(row.paidAmount)}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; ${row.balance > 0 ? 'color: #ef4444; font-weight: bold;' : 'color: #10b981;'}">${formatCurrency(row.balance)}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">${formatCurrency(row.utilityAmount)}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">
                <span style="background: ${row.status === 'paid' ? '#d4edda' : row.status === 'overdue' ? '#f8d7da' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.status?.toUpperCase() || "PENDING"}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Total:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #3b82f6;">${formatCurrency(totalAmount)}</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #10b981;">${formatCurrency(totalPaid)}</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #ef4444;">${formatCurrency(totalBalance)}</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">${formatCurrency(totalUtilities)}</td>
            <td style="border: 1px solid #cbd5e1;"></td>
          </tr>
        </tfoot>
      </table>
    `;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice Report - ${monthOptions.find(m => m.value === billingMonth)?.label} ${billingYear}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              padding: 40px;
              max-width: 1400px;
              margin: 0 auto;
              color: #1e293b;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 8px;
              color: #0f172a;
            }
            .header {
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #cbd5e1;
            }
            .date {
              color: #64748b;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 20px;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice Report</h1>
            <div class="date">Period: ${monthOptions.find(m => m.value === billingMonth)?.label} ${billingYear}</div>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          ${summaryHtml}
          ${tableHtml}
          <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 12px;">
            Generated by Degaanly System
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const exportToExcel = () => {
        import("xlsx").then((XLSX) => {
            const worksheet = XLSX.utils.json_to_sheet(exportRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Report");
            XLSX.writeFile(workbook, `invoice_report_${billingYear}_${billingMonth}.xlsx`);
        });
    };

    const summary = reportData?.summary;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Invoice Report" pageTitle="Reports" />

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
                                        <h4 className="mb-1">Invoice Report</h4>
                                        <p className="text-muted mb-0">
                                            Comprehensive analysis of invoices, payments, and outstanding balances
                                        </p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
                                    <Button color="success" onClick={exportToExcel} id="excelBtn">
                                        <FiFileText className="me-1" size={16} /> Excel
                                    </Button>
                                    <UncontrolledTooltip target="excelBtn">Export to Excel</UncontrolledTooltip>
                                    <Button color="light" onClick={printReport} id="printBtn">
                                        <FiPrinter className="me-1" size={16} /> Print
                                    </Button>
                                    <UncontrolledTooltip target="printBtn">Print Report</UncontrolledTooltip>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Filters Card */}
                <Card className="mb-4 border-0 shadow-sm">
                    <CardBody className="p-4">
                        <Row className="g-3">
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
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Building</Label>
                                <Select
                                    options={buildingOptions}
                                    value={buildingOptions.find((item) => item.value === buildingId) || buildingOptions[0]}
                                    onChange={(option) => setBuildingId(option?.value || "")}
                                    classNamePrefix="select"
                                    styles={selectStyles}
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Lease</Label>
                                <Select
                                    options={leaseOptions}
                                    value={leaseOptions.find((item) => item.value === leaseId) || leaseOptions[0]}
                                    onChange={(option) => setLeaseId(option?.value || "")}
                                    classNamePrefix="select"
                                    styles={selectStyles}
                                />
                            </Col>
                            <Col lg={1} md={6} className="d-flex align-items-end">
                                <Button color="primary" onClick={fetchReport} className="w-100">
                                    <FiRefreshCw size={16} />
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
                ) : reportData ? (
                    <>
                        {/* Summary Table */}
                        <Row className="mb-4">
                            <Col md={6} className="mb-3">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardBody className="p-4">
                                        <h5 className="mb-3">Report Summary</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered mb-0" style={{ borderColor: "#cbd5e1" }}>
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Invoices</td>
                                                        <td className="fw-bold" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{summary?.totalInvoicesGenerated || 0}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Grand Total</td>
                                                        <td className="fw-bold text-primary" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.grandTotalInvoiced || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Paid</td>
                                                        <td className="fw-bold text-success" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.totalPaid || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Outstanding</td>
                                                        <td className="fw-bold text-danger" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.totalOutstanding || 0)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Search and Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <h5 className="mb-0">Invoice Details</h5>
                                    <div style={{ width: "300px" }}>
                                        <Input
                                            type="text"
                                            placeholder="Search by invoice, tenant, unit..."
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="table-responsive px-4 pb-4">
                                    <table className="table table-bordered align-middle mb-0" style={{ borderColor: "#cbd5e1" }}>
                                        <thead className="table-light">
                                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #cbd5e1" }}>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1", width: "70px", textAlign: "center" }}>SQN</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Invoice</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Tenant/Unit</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Amount</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Paid</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Balance</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Status</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Utilities</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRows.length > 0 ? (
                                                filteredRows.map((row, rowIdx) => (
                                                    <tr key={row._id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>{rowIdx + 1}</td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold mb-1">{row.invoiceNumber}</div>
                                                            <small className="text-muted">Due: {formatDate(row.period?.dueDate)}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold">{row.tenant?.fullName || "-"}</div>
                                                            <small className="text-muted">Unit {row.unit?.unitNumber || "-"}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-bold text-primary">{formatCurrency(row.totalAmount)}</div>
                                                            <small className="text-muted">Rent: {formatCurrency(row.rentAmount)}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold text-success">{formatCurrency(row.paidAmount)}</div>
                                                            <small className="text-muted">{row.paymentHistory?.length || 0} payments</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className={`fw-bold ${row.balance > 0 ? "text-danger" : "text-success"}`}>
                                                                {formatCurrency(row.balance)}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <Badge
                                                                color={getStatusColor(row.status)}
                                                                className="d-inline-flex align-items-center gap-1 px-3 py-2"
                                                            >
                                                                {getStatusIcon(row.status)}
                                                                <span className="ms-1 text-capitalize">{row.status?.replace("_", " ") || "Pending"}</span>
                                                            </Badge>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            {row.utilityBreakdown?.length > 0 ? (
                                                                <>
                                                                    <div className="fw-semibold">{formatCurrency(row.utilityAmount)}</div>
                                                                    <small className="text-muted">{row.utilityBreakdown.length} items</small>
                                                                </>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center p-4 text-muted" style={{ border: "1px solid #cbd5e1" }}>
                                                        No records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot style={{ borderTop: "2px solid #64748b" }}>
                                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                <td colSpan="3" className="text-end fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>Total:</td>
                                                <td className="fw-bold text-primary" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0))}
                                                </td>
                                                <td className="fw-bold text-success" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.paidAmount || 0), 0))}
                                                </td>
                                                <td className="fw-bold text-danger" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.balance || 0), 0))}
                                                </td>
                                                <td style={{ border: "1px solid #cbd5e1" }}></td>
                                                <td className="fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.utilityAmount || 0), 0))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </>
                ) : null}
            </Container>
        </div>
    );
};

export default InvoiceReport;
