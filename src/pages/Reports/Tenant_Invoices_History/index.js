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
    Progress,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
} from "reactstrap";
import {
    FiFileText,
    FiDownload,
    FiPrinter,
    FiRefreshCw,
    FiDollarSign,
    FiTrendingUp,
    FiTrendingDown,
    FiPieChart,
    FiBarChart2,
    FiUsers,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiActivity,
    FiUser,
    FiHome,
    FiMail,
    FiPhone,
    FiCalendar,
    FiArrowUp,
    FiArrowDown,
    FiTarget,
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
import { Bar, Line, Doughnut } from "react-chartjs-2";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../../helpers/backend_helper";
import { useDispatch } from "react-redux";

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
        case "reconciled":
            return "success";
        case "overdue":
            return "danger";
        case "pending":
            return "warning";
        case "rejected":
            return "danger";
        case "reversed":
            return "warning";
        case "verified":
            return "info";
        default:
            return "secondary";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case "paid":
        case "reconciled":
            return <FiCheckCircle size={12} />;
        case "overdue":
            return <FiAlertCircle size={12} />;
        case "pending":
            return <FiClock size={12} />;
        case "rejected":
            return <FiArrowDown size={12} />;
        case "reversed":
            return <FiTrendingDown size={12} />;
        default:
            return <FiActivity size={12} />;
    }
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, subtitle, trend, trendValue }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
                    <Icon size={24} className={`text-${color}`} />
                </div>
                {trend && (
                    <Badge color={trend === "up" ? "success" : "danger"} className="px-2 py-1">
                        {trend === "up" ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                        <span className="ms-1">{trendValue}</span>
                    </Badge>
                )}
            </div>
            <h3 className="mb-1 fw-bold">{value}</h3>
            <p className="text-muted mb-0 small">{title}</p>
            {subtitle && <small className="text-muted">{subtitle}</small>}
        </CardBody>
    </Card>
);

// Tenant Summary Card
const TenantSummaryCard = ({ tenant, invoices, payments }) => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const balance = totalInvoiced - totalPaid;
    const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return (
        <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
                <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                            <FiUser size={24} className="text-primary" />
                        </div>
                        <div>
                            <h6 className="mb-1 fw-semibold">{tenant?.fullName || "Unknown Tenant"}</h6>
                            <small className="text-muted">{tenant?.tenantCode || "-"}</small>
                        </div>
                    </div>
                    <Badge
                        color={balance > 0 ? "danger" : "success"}
                        className="px-3 py-2"
                    >
                        {balance > 0 ? "Has Balance" : "Settled"}
                    </Badge>
                </div>

                <div className="mb-3">
                    {tenant?.phone && (
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <FiPhone size={12} className="text-muted" />
                            <small className="text-muted">{tenant.phone}</small>
                        </div>
                    )}
                    {tenant?.email && (
                        <div className="d-flex align-items-center gap-2">
                            <FiMail size={12} className="text-muted" />
                            <small className="text-muted">{tenant.email}</small>
                        </div>
                    )}
                </div>

                <div className="bg-light rounded-3 p-3">
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Invoices ({invoices.length})</span>
                        <span className="fw-semibold">{formatCurrency(totalInvoiced)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Payments ({payments.length})</span>
                        <span className="fw-semibold text-success">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top">
                        <span className="text-muted small fw-semibold">Balance</span>
                        <span className={`fw-bold ${balance > 0 ? "text-danger" : "text-success"}`}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                </div>

                <div className="mt-3">
                    <Progress
                        value={paymentRate}
                        color={paymentRate === 100 ? "success" : paymentRate > 0 ? "warning" : "danger"}
                        className="mt-2"
                        style={{ height: "4px" }}
                    />
                    <small className="text-muted">
                        {paymentRate.toFixed(1)}% payment rate
                    </small>
                </div>
            </CardBody>
        </Card>
    );
};

const TenantHistoryReport = () => {
    document.title = "Tenant Invoice & Payments History | Apartment Management";
    const dispatch = useDispatch();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ReportsAPI.tenantHistory({});
            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Process data for charts
    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const invoices = reportData.details.invoices || [];
        const payments = reportData.details.payments || [];

        // Monthly trends
        const monthlyData = {};
        const statusCounts = {
            paid: 0,
            overdue: 0,
            pending: 0,
            reconciled: 0,
            rejected: 0,
            reversed: 0,
        };
        const statusAmounts = {
            paid: 0,
            overdue: 0,
            pending: 0,
            reconciled: 0,
            rejected: 0,
            reversed: 0,
        };

        invoices.forEach(inv => {
            const date = new Date(inv.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { invoices: 0, payments: 0 };
            }
            monthlyData[monthKey].invoices += inv.amount;

            const status = inv.status?.toLowerCase() || "pending";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            statusAmounts[status] = (statusAmounts[status] || 0) + inv.amount;
        });

        payments.forEach(pay => {
            const date = new Date(pay.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { invoices: 0, payments: 0 };
            }
            monthlyData[monthKey].payments += pay.amount;

            const status = pay.status?.toLowerCase() || "recorded";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            statusAmounts[status] = (statusAmounts[status] || 0) + pay.amount;
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const monthlyTrend = sortedMonths.map(month => ({
            month,
            invoices: monthlyData[month].invoices,
            payments: monthlyData[month].payments,
        }));

        return {
            monthlyTrend,
            statusCounts,
            statusAmounts,
            totalInvoices: invoices.length,
            totalPayments: payments.length,
            totalInvoiceAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
            totalPaymentAmount: payments.reduce((sum, pay) => sum + pay.amount, 0),
        };
    }, [reportData]);

    // Monthly Trend Chart
    const monthlyLineData = {
        labels: chartData?.monthlyTrend.map(m => m.month) || [],
        datasets: [
            {
                label: "Invoices ($)",
                data: chartData?.monthlyTrend.map(m => m.invoices) || [],
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Payments ($)",
                data: chartData?.monthlyTrend.map(m => m.payments) || [],
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    // Status Distribution Doughnut
    const statusDoughnutData = {
        labels: Object.keys(chartData?.statusAmounts || {}).map(
            key => key.charAt(0).toUpperCase() + key.slice(1)
        ),
        datasets: [
            {
                data: Object.values(chartData?.statusAmounts || {}),
                backgroundColor: ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec489a"],
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
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    },
                },
            },
        },
        scales: {
            y: {
                ticks: {
                    callback: (value) => formatCurrency(value),
                },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
            legend: {
                position: "bottom",
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const total = Object.values(chartData?.statusAmounts || {}).reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    // Combine and filter data
    const allTransactions = useMemo(() => {
        if (!reportData?.details) return [];
        const invoices = (reportData.details.invoices || []).map(inv => ({ ...inv, transactionType: "Invoice" }));
        const payments = (reportData.details.payments || []).map(pay => ({ ...pay, transactionType: "Payment" }));
        return [...invoices, ...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [reportData]);

    const filteredTransactions = useMemo(() => {
        let transactions = [...allTransactions];

        const keyword = searchText.trim().toLowerCase();
        if (keyword) {
            transactions = transactions.filter(t =>
                t.reference?.toLowerCase().includes(keyword) ||
                t.tenant?.fullName?.toLowerCase().includes(keyword) ||
                t.lease?.leaseNumber?.toLowerCase().includes(keyword)
            );
        }

        if (activeTab !== "all") {
            transactions = transactions.filter(t => t.type === activeTab);
        }

        if (dateRange.from) {
            transactions = transactions.filter(t => new Date(t.date) >= new Date(dateRange.from));
        }
        if (dateRange.to) {
            transactions = transactions.filter(t => new Date(t.date) <= new Date(dateRange.to));
        }

        return transactions;
    }, [allTransactions, searchText, activeTab, dateRange]);

    // Group by tenant for summary cards
    const tenantGroups = useMemo(() => {
        const groups = new Map();
        allTransactions.forEach(transaction => {
            const tenantId = transaction.tenant?._id || "unknown";
            if (!groups.has(tenantId)) {
                groups.set(tenantId, {
                    tenant: transaction.tenant,
                    invoices: [],
                    payments: [],
                });
            }
            const group = groups.get(tenantId);
            if (transaction.type === "invoice") {
                group.invoices.push(transaction);
            } else {
                group.payments.push(transaction);
            }
        });
        return Array.from(groups.values()).filter(g => g.tenant !== null);
    }, [allTransactions]);

    const columns = [
        {
            name: "Type",
            width: "100px",
            cell: (row) => (
                <Badge
                    color={row.type === "invoice" ? "primary" : "success"}
                    className="px-3 py-2"
                >
                    {row.type === "invoice" ? "Invoice" : "Payment"}
                </Badge>
            ),
        },
        {
            name: "Reference",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.reference}</div>
                    <small className="text-muted">{formatDate(row.date)}</small>
                </div>
            ),
        },
        {
            name: "Tenant",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.tenant?.fullName || "Unknown"}</div>
                    <small className="text-muted">{row.tenant?.tenantCode || "-"}</small>
                </div>
            ),
        },
        {
            name: "Lease",
            cell: (row) => (
                <div>
                    <div>{row.lease?.leaseNumber || "-"}</div>
                    <small className="text-muted">Rent: {formatCurrency(row.lease?.rentAmount)}</small>
                </div>
            ),
        },
        {
            name: "Amount",
            cell: (row) => (
                <div className={`fw-bold ${row.type === "payment" ? "text-success" : "text-primary"}`}>
                    {row.type === "payment" ? "+" : ""}{formatCurrency(row.amount)}
                </div>
            ),
        },
        {
            name: "Paid/Balance",
            cell: (row) => {
                if (row.type === "invoice") {
                    return (
                        <div>
                            <div className="text-success">Paid: {formatCurrency(row.paidAmount)}</div>
                            <div className={row.balance > 0 ? "text-danger" : "text-success"}>
                                Balance: {formatCurrency(row.balance)}
                            </div>
                        </div>
                    );
                }
                return <div className="text-muted">-</div>;
            },
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
    ];

    const exportRows = useMemo(() => {
        return filteredTransactions.map(row => ({
            "Type": row.type === "invoice" ? "Invoice" : "Payment",
            "Reference": row.reference,
            "Date": formatDate(row.date),
            "Tenant Name": row.tenant?.fullName || "Unknown",
            "Tenant Code": row.tenant?.tenantCode || "-",
            "Phone": row.tenant?.phone || "-",
            "Email": row.tenant?.email || "-",
            "Lease Number": row.lease?.leaseNumber || "-",
            "Monthly Rent": row.lease?.rentAmount || 0,
            "Amount": row.amount,
            "Paid Amount": row.paidAmount || 0,
            "Balance": row.balance || 0,
            "Status": row.status?.toUpperCase() || "PENDING",
            "Invoice ID": row.invoiceId || "-",
        }));
    }, [filteredTransactions]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summary = reportData?.summary || {};

        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">This Month Invoices</div>
          <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${formatCurrency(summary.thisMonthInvoiceAmount)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">This Month Payments</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${formatCurrency(summary.thisMonthPaidAmount)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">This Month Balance</div>
          <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${formatCurrency(summary.thisMonthBalance)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Transactions</div>
          <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${(summary.totalHistoricalInvoices || 0) + (summary.totalHistoricalPayments || 0)}</div>
        </div>
      </div>
    `;

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Type</th>
            <th style="padding: 12px; text-align: left;">Reference</th>
            <th style="padding: 12px; text-align: left;">Tenant</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
            <th style="padding: 12px; text-align: center;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(row => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">
                <span style="background: ${row.type === 'invoice' ? '#e0f2fe' : '#d4edda'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.type === "invoice" ? "Invoice" : "Payment"}
                </span>
              </td>
              <td style="padding: 12px;">
                ${row.reference}<br/>
                <small>${formatDate(row.date)}</small>
              </td>
              <td style="padding: 12px;">
                ${row.tenant?.fullName || "Unknown"}<br/>
                <small>${row.tenant?.tenantCode || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">
                ${formatCurrency(row.amount)}
              </td>
              <td style="padding: 12px; text-align: center;">
                <span style="background: ${getStatusColor(row.status) === 'success' ? '#d4edda' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
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
          <title>Tenant Invoice & Payments History</title>
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
            <h1>Tenant Invoice & Payments History</h1>
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tenant History Report");
            XLSX.writeFile(workbook, `tenant_history_report_${new Date().toISOString().split("T")[0]}.xlsx`);
        });
    };

    const summary = reportData?.summary;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Tenant History Report" pageTitle="Reports" />

                {/* Header Card */}
                <Card className="mb-4 border-0 shadow-sm">
                    <CardBody className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                        <FiUsers size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Tenant Invoice & Payments History</h4>
                                        <p className="text-muted mb-0">
                                            Complete transaction history for all tenants including invoices and payments
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
                            <Col lg={4} md={6}>
                                <Label className="form-label text-muted small mb-1">Search</Label>
                                <Input
                                    type="text"
                                    placeholder="Reference, tenant, lease..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Date From</Label>
                                <Input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Date To</Label>
                                <Input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={2} md={6} className="d-flex align-items-end">
                                <Button color="primary" onClick={fetchReport} className="w-100">
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
                ) : reportData ? (
                    <>
                        {/* Summary Stats Cards */}
                        <Row className="mb-4">
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiFileText}
                                    title="This Month Invoices"
                                    value={formatCurrency(summary?.thisMonthInvoiceAmount || 0)}
                                    color="primary"
                                    subtitle="Current period"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiCheckCircle}
                                    title="This Month Payments"
                                    value={formatCurrency(summary?.thisMonthPaidAmount || 0)}
                                    color="success"
                                    subtitle="Received this month"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiAlertCircle}
                                    title="This Month Balance"
                                    value={formatCurrency(summary?.thisMonthBalance || 0)}
                                    color="danger"
                                    subtitle="Outstanding"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiTrendingUp}
                                    title="Total Transactions"
                                    value={(summary?.totalHistoricalInvoices || 0) + (summary?.totalHistoricalPayments || 0)}
                                    color="info"
                                    subtitle="All time"
                                />
                            </Col>
                        </Row>

                        {/* Charts Row */}
                        <Row className="mb-4">
                            <Col lg={7} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiBarChart2 size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Monthly Invoice vs Payment Trend</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "350px" }}>
                                            <Line data={monthlyLineData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={5} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiPieChart size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Transaction Status Distribution</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "350px" }}>
                                            <Doughnut data={statusDoughnutData} options={doughnutOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Tenant Summary Cards */}
                        {tenantGroups.length > 0 && (
                            <>
                                <h5 className="mb-3">Tenant Summary</h5>
                                <Row className="mb-4">
                                    {tenantGroups.slice(0, 4).map((group, idx) => (
                                        <Col lg={3} md={6} className="mb-3" key={idx}>
                                            <TenantSummaryCard
                                                tenant={group.tenant}
                                                invoices={group.invoices}
                                                payments={group.payments}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}

                        {/* Transaction Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div className="d-flex gap-2">
                                        <Nav tabs className="border-0">
                                            <NavItem>
                                                <NavLink
                                                    className={activeTab === "all" ? "active bg-primary text-white" : ""}
                                                    onClick={() => setActiveTab("all")}
                                                    style={{ cursor: "pointer", borderRadius: "8px" }}
                                                >
                                                    All
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink
                                                    className={activeTab === "invoice" ? "active bg-primary text-white" : ""}
                                                    onClick={() => setActiveTab("invoice")}
                                                    style={{ cursor: "pointer", borderRadius: "8px" }}
                                                >
                                                    Invoices
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink
                                                    className={activeTab === "payment" ? "active bg-primary text-white" : ""}
                                                    onClick={() => setActiveTab("payment")}
                                                    style={{ cursor: "pointer", borderRadius: "8px" }}
                                                >
                                                    Payments
                                                </NavLink>
                                            </NavItem>
                                        </Nav>
                                    </div>
                                    <Badge color="light" className="px-3 py-2">
                                        {filteredTransactions.length} transactions
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardBody className="p-0">
                                <DataTable
                                    columns={columns}
                                    data={filteredTransactions}
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

export default TenantHistoryReport;