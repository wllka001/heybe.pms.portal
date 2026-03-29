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
import { Bar, Pie, Doughnut } from "react-chartjs-2";
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
    document.title = "Invoice Report | Apartment Management";
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

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const statusCounts = {
            paid: 0,
            overdue: 0,
            partially_paid: 0,
            pending: 0,
        };
        const statusAmounts = {
            paid: 0,
            overdue: 0,
            partially_paid: 0,
            pending: 0,
        };
        const monthlyTotals = {};
        const buildingTotals = {};

        reportData.details.forEach((invoice) => {
            const status = invoice.status?.toLowerCase() || "pending";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            statusAmounts[status] = (statusAmounts[status] || 0) + (invoice.totalAmount || 0);

            const monthYear = `${invoice.period?.year}-${String(invoice.period?.month).padStart(2, "0")}`;
            monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + (invoice.totalAmount || 0);

            const buildingName = invoice.building?.name || "Unknown";
            buildingTotals[buildingName] = (buildingTotals[buildingName] || 0) + (invoice.totalAmount || 0);
        });

        return {
            statusCounts,
            statusAmounts,
            monthlyTotals,
            buildingTotals,
        };
    }, [reportData]);

    // Status Distribution Pie Chart
    const statusPieData = {
        labels: Object.keys(chartData?.statusAmounts || {}).map(
            (key) => key.replace("_", " ").toUpperCase()
        ),
        datasets: [
            {
                data: Object.values(chartData?.statusAmounts || {}),
                backgroundColor: ["#10b981", "#ef4444", "#f59e0b", "#6b7280"],
                borderWidth: 0,
            },
        ],
    };

    // Monthly Trend Bar Chart
    const monthlyBarData = {
        labels: Object.keys(chartData?.monthlyTotals || {}),
        datasets: [
            {
                label: "Invoice Total ($)",
                data: Object.values(chartData?.monthlyTotals || {}),
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                borderRadius: 8,
            },
        ],
    };

    // Building Distribution Doughnut Chart
    const buildingDoughnutData = {
        labels: Object.keys(chartData?.buildingTotals || {}),
        datasets: [
            {
                data: Object.values(chartData?.buildingTotals || {}),
                backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
                borderWidth: 0,
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
            name: "Invoice",
            cell: (row) => (
                <div>
                    <div className="fw-semibold mb-1">{row.invoiceNumber}</div>
                    <small className="text-muted">Due: {formatDate(row.period?.dueDate)}</small>
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
            name: "Amount",
            cell: (row) => (
                <div>
                    <div className="fw-bold text-primary">{formatCurrency(row.totalAmount)}</div>
                    <small className="text-muted">Rent: {formatCurrency(row.rentAmount)}</small>
                </div>
            ),
        },
        {
            name: "Paid",
            cell: (row) => (
                <div>
                    <div className="fw-semibold text-success">{formatCurrency(row.paidAmount)}</div>
                    <small className="text-muted">{row.paymentHistory?.length || 0} payments</small>
                </div>
            ),
        },
        {
            name: "Balance",
            cell: (row) => (
                <div className={`fw-bold ${row.balance > 0 ? "text-danger" : "text-success"}`}>
                    {formatCurrency(row.balance)}
                </div>
            ),
        },
        {
            name: "Status",
            cell: (row) => (
                <Badge
                    color={getStatusColor(row.status)}
                    className="d-inline-flex align-items-center gap-1 px-3 py-2"
                >
                    {getStatusIcon(row.status)}
                    <span className="ms-1 text-capitalize">{row.status?.replace("_", " ") || "Pending"}</span>
                </Badge>
            ),
        },
        {
            name: "Utilities",
            cell: (row) => (
                <div>
                    {row.utilityBreakdown?.length > 0 ? (
                        <>
                            <div className="fw-semibold">{formatCurrency(row.utilityAmount)}</div>
                            <small className="text-muted">{row.utilityBreakdown.length} items</small>
                        </>
                    ) : (
                        <span className="text-muted">-</span>
                    )}
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

        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        ${Object.entries(reportData?.summary || {}).map(([key, value]) => `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="color: #6c757d; font-size: 12px; margin-bottom: 8px;">${key.replace(/([A-Z])/g, " $1").replace(/([A-Z])/g, " $1").trim()}</div>
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${typeof value === "number" ? formatCurrency(value) : value}</div>
          </div>
        `).join("")}
      </div>
    `;

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Invoice #</th>
            <th style="padding: 12px; text-align: left;">Tenant</th>
            <th style="padding: 12px; text-align: right;">Total</th>
            <th style="padding: 12px; text-align: right;">Paid</th>
            <th style="padding: 12px; text-align: right;">Balance</th>
            <th style="padding: 12px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">
                ${row.invoiceNumber}<br/>
                <small>Due: ${formatDate(row.period?.dueDate)}</small>
              </td>
              <td style="padding: 12px;">
                ${row.tenant?.fullName || "-"}<br/>
                <small>Unit ${row.unit?.unitNumber || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(row.totalAmount)}</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(row.paidAmount)}</td>
              <td style="padding: 12px; text-align: right; ${row.balance > 0 ? 'color: #ef4444;' : 'color: #10b981;'}">${formatCurrency(row.balance)}</td>
              <td style="padding: 12px; text-align: center;">
                <span style="background: ${row.status === 'paid' ? '#d4edda' : row.status === 'overdue' ? '#f8d7da' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.status?.toUpperCase() || "PENDING"}
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
            <h1>Invoice Report</h1>
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
                        {/* Summary Stats Cards */}
                        <Row className="mb-4">
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiFileText}
                                    title="Total Invoices"
                                    value={summary?.totalInvoicesGenerated || 0}
                                    color="primary"
                                    subtitle="Generated this period"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiDollarSign}
                                    title="Grand Total"
                                    value={formatCurrency(summary?.grandTotalInvoiced || 0)}
                                    color="success"
                                    subtitle="Total invoiced amount"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiCheckCircle}
                                    title="Total Paid"
                                    value={formatCurrency(summary?.totalPaid || 0)}
                                    color="info"
                                    subtitle={`${((summary?.totalPaid / summary?.grandTotalInvoiced) * 100).toFixed(1)}% collected`}
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiAlertCircle}
                                    title="Outstanding"
                                    value={formatCurrency(summary?.totalOutstanding || 0)}
                                    color="warning"
                                    subtitle="Pending collection"
                                />
                            </Col>
                        </Row>

                        {/* Second Row Stats */}
                        <Row className="mb-4">
                            <Col lg={4} md={6} className="mb-3">
                                <StatCard
                                    icon={FiTrendingUp}
                                    title="Rent Amount"
                                    value={formatCurrency(summary?.totalRentAmount || 0)}
                                    color="info"
                                    subtitle="Base rent total"
                                />
                            </Col>
                            <Col lg={4} md={6} className="mb-3">
                                <StatCard
                                    icon={FiZap}
                                    title="Utility Amount"
                                    value={formatCurrency(summary?.totalUtilityAmount || 0)}
                                    color="warning"
                                    subtitle="Utility charges"
                                />
                            </Col>
                            <Col lg={4} md={6} className="mb-3">
                                <StatCard
                                    icon={FiClock}
                                    title="Previous Balance"
                                    value={formatCurrency(summary?.totalPreviousBalance || 0)}
                                    color="secondary"
                                    subtitle="Carried forward"
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
                                            <h6 className="mb-0">Invoice Status Distribution</h6>
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
                                            <FiBarChart2 size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Monthly Invoice Trends</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Bar data={monthlyBarData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Building Distribution */}
                        {Object.keys(chartData?.buildingTotals || {}).length > 1 && (
                            <Row className="mb-4">
                                <Col lg={12}>
                                    <Card className="border-0 shadow-sm">
                                        <CardHeader className="bg-white border-0 pt-4">
                                            <div className="d-flex align-items-center">
                                                <FiUsers size={18} className="text-primary me-2" />
                                                <h6 className="mb-0">Building Distribution</h6>
                                            </div>
                                        </CardHeader>
                                        <CardBody>
                                            <div style={{ height: "300px" }}>
                                                <Doughnut data={buildingDoughnutData} options={pieOptions} />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        )}

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

export default InvoiceReport;
