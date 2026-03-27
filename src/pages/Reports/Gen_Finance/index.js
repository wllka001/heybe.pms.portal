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
    FiCalendar,
    FiAlertCircle,
    FiCheckCircle,
    FiActivity,
    FiBriefcase,
    FiArrowUp,
    FiArrowDown,
    FiTarget,
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
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
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
        case "reconciled":
            return "success";
        case "verified":
            return "info";
        case "approved":
            return "primary";
        case "pending":
            return "warning";
        default:
            return "secondary";
    }
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case "reconciled":
        case "approved":
            return <FiCheckCircle size={12} />;
        case "verified":
            return <FiActivity size={12} />;
        case "pending":
            return <FiAlertCircle size={12} />;
        default:
            return <FiTarget size={12} />;
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

// Financial Metric Card
const FinancialMetricCard = ({ title, amount, color, percentage }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
                <h6 className="mb-0 text-muted">{title}</h6>
                <Badge color={color} className="px-2 py-1">
                    {percentage}%
                </Badge>
            </div>
            <h4 className={`fw-bold text-${color}`}>{formatCurrency(amount)}</h4>
            <Progress value={percentage} color={color} className="mt-3" style={{ height: "6px" }} />
        </CardBody>
    </Card>
);

const GeneralFinanceReport = () => {
    document.title = "General Finance Report | Apartment Management";
    const dispatch = useDispatch();

    const today = new Date();
    const [dateFrom, setDateFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
    const [dateTo, setDateTo] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState("all");

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

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const payload = {
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            };

            const response = await ReportsAPI.generalFinance(payload);
            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const incomeData = reportData.details.income || [];
        const expenseData = reportData.details.expenses || [];

        const dailyIncome = {};
        const dailyExpenses = {};
        const categoryTotals = {};

        incomeData.forEach((item) => {
            const date = new Date(item.periodDate);
            const dayKey = date.toISOString().split("T")[0];
            dailyIncome[dayKey] = (dailyIncome[dayKey] || 0) + (item.amount || 0);
        });

        expenseData.forEach((item) => {
            const date = new Date(item.periodDate);
            const dayKey = date.toISOString().split("T")[0];
            dailyExpenses[dayKey] = (dailyExpenses[dayKey] || 0) + (item.amount || 0);

            const category = item.category || "other";
            categoryTotals[category] = (categoryTotals[category] || 0) + (item.amount || 0);
        });

        // Combine all dates
        const allDates = [...new Set([...Object.keys(dailyIncome), ...Object.keys(dailyExpenses)])].sort();
        const incomeByDate = allDates.map(date => dailyIncome[date] || 0);
        const expensesByDate = allDates.map(date => dailyExpenses[date] || 0);

        return {
            dailyData: {
                labels: allDates.map(d => formatDate(d)),
                income: incomeByDate,
                expenses: expensesByDate,
            },
            categoryTotals,
            totalIncome: reportData.summary?.totalIncome || 0,
            totalExpenses: reportData.summary?.totalExpenses || 0,
            netProfit: reportData.summary?.netProfitOrLoss || 0,
        };
    }, [reportData]);

    // Income vs Expenses Bar Chart
    const barChartData = {
        labels: chartData?.dailyData.labels || [],
        datasets: [
            {
                label: "Income",
                data: chartData?.dailyData.income || [],
                backgroundColor: "rgba(16, 185, 129, 0.8)",
                borderRadius: 8,
            },
            {
                label: "Expenses",
                data: chartData?.dailyData.expenses || [],
                backgroundColor: "rgba(239, 68, 68, 0.8)",
                borderRadius: 8,
            },
        ],
    };

    // Expense Category Pie Chart
    const categoryPieData = {
        labels: Object.keys(chartData?.categoryTotals || {}).map(
            (key) => key.charAt(0).toUpperCase() + key.slice(1)
        ),
        datasets: [
            {
                data: Object.values(chartData?.categoryTotals || {}),
                backgroundColor: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"],
                borderWidth: 0,
            },
        ],
    };

    // Profit/Loss Gauge Chart (Doughnut)
    const profitLossData = {
        labels: ["Net Profit", "Remaining"],
        datasets: [
            {
                data: [
                    chartData?.netProfit || 0,
                    Math.max(0, (chartData?.totalIncome || 0) - (chartData?.netProfit || 0)),
                ],
                backgroundColor: ["#10b981", "#e2e8f0"],
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
                        label += formatCurrency(context.parsed.y);
                        return label;
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

    const profitLossOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
            legend: {
                position: "bottom",
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const total = chartData?.totalIncome || 0;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    // Prepare data for tables
    const incomeRows = useMemo(() => {
        if (!reportData?.details?.income) return [];
        const keyword = searchText.trim().toLowerCase();
        let rows = reportData.details.income;
        if (keyword) {
            rows = rows.filter((row) =>
                JSON.stringify(row).toLowerCase().includes(keyword)
            );
        }
        return rows;
    }, [reportData, searchText]);

    const expenseRows = useMemo(() => {
        if (!reportData?.details?.expenses) return [];
        const keyword = searchText.trim().toLowerCase();
        let rows = reportData.details.expenses;
        if (keyword) {
            rows = rows.filter((row) =>
                JSON.stringify(row).toLowerCase().includes(keyword)
            );
        }
        return rows;
    }, [reportData, searchText]);

    const allRows = useMemo(() => {
        return [
            ...incomeRows.map(row => ({ ...row, transactionType: "Income" })),
            ...expenseRows.map(row => ({ ...row, transactionType: "Expense" })),
        ].sort((a, b) => new Date(b.periodDate) - new Date(a.periodDate));
    }, [incomeRows, expenseRows]);

    const displayRows = activeTab === "income" ? incomeRows : activeTab === "expense" ? expenseRows : allRows;

    const columns = [
        {
            name: "Date",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{formatDate(row.periodDate)}</div>
                    {row.transactionType && (
                        <small className="text-muted">{row.transactionType}</small>
                    )}
                </div>
            ),
        },
        {
            name: "Reference",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.reference}</div>
                    {row.category && (
                        <small className="text-muted text-capitalize">{row.category}</small>
                    )}
                </div>
            ),
        },
        {
            name: "Description",
            cell: (row) => (
                <div>
                    <div>{row.notes || "-"}</div>
                    {row.payee && <small className="text-muted">Payee: {row.payee}</small>}
                </div>
            ),
        },
        {
            name: "Amount",
            cell: (row) => (
                <div className={`fw-bold ${row.type === "income" ? "text-success" : "text-danger"}`}>
                    {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
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
                    <span className="ms-1 text-capitalize">{row.status || "Recorded"}</span>
                </Badge>
            ),
        },
    ];

    const exportRows = useMemo(() => {
        return displayRows.map((row) => ({
            "Transaction Type": row.type === "income" ? "Income" : "Expense",
            "Reference": row.reference,
            "Category": row.category || "-",
            "Description": row.notes || "-",
            "Payee": row.payee || "-",
            "Amount": row.amount,
            "Status": row.status || "Recorded",
            "Date": formatDate(row.periodDate),
        }));
    }, [displayRows]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summary = reportData?.summary || {};
        const profitPercentage = ((summary.netProfitOrLoss / summary.totalIncome) * 100).toFixed(1);
        const lossPercentage = ((Math.abs(summary.netProfitOrLoss) / summary.totalIncome) * 100).toFixed(1);

        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Income</div>
          <div style="font-size: 28px; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalIncome)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Expenses</div>
          <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${formatCurrency(summary.totalExpenses)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Net ${summary.netProfitOrLoss >= 0 ? "Profit" : "Loss"}</div>
          <div style="font-size: 28px; font-weight: bold; color: ${summary.netProfitOrLoss >= 0 ? "#10b981" : "#ef4444"};">
            ${formatCurrency(Math.abs(summary.netProfitOrLoss))}
          </div>
          <div style="font-size: 12px; color: #6c757d;">${summary.netProfitOrLoss >= 0 ? profitPercentage : lossPercentage}% of income</div>
        </div>
      </div>
    `;

        const incomeTable = incomeRows.length > 0 ? `
      <h3 style="margin: 30px 0 20px 0; color: #10b981;">Income Transactions</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Date</th>
            <th style="padding: 12px; text-align: left;">Reference</th>
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
            <th style="padding: 12px; text-align: center;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${incomeRows.map(row => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">${formatDate(row.periodDate)}</td>
              <td style="padding: 12px;">${row.reference}</td>
              <td style="padding: 12px;">${row.notes || "-"}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">+${formatCurrency(row.amount)}</td>
              <td style="padding: 12px; text-align: center;">${row.status || "Recorded"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : "";

        const expenseTable = expenseRows.length > 0 ? `
      <h3 style="margin: 30px 0 20px 0; color: #ef4444;">Expense Transactions</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Date</th>
            <th style="padding: 12px; text-align: left;">Reference</th>
            <th style="padding: 12px; text-align: left;">Category</th>
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
           </tr>
        </thead>
        <tbody>
          ${expenseRows.map(row => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">${formatDate(row.periodDate)}</td>
              <td style="padding: 12px;">${row.reference}</td>
              <td style="padding: 12px; text-transform: capitalize;">${row.category || "-"}</td>
              <td style="padding: 12px;">${row.notes || "-"}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">-${formatCurrency(row.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : "";

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>General Finance Report - ${formatDate(dateFrom)} to ${formatDate(dateTo)}</title>
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
            <h1>General Finance Report</h1>
            <div class="date">Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}</div>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          ${summaryHtml}
          ${incomeTable}
          ${expenseTable}
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "General Finance Report");
            XLSX.writeFile(workbook, `general_finance_${formatDate(dateFrom)}_to_${formatDate(dateTo)}.xlsx`);
        });
    };

    const summary = reportData?.summary;
    const profitPercentage = summary?.totalIncome ? ((summary.netProfitOrLoss / summary.totalIncome) * 100).toFixed(1) : 0;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="General Finance Report" pageTitle="Reports" />

                {/* Header Card */}
                <Card className="mb-4 border-0 shadow-sm">
                    <CardBody className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                        <FiTrendingUp size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1">General Finance Report</h4>
                                        <p className="text-muted mb-0">
                                            Comprehensive financial overview including income, expenses, and profitability analysis
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
                            <Col lg={5} md={6}>
                                <Label className="form-label text-muted small mb-1">Date From</Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={5} md={6}>
                                <Label className="form-label text-muted small mb-1">Date To</Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={2} md={12} className="d-flex align-items-end">
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
                            <Col lg={4} md={12} className="mb-3">
                                <StatCard
                                    icon={FiTrendingUp}
                                    title="Total Income"
                                    value={formatCurrency(summary?.totalIncome || 0)}
                                    color="success"
                                    subtitle="All revenue sources"
                                    trend="up"
                                    trendValue="+100%"
                                />
                            </Col>
                            <Col lg={4} md={12} className="mb-3">
                                <StatCard
                                    icon={FiTrendingDown}
                                    title="Total Expenses"
                                    value={formatCurrency(summary?.totalExpenses || 0)}
                                    color="danger"
                                    subtitle="Operational costs"
                                    trend="down"
                                    trendValue="-0%"
                                />
                            </Col>
                            <Col lg={4} md={12} className="mb-3">
                                <StatCard
                                    icon={summary?.netProfitOrLoss >= 0 ? FiZap : FiAlertCircle}
                                    title={summary?.netProfitOrLoss >= 0 ? "Net Profit" : "Net Loss"}
                                    value={formatCurrency(Math.abs(summary?.netProfitOrLoss || 0))}
                                    color={summary?.netProfitOrLoss >= 0 ? "success" : "danger"}
                                    subtitle={`${profitPercentage}% of total income`}
                                    trend={summary?.netProfitOrLoss >= 0 ? "up" : "down"}
                                    trendValue={profitPercentage}
                                />
                            </Col>
                        </Row>

                        {/* Financial Metrics */}
                        <Row className="mb-4">
                            <Col lg={6} md={12} className="mb-3">
                                <FinancialMetricCard
                                    title="Profit Margin"
                                    amount={summary?.netProfitOrLoss || 0}
                                    color="success"
                                    percentage={profitPercentage}
                                />
                            </Col>
                            <Col lg={6} md={12} className="mb-3">
                                <FinancialMetricCard
                                    title="Expense Ratio"
                                    amount={summary?.totalExpenses || 0}
                                    color="danger"
                                    percentage={summary?.totalIncome ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1) : 0}
                                />
                            </Col>
                        </Row>

                        {/* Charts Row */}
                        <Row className="mb-4">
                            <Col lg={8} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiBarChart2 size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Income vs Expenses Trend</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "350px" }}>
                                            <Bar data={barChartData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={4} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiPieChart size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Expense Breakdown</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "350px" }}>
                                            <Pie data={categoryPieData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Profit/Loss Gauge */}
                        <Row className="mb-4">
                            <Col lg={6} className="mx-auto">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="bg-white border-0 pt-4 text-center">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <FiTarget size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Profit/Loss Analysis</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="text-center">
                                        <div style={{ height: "250px", width: "250px", margin: "0 auto" }}>
                                            <Doughnut data={profitLossData} options={profitLossOptions} />
                                        </div>
                                        <div className="mt-3">
                                            <h5 className={`fw-bold ${summary?.netProfitOrLoss >= 0 ? "text-success" : "text-danger"}`}>
                                                {summary?.netProfitOrLoss >= 0 ? "Profitable Period" : "Loss Period"}
                                            </h5>
                                            <p className="text-muted small mb-0">
                                                Net {summary?.netProfitOrLoss >= 0 ? "profit" : "loss"} of {formatCurrency(Math.abs(summary?.netProfitOrLoss || 0))}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Transaction Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div className="d-flex gap-2">
                                        <Button
                                            color={activeTab === "all" ? "primary" : "light"}
                                            size="sm"
                                            onClick={() => setActiveTab("all")}
                                        >
                                            All Transactions
                                        </Button>
                                        <Button
                                            color={activeTab === "income" ? "success" : "light"}
                                            size="sm"
                                            onClick={() => setActiveTab("income")}
                                        >
                                            Income Only
                                        </Button>
                                        <Button
                                            color={activeTab === "expense" ? "danger" : "light"}
                                            size="sm"
                                            onClick={() => setActiveTab("expense")}
                                        >
                                            Expenses Only
                                        </Button>
                                    </div>
                                    <div style={{ width: "300px" }}>
                                        <Input
                                            type="text"
                                            placeholder="Search by reference, description..."
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
                                    data={displayRows}
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

export default GeneralFinanceReport;