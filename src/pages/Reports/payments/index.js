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
    FiCreditCard,
    FiThumbsUp,
    FiThumbsDown,
    FiRotateCcw,
    FiXCircle,
} from "react-icons/fi";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from "chart.js";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../../helpers/backend_helper";
import { getBuildings as onGetBuildings, getLeases as onGetLeases } from "../../../slices/thunks";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

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

const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
        case "evc":
            return <FiCreditCard size={14} className="text-primary" />;
        case "merchant":
            return <FiUsers size={14} className="text-success" />;
        case "bank":
            return <FiFileText size={14} className="text-info" />;
        default:
            return <FiActivity size={14} className="text-muted" />;
    }
};

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case "reconciled":
            return "success";
        case "verified":
            return "info";
        case "recorded":
            return "primary";
        case "rejected":
            return "danger";
        case "reversed":
            return "warning";
        default:
            return "secondary";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case "reconciled":
            return <FiThumbsUp size={12} />;
        case "verified":
            return <FiCheckCircle size={12} />;
        case "recorded":
            return <FiClock size={12} />;
        case "rejected":
            return <FiThumbsDown size={12} />;
        case "reversed":
            return <FiRotateCcw size={12} />;
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

const PaymentReport = () => {
    document.title = "Payment Report | Apartment Management";
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

            const response = await ReportsAPI.payments(payload);
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

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const statusAmounts = {
            reconciled: 0,
            verified: 0,
            recorded: 0,
            rejected: 0,
            reversed: 0,
        };
        const statusCounts = {
            reconciled: 0,
            verified: 0,
            recorded: 0,
            rejected: 0,
            reversed: 0,
        };
        const methodTotals = {};
        const dailyTotals = {};
        const tenantTotals = {};

        reportData.details.forEach((payment) => {
            const status = payment.lifecycle?.status?.toLowerCase() || "recorded";
            statusAmounts[status] = (statusAmounts[status] || 0) + (payment.amount || 0);
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            const method = payment.method?.toLowerCase() || "other";
            methodTotals[method] = (methodTotals[method] || 0) + (payment.amount || 0);

            const date = new Date(payment.paymentDate);
            const dayKey = date.toISOString().split("T")[0];
            dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + (payment.amount || 0);

            const tenantName = payment.tenant?.fullName || "Unknown";
            tenantTotals[tenantName] = (tenantTotals[tenantName] || 0) + (payment.amount || 0);
        });

        // Sort daily totals by date
        const sortedDays = Object.keys(dailyTotals).sort();
        const dailyData = sortedDays.map(day => ({
            date: formatDate(day),
            amount: dailyTotals[day]
        }));

        return {
            statusAmounts,
            statusCounts,
            methodTotals,
            dailyData,
            tenantTotals: Object.entries(tenantTotals).slice(0, 10),
        };
    }, [reportData]);

    // Status Distribution Pie Chart
    const statusPieData = {
        labels: Object.keys(chartData?.statusAmounts || {}).map(
            (key) => key.toUpperCase()
        ),
        datasets: [
            {
                data: Object.values(chartData?.statusAmounts || {}),
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
                borderWidth: 0,
            },
        ],
    };

    // Payment Method Pie Chart
    const methodPieData = {
        labels: Object.keys(chartData?.methodTotals || {}).map(
            (key) => key.toUpperCase()
        ),
        datasets: [
            {
                data: Object.values(chartData?.methodTotals || {}),
                backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
                borderWidth: 0,
            },
        ],
    };

    // Daily Payment Trend Line Chart
    const dailyLineData = {
        labels: chartData?.dailyData.map(d => d.date) || [],
        datasets: [
            {
                label: "Daily Payment Amount ($)",
                data: chartData?.dailyData.map(d => d.amount) || [],
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#3b82f6",
            },
        ],
    };

    // Top Tenants Bar Chart
    const tenantBarData = {
        labels: chartData?.tenantTotals.map(([name]) => name.split(" ")[0]) || [],
        datasets: [
            {
                label: "Total Payments ($)",
                data: chartData?.tenantTotals.map(([, amount]) => amount) || [],
                backgroundColor: "rgba(16, 185, 129, 0.8)",
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    usePointStyle: true,
                    boxWidth: 10,
                },
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || "";
                        if (label) label += ": ";
                        if (context.parsed.y !== undefined) {
                            label += formatCurrency(context.parsed.y);
                        } else {
                            label += formatCurrency(context.parsed);
                        }
                        return label;
                    },
                },
            },
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                },
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    const columns = [
        {
            name: "Payment",
            cell: (row) => (
                <div>
                    <div className="fw-semibold mb-1">{row.paymentNumber}</div>
                    <small className="text-muted">{formatDate(row.paymentDate)}</small>
                </div>
            ),
        },
        {
            name: "Tenant/Unit",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.tenant?.fullName || "-"}</div>
                    <small className="text-muted">Unit {row.unit?.unitNumber || "-"}</small>
                </div>
            ),
        },
        {
            name: "Invoice",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.invoice?.invoiceNumber || "-"}</div>
                    <small className="text-muted">{formatCurrency(row.invoice?.totalAmount)}</small>
                </div>
            ),
        },
        {
            name: "Amount",
            cell: (row) => (
                <div className="fw-bold text-success">{formatCurrency(row.amount)}</div>
            ),
        },
        {
            name: "Method",
            cell: (row) => (
                <div className="d-flex align-items-center gap-2">
                    {getMethodIcon(row.method)}
                    <span className="text-capitalize">{row.method}</span>
                    <small className="text-muted">{row.methodDetails?.evc?.referenceNumber || row.methodDetails?.bank?.transactionId || ""}</small>
                </div>
            ),
        },
        {
            name: "Status",
            cell: (row) => (
                <Badge
                    color={getStatusColor(row.lifecycle?.status)}
                    className="d-inline-flex align-items-center gap-1 px-3 py-2"
                >
                    {getStatusIcon(row.lifecycle?.status)}
                    <span className="ms-1 text-capitalize">{row.lifecycle?.status || "Recorded"}</span>
                </Badge>
            ),
        },
        {
            name: "Allocation",
            cell: (row) => (
                <div>
                    {row.allocation?.map((alloc, idx) => (
                        <div key={idx} className="small">
                            {alloc.itemType}: {formatCurrency(alloc.amount)}
                        </div>
                    ))}
                </div>
            ),
        },
    ];

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
            "Payment Number": row.paymentNumber,
            "Payment Date": formatDate(row.paymentDate),
            "Tenant Name": row.tenant?.fullName || "-",
            "Unit Number": row.unit?.unitNumber || "-",
            "Building": row.building?.name || "-",
            "Invoice Number": row.invoice?.invoiceNumber || "-",
            "Invoice Total": row.invoice?.totalAmount || 0,
            "Payment Amount": row.amount,
            "Payment Method": row.method?.toUpperCase() || "-",
            "Reference Number": row.methodDetails?.evc?.referenceNumber ||
                row.methodDetails?.bank?.transactionId ||
                row.methodDetails?.merchant?.referenceNumber || "-",
            "Status": row.lifecycle?.status?.toUpperCase() || "RECORDED",
            "Allocation": row.allocation?.map(a => `${a.itemType}: ${a.amount}`).join("; ") || "-",
            "Verified By": row.lifecycle?.verifiedBy || "-",
            "Verified At": formatDate(row.lifecycle?.verifiedAt),
            "Reconciled By": row.lifecycle?.reconciledBy || "-",
            "Reconciled At": formatDate(row.lifecycle?.reconciledAt),
            "Notes": row.notes || row.lifecycle?.notes || "-",
            "Created At": formatDate(row.createdAt),
        }));
    }, [filteredRows]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summary = reportData?.summary || {};
        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Payments</div>
          <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${summary.totalPaymentsRecorded || 0}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Amount</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalRecordedAmount)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Reconciled</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalReconciledAmount)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Rejected/Reversed</div>
          <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${formatCurrency(summary.totalRejectedAmount + summary.totalReversedAmount)}</div>
        </div>
      </div>
    `;

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Payment #</th>
            <th style="padding: 12px; text-align: left;">Tenant</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
            <th style="padding: 12px; text-align: center;">Method</th>
            <th style="padding: 12px; text-align: center;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">
                ${row.paymentNumber}<br/>
                <small>${formatDate(row.paymentDate)}</small>
              </td>
              <td style="padding: 12px;">
                ${row.tenant?.fullName || "-"}<br/>
                <small>Unit ${row.unit?.unitNumber || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(row.amount)}</td>
              <td style="padding: 12px; text-align: center;">${row.method?.toUpperCase() || "-"}</td>
              <td style="padding: 12px; text-align: center;">
                <span style="background: ${row.lifecycle?.status === 'reconciled' ? '#d4edda' : row.lifecycle?.status === 'rejected' ? '#f8d7da' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.lifecycle?.status?.toUpperCase() || "RECORDED"}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Report - ${monthOptions.find(m => m.value === billingMonth)?.label} ${billingYear}</title>
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
              border-bottom: 2px solid #e2e8f0;
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
            <h1>Payment Report</h1>
            <div class="date">Period: ${monthOptions.find(m => m.value === billingMonth)?.label} ${billingYear}</div>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          ${summaryHtml}
          ${tableHtml}
          <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 12px;">
            Generated by Apartment Management System
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Report");
            XLSX.writeFile(workbook, `payment_report_${billingYear}_${billingMonth}.xlsx`);
        });
    };

    const summary = reportData?.summary;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Payment Report" pageTitle="Reports" />

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
                                        <h4 className="mb-1">Payment Report</h4>
                                        <p className="text-muted mb-0">
                                            Comprehensive analysis of tenant payments, methods, and reconciliation status
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
                        {/* Summary Stats Cards */}
                        <Row className="mb-4">
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiCreditCard}
                                    title="Total Payments"
                                    value={summary?.totalPaymentsRecorded || 0}
                                    color="primary"
                                    subtitle="Total transactions"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiDollarSign}
                                    title="Total Amount"
                                    value={formatCurrency(summary?.totalRecordedAmount || 0)}
                                    color="success"
                                    subtitle="All payments"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiThumbsUp}
                                    title="Reconciled Amount"
                                    value={formatCurrency(summary?.totalReconciledAmount || 0)}
                                    color="info"
                                    subtitle={`${((summary?.totalReconciledAmount / summary?.totalRecordedAmount) * 100).toFixed(1)}% reconciled`}
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiXCircle}
                                    title="Rejected/Reversed"
                                    value={formatCurrency((summary?.totalRejectedAmount || 0) + (summary?.totalReversedAmount || 0))}
                                    color="danger"
                                    subtitle="Failed transactions"
                                />
                            </Col>
                        </Row>

                        {/* Charts Row */}
                        <Row className="mb-4">
                            <Col lg={5} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiPieChart size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Payment Status Distribution</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Pie data={statusPieData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={7} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiTrendingUp size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Daily Payment Trend</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Line data={dailyLineData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Second Row Charts */}
                        <Row className="mb-4">
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiBarChart2 size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Payment Method Distribution</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px" }}>
                                            <Doughnut data={methodPieData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiUsers size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Top Tenants by Payment</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px" }}>
                                            <Bar data={tenantBarData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Search and Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <h5 className="mb-0">Payment Details</h5>
                                    <div style={{ width: "300px" }}>
                                        <Input
                                            type="text"
                                            placeholder="Search by payment, tenant, invoice..."
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="p-0">
                                <DataTable
                                    columns={columns}
                                    data={filteredRows}
                                    pagination
                                    responsive
                                    highlightOnHover
                                    pointerOnHover
                                    className="border-0"
                                    paginationPerPage={10}
                                    paginationRowsPerPageOptions={[10, 25, 50]}
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
                    </>
                ) : null}
            </Container>
        </div>
    );
};

export default PaymentReport;