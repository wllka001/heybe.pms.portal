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
    FiUsers,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiActivity,
    FiUser,
    FiHome,
    FiMail,
    FiPhone,
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

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, subtitle, trend, trendValue }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
                    <Icon size={24} className={`text-${color}`} />
                </div>
                {trend && (
                    <Badge color={trend === "up" ? "danger" : "success"} className="px-2 py-1">
                        {trend === "up" ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
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

// Tenant Card Component
const TenantCard = ({ tenant, totalInvoiced, totalPaid, outstandingBalance }) => (
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
                    color={outstandingBalance > 0 ? "danger" : "success"}
                    className="px-3 py-2"
                >
                    {outstandingBalance > 0 ? "Has Balance" : "Settled"}
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
                    <span className="text-muted small">Total Invoiced</span>
                    <span className="fw-semibold">{formatCurrency(totalInvoiced)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Total Paid</span>
                    <span className="fw-semibold text-success">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top">
                    <span className="text-muted small fw-semibold">Outstanding</span>
                    <span className={`fw-bold ${outstandingBalance > 0 ? "text-danger" : "text-success"}`}>
                        {formatCurrency(outstandingBalance)}
                    </span>
                </div>
            </div>

            {outstandingBalance > 0 && (
                <div className="mt-3">
                    <Progress
                        value={(totalPaid / totalInvoiced) * 100}
                        color="danger"
                        className="mt-2"
                        style={{ height: "4px" }}
                    />
                    <small className="text-muted">
                        {((totalPaid / totalInvoiced) * 100).toFixed(1)}% paid
                    </small>
                </div>
            )}
        </CardBody>
    </Card>
);

const TenantBalanceReport = () => {
    document.title = "Tenant Balance Report | Apartment Management";
    const dispatch = useDispatch();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [minBalance, setMinBalance] = useState("");
    const [maxBalance, setMaxBalance] = useState("");

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ReportsAPI.tenantBalances({});
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

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const tenantBalances = [];
        const balanceRanges = {
            "0": 0,
            "1-500": 0,
            "501-1000": 0,
            "1001+": 0,
        };

        let totalOutstanding = 0;
        let totalPaid = 0;
        let totalInvoiced = 0;

        reportData.details.forEach((tenant) => {
            const balance = tenant.outstandingBalance || 0;
            tenantBalances.push(balance);
            totalOutstanding += balance;
            totalPaid += tenant.totalPaid || 0;
            totalInvoiced += tenant.totalInvoiced || 0;

            if (balance === 0) {
                balanceRanges["0"]++;
            } else if (balance <= 500) {
                balanceRanges["1-500"]++;
            } else if (balance <= 1000) {
                balanceRanges["501-1000"]++;
            } else {
                balanceRanges["1001+"]++;
            }
        });

        return {
            balanceRanges,
            totalOutstanding,
            totalPaid,
            totalInvoiced,
            averageBalance: totalOutstanding / (reportData.details.length || 1),
            tenantCount: reportData.details.length,
            collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        };
    }, [reportData]);

    // Balance Distribution Pie Chart
    const balancePieData = {
        labels: Object.keys(chartData?.balanceRanges || {}).map(
            (key) => key === "0" ? "Zero Balance" : `$${key}`
        ),
        datasets: [
            {
                data: Object.values(chartData?.balanceRanges || {}),
                backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
                borderWidth: 0,
            },
        ],
    };

    // Tenant Balance Bar Chart
    const tenantBarData = useMemo(() => {
        if (!reportData?.details) return null;

        const topTenants = [...reportData.details]
            .sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0))
            .slice(0, 10);

        return {
            labels: topTenants.map(t => t.tenant?.fullName?.split(" ")[0] || "Unknown"),
            datasets: [
                {
                    label: "Outstanding Balance ($)",
                    data: topTenants.map(t => t.outstandingBalance || 0),
                    backgroundColor: "rgba(239, 68, 68, 0.8)",
                    borderRadius: 8,
                },
                {
                    label: "Paid Amount ($)",
                    data: topTenants.map(t => t.totalPaid || 0),
                    backgroundColor: "rgba(16, 185, 129, 0.8)",
                    borderRadius: 8,
                },
            ],
        };
    }, [reportData]);

    // Payment Collection Doughnut Chart
    const collectionData = {
        labels: ["Paid Amount", "Outstanding Balance"],
        datasets: [
            {
                data: [chartData?.totalPaid || 0, chartData?.totalOutstanding || 0],
                backgroundColor: ["#10b981", "#ef4444"],
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
                        const total = chartData?.totalInvoiced || 0;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    const columns = [
        {
            name: "Tenant",
            grow: 2,
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.tenant?.fullName || "Unknown Tenant"}</div>
                    <small className="text-muted">{row.tenant?.tenantCode || "-"}</small>
                </div>
            ),
        },
        {
            name: "Contact",
            cell: (row) => (
                <div>
                    <div className="small">{row.tenant?.phone || "-"}</div>
                    <div className="small text-muted">{row.tenant?.email || "-"}</div>
                </div>
            ),
        },
        {
            name: "Lease",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.lease?.leaseNumber || "-"}</div>
                    <small className="text-muted">Rent: {formatCurrency(row.lease?.rentAmount)}</small>
                </div>
            ),
        },
        {
            name: "Invoiced",
            cell: (row) => (
                <div className="fw-semibold">{formatCurrency(row.totalInvoiced)}</div>
            ),
        },
        {
            name: "Paid",
            cell: (row) => (
                <div className="fw-semibold text-success">{formatCurrency(row.totalPaid)}</div>
            ),
        },
        {
            name: "Balance",
            cell: (row) => (
                <div className={`fw-bold ${row.outstandingBalance > 0 ? "text-danger" : "text-success"}`}>
                    {formatCurrency(row.outstandingBalance)}
                </div>
            ),
        },
        {
            name: "Payment Rate",
            cell: (row) => {
                const rate = row.totalInvoiced > 0 ? (row.totalPaid / row.totalInvoiced) * 100 : 0;
                return (
                    <div style={{ minWidth: "100px" }}>
                        <Progress
                            value={rate}
                            color={rate === 100 ? "success" : rate > 0 ? "warning" : "danger"}
                            style={{ height: "6px" }}
                        />
                        <small className="text-muted">{rate.toFixed(1)}%</small>
                    </div>
                );
            },
        },
    ];

    const filteredRows = useMemo(() => {
        if (!reportData?.details) return [];

        let rows = [...reportData.details];
        const keyword = searchText.trim().toLowerCase();

        if (keyword) {
            rows = rows.filter((row) =>
                row.tenant?.fullName?.toLowerCase().includes(keyword) ||
                row.tenant?.tenantCode?.toLowerCase().includes(keyword) ||
                row.tenant?.phone?.includes(keyword) ||
                row.lease?.leaseNumber?.toLowerCase().includes(keyword)
            );
        }

        if (minBalance) {
            rows = rows.filter((row) => (row.outstandingBalance || 0) >= Number(minBalance));
        }

        if (maxBalance) {
            rows = rows.filter((row) => (row.outstandingBalance || 0) <= Number(maxBalance));
        }

        return rows;
    }, [reportData, searchText, minBalance, maxBalance]);

    const exportRows = useMemo(() => {
        return filteredRows.map((row) => ({
            "Tenant Name": row.tenant?.fullName || "Unknown Tenant",
            "Tenant Code": row.tenant?.tenantCode || "-",
            "Phone": row.tenant?.phone || "-",
            "Email": row.tenant?.email || "-",
            "Lease Number": row.lease?.leaseNumber || "-",
            "Monthly Rent": row.lease?.rentAmount || 0,
            "Total Invoiced": row.totalInvoiced,
            "Total Paid": row.totalPaid,
            "Outstanding Balance": row.outstandingBalance,
            "Payment Rate": row.totalInvoiced > 0 ? `${((row.totalPaid / row.totalInvoiced) * 100).toFixed(1)}%` : "0%",
            "Status": row.outstandingBalance > 0 ? "Has Balance" : "Settled",
        }));
    }, [filteredRows]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summary = reportData?.summary || {};
        const collectionRate = ((summary.totalPaid / summary.totalInvoiced) * 100).toFixed(1);

        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Tenants</div>
          <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${summary.tenantCount || 0}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Invoiced</div>
          <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${formatCurrency(summary.totalInvoiced)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Paid</div>
          <div style="font-size: 28px; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalPaid)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Outstanding Balance</div>
          <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${formatCurrency(summary.outstandingBalance)}</div>
          <div style="font-size: 12px; color: #6c757d;">${collectionRate}% collected</div>
        </div>
      </div>
    `;

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Tenant</th>
            <th style="padding: 12px; text-align: left;">Contact</th>
            <th style="padding: 12px; text-align: left;">Lease</th>
            <th style="padding: 12px; text-align: right;">Invoiced</th>
            <th style="padding: 12px; text-align: right;">Paid</th>
            <th style="padding: 12px; text-align: right;">Balance</th>
           </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">
                ${row.tenant?.fullName || "Unknown Tenant"}<br/>
                <small>${row.tenant?.tenantCode || "-"}</small>
              </td>
              <td style="padding: 12px;">
                ${row.tenant?.phone || "-"}<br/>
                <small>${row.tenant?.email || "-"}</small>
              </td>
              <td style="padding: 12px;">
                ${row.lease?.leaseNumber || "-"}<br/>
                <small>Rent: ${formatCurrency(row.lease?.rentAmount)}</small>
              </td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(row.totalInvoiced)}</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(row.totalPaid)}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; ${row.outstandingBalance > 0 ? 'color: #ef4444;' : 'color: #10b981;'}">
                ${formatCurrency(row.outstandingBalance)}
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
          <title>Tenant Balance Report</title>
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
            <h1>Tenant Balance Report</h1>
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tenant Balance Report");
            XLSX.writeFile(workbook, `tenant_balance_report_${new Date().toISOString().split("T")[0]}.xlsx`);
        });
    };

    const summary = reportData?.summary;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Tenant Balance Report" pageTitle="Reports" />

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
                                        <h4 className="mb-1">Tenant Balance Report</h4>
                                        <p className="text-muted mb-0">
                                            Track tenant payment status, outstanding balances, and collection performance
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
                                <Label className="form-label text-muted small mb-1">Search Tenant</Label>
                                <Input
                                    type="text"
                                    placeholder="Name, code, phone..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Min Balance</Label>
                                <Input
                                    type="number"
                                    placeholder="Minimum balance"
                                    value={minBalance}
                                    onChange={(e) => setMinBalance(e.target.value)}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Max Balance</Label>
                                <Input
                                    type="number"
                                    placeholder="Maximum balance"
                                    value={maxBalance}
                                    onChange={(e) => setMaxBalance(e.target.value)}
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
                                    icon={FiUsers}
                                    title="Total Tenants"
                                    value={summary?.tenantCount || 0}
                                    color="primary"
                                    subtitle="Active tenants"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiDollarSign}
                                    title="Total Invoiced"
                                    value={formatCurrency(summary?.totalInvoiced || 0)}
                                    color="info"
                                    subtitle="All time invoiced"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiCheckCircle}
                                    title="Total Paid"
                                    value={formatCurrency(summary?.totalPaid || 0)}
                                    color="success"
                                    subtitle={`${((summary?.totalPaid / summary?.totalInvoiced) * 100).toFixed(1)}% collection rate`}
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiAlertCircle}
                                    title="Outstanding Balance"
                                    value={formatCurrency(summary?.outstandingBalance || 0)}
                                    color="danger"
                                    subtitle="To be collected"
                                    trend="up"
                                    trendValue={`${((summary?.outstandingBalance / summary?.totalInvoiced) * 100).toFixed(1)}%`}
                                />
                            </Col>
                        </Row>

                        {/* Charts Row */}
                        <Row className="mb-4">
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiPieChart size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Balance Distribution by Range</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Pie data={balancePieData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiBarChart2 size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Top Tenants by Balance</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            {tenantBarData && <Bar data={tenantBarData} options={chartOptions} />}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Collection Rate Chart */}
                        <Row className="mb-4">
                            <Col lg={6} className="mx-auto">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="bg-white border-0 pt-4 text-center">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <FiTrendingUp size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Overall Collection Performance</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="text-center">
                                        <div style={{ height: "250px", width: "250px", margin: "0 auto" }}>
                                            <Doughnut data={collectionData} options={doughnutOptions} />
                                        </div>
                                        <div className="mt-3">
                                            <h5 className="fw-bold">
                                                {((summary?.totalPaid / summary?.totalInvoiced) * 100).toFixed(1)}% Collection Rate
                                            </h5>
                                            <p className="text-muted small mb-0">
                                                {formatCurrency(summary?.totalPaid || 0)} collected out of {formatCurrency(summary?.totalInvoiced || 0)}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Tenant Cards Grid */}
                        <Row className="mb-4">
                            {filteredRows.slice(0, 4).map((tenant, idx) => (
                                <Col lg={3} md={6} className="mb-3" key={idx}>
                                    <TenantCard
                                        tenant={tenant.tenant}
                                        totalInvoiced={tenant.totalInvoiced}
                                        totalPaid={tenant.totalPaid}
                                        outstandingBalance={tenant.outstandingBalance}
                                    />
                                </Col>
                            ))}
                        </Row>

                        {/* Tenant Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <h5 className="mb-0">Tenant Balance Details</h5>
                                    <Badge color="light" className="px-3 py-2">
                                        {filteredRows.length} tenants displayed
                                    </Badge>
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

export default TenantBalanceReport;