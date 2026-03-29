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
    FiCalendar,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiActivity,
    FiBriefcase,
    FiUsers,
    FiHome,
    FiShoppingBag,
    FiWifi,
    FiTool,
    FiTruck,
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
import { getBuildings as onGetBuildings } from "../../../slices/thunks";
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

const getCategoryIcon = (category) => {
    const icons = {
        salary: <FiUsers size={14} className="text-primary" />,
        maintenance: <FiTool size={14} className="text-warning" />,
        utilities: <FiWifi size={14} className="text-info" />,
        supplies: <FiShoppingBag size={14} className="text-success" />,
        rent: <FiHome size={14} className="text-danger" />,
        transport: <FiTruck size={14} className="text-secondary" />,
    };
    return icons[category?.toLowerCase()] || <FiBriefcase size={14} className="text-muted" />;
};

const getCategoryColor = (category) => {
    const colors = {
        salary: "primary",
        maintenance: "warning",
        utilities: "info",
        supplies: "success",
        rent: "danger",
        transport: "secondary",
    };
    return colors[category?.toLowerCase()] || "secondary";
};

const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
        case "cash":
            return <FiDollarSign size={14} className="text-success" />;
        case "bank":
            return <FiFileText size={14} className="text-info" />;
        case "mobile":
            return <FiActivity size={14} className="text-primary" />;
        default:
            return <FiClock size={14} className="text-muted" />;
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

// Category Card Component
const CategoryCard = ({ category, amount, color, icon: Icon }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4 text-center">
            <div className={`bg-${color} bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3`}>
                <Icon size={28} className={`text-${color}`} />
            </div>
            <h6 className="mb-1 text-capitalize">{category}</h6>
            <div className="fs-4 fw-bold text-primary">{formatCurrency(amount)}</div>
        </CardBody>
    </Card>
);

const ExpenseReport = () => {
    document.title = "Expense Report | Apartment Management";
    const dispatch = useDispatch();

    const buildingsSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
    const buildings = useSelector(buildingsSelector);

    const today = new Date();
    const [dateFrom, setDateFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
    const [dateTo, setDateTo] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]);
    const [buildingId, setBuildingId] = useState("");
    const [category, setCategory] = useState("");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
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

    const categoryOptions = useMemo(
        () => [
            { value: "", label: "All Categories" },
            { value: "salary", label: "Salary" },
            { value: "maintenance", label: "Maintenance" },
            { value: "utilities", label: "Utilities" },
            { value: "supplies", label: "Supplies" },
            { value: "rent", label: "Rent" },
            { value: "transport", label: "Transport" },
        ],
        []
    );

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const payload = {
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                buildingId: buildingId || undefined,
                category: category || undefined,
            };

            const response = await ReportsAPI.expenses(payload);
            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, buildingId, category]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const categoryTotals = {};
        const monthlyTotals = {};
        const buildingTotals = {};
        const paymentMethodTotals = {};

        reportData.details.forEach((expense) => {
            const cat = expense.category?.toLowerCase() || "other";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (expense.amount || 0);

            const date = new Date(expense.expenseDate);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + (expense.amount || 0);

            const buildingName = expense.building?.name || "Unknown";
            buildingTotals[buildingName] = (buildingTotals[buildingName] || 0) + (expense.amount || 0);

            const method = expense.payment?.method?.toLowerCase() || "cash";
            paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + (expense.amount || 0);
        });

        // Sort monthly totals by date
        const sortedMonths = Object.keys(monthlyTotals).sort();
        const monthlyData = sortedMonths.map(month => ({
            month,
            amount: monthlyTotals[month]
        }));

        return {
            categoryTotals,
            monthlyData,
            buildingTotals,
            paymentMethodTotals,
        };
    }, [reportData]);

    // Category Distribution Pie Chart
    const categoryPieData = {
        labels: Object.keys(chartData?.categoryTotals || {}).map(
            (key) => key.charAt(0).toUpperCase() + key.slice(1)
        ),
        datasets: [
            {
                data: Object.values(chartData?.categoryTotals || {}),
                backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec489a"],
                borderWidth: 0,
            },
        ],
    };

    // Monthly Trend Line Chart
    const monthlyLineData = {
        labels: chartData?.monthlyData.map(d => d.month) || [],
        datasets: [
            {
                label: "Monthly Expenses ($)",
                data: chartData?.monthlyData.map(d => d.amount) || [],
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#ef4444",
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

    // Payment Method Pie Chart
    const methodPieData = {
        labels: Object.keys(chartData?.paymentMethodTotals || {}).map(
            (key) => key.charAt(0).toUpperCase() + key.slice(1)
        ),
        datasets: [
            {
                data: Object.values(chartData?.paymentMethodTotals || {}),
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
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
            name: "Expense",
            cell: (row) => (
                <div>
                    <div className="fw-semibold mb-1">{row.expenseNumber}</div>
                    <small className="text-muted">{formatDate(row.expenseDate)}</small>
                </div>
            ),
        },
        {
            name: "Category",
            cell: (row) => (
                <div className="d-flex align-items-center gap-2">
                    {getCategoryIcon(row.category)}
                    <span className="fw-semibold text-capitalize">{row.category}</span>
                </div>
            ),
        },
        {
            name: "Description",
            cell: (row) => (
                <div>
                    <div>{row.description || "-"}</div>
                    {row.payee?.name && (
                        <small className="text-muted">Payee: {row.payee.name}</small>
                    )}
                </div>
            ),
        },
        {
            name: "Building",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">{row.building?.name || "-"}</div>
                    <small className="text-muted">{row.building?.code || "-"}</small>
                </div>
            ),
        },
        {
            name: "Amount",
            cell: (row) => (
                <div className="fw-bold text-danger">{formatCurrency(row.amount)}</div>
            ),
        },
        {
            name: "Payment",
            cell: (row) => (
                <div>
                    <div className="d-flex align-items-center gap-1">
                        {getPaymentMethodIcon(row.payment?.method)}
                        <span className="text-capitalize">{row.payment?.method || "-"}</span>
                    </div>
                    {row.payment?.transactionId && (
                        <small className="text-muted">Ref: {row.payment.transactionId}</small>
                    )}
                </div>
            ),
        },
        {
            name: "Status",
            cell: (row) => (
                <Badge
                    color={row.approval?.status === "approved" ? "success" : "warning"}
                    className="d-inline-flex align-items-center gap-1 px-3 py-2"
                >
                    {row.approval?.status === "approved" ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                    <span className="ms-1 text-capitalize">{row.approval?.status || "Pending"}</span>
                </Badge>
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
            "Expense Number": row.expenseNumber,
            "Expense Date": formatDate(row.expenseDate),
            "Category": row.category?.toUpperCase() || "-",
            "Description": row.description || "-",
            "Building": row.building?.name || "-",
            "Amount": row.amount,
            "Payment Method": row.payment?.method?.toUpperCase() || "-",
            "Transaction ID": row.payment?.transactionId || "-",
            "Paid": row.payment?.paid ? "Yes" : "No",
            "Paid Date": formatDate(row.payment?.paidDate),
            "Payee Name": row.payee?.name || "-",
            "Payee Contact": row.payee?.contact || "-",
            "Payee Email": row.payee?.email || "-",
            "Approval Status": row.approval?.status?.toUpperCase() || "PENDING",
            "Approved By": row.approval?.approvedBy || "-",
            "Approved At": formatDate(row.approval?.approvedAt),
            "Created At": formatDate(row.createdAt),
        }));
    }, [filteredRows]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summary = reportData?.summary || {};
        const categories = summary.expenseCategories || [];
        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Expenses</div>
          <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${summary.totalExpenses || 0}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Total Amount</div>
          <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${formatCurrency(summary.totalExpenseAmount)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Monthly Average</div>
          <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${formatCurrency(summary.monthlyExpenseTotal)}</div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="color: #6c757d; font-size: 12px;">Categories</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${categories.length}</div>
        </div>
      </div>
    `;

        const categoriesHtml = categories.length > 0 ? `
      <div style="margin: 30px 0;">
        <h3 style="margin-bottom: 20px;">Category Breakdown</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${categories.map(cat => `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="color: #6c757d; font-size: 12px;">${cat.category?.toUpperCase()}</div>
              <div style="font-size: 18px; font-weight: bold;">${formatCurrency(cat.amount)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : "";

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Expense #</th>
            <th style="padding: 12px; text-align: left;">Category</th>
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
            <th style="padding: 12px; text-align: center;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">
                ${row.expenseNumber}<br/>
                <small>${formatDate(row.expenseDate)}</small>
              </td>
              <td style="padding: 12px;">
                <span style="text-transform: capitalize;">${row.category}</span>
              </td>
              <td style="padding: 12px;">
                ${row.description || "-"}<br/>
                <small>Payee: ${row.payee?.name || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(row.amount)}</td>
              <td style="padding: 12px; text-align: center;">
                <span style="background: ${row.approval?.status === 'approved' ? '#d4edda' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.approval?.status?.toUpperCase() || "PENDING"}
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
          <title>Expense Report - ${formatDate(dateFrom)} to ${formatDate(dateTo)}</title>
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
            <h1>Expense Report</h1>
            <div class="date">Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}</div>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          ${summaryHtml}
          ${categoriesHtml}
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Report");
            XLSX.writeFile(workbook, `expense_report_${formatDate(dateFrom)}_to_${formatDate(dateTo)}.xlsx`);
        });
    };

    const summary = reportData?.summary;
    const categories = summary?.expenseCategories || [];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Expense Report" pageTitle="Reports" />

                {/* Header Card */}
                <Card className="mb-4 border-0 shadow-sm">
                    <CardBody className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                                        <FiBriefcase size={24} className="text-danger" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Expense Report</h4>
                                        <p className="text-muted mb-0">
                                            Comprehensive analysis of operational expenses, category breakdowns, and payment tracking
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
                                <Label className="form-label text-muted small mb-1">Date From</Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="form-control"
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">Date To</Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="form-control"
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
                            <Col lg={2} md={6}>
                                <Label className="form-label text-muted small mb-1">Category</Label>
                                <Select
                                    options={categoryOptions}
                                    value={categoryOptions.find((item) => item.value === category) || categoryOptions[0]}
                                    onChange={(option) => setCategory(option?.value || "")}
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
                                    icon={FiBriefcase}
                                    title="Total Expenses"
                                    value={summary?.totalExpenses || 0}
                                    color="primary"
                                    subtitle="Total transactions"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiDollarSign}
                                    title="Total Amount"
                                    value={formatCurrency(summary?.totalExpenseAmount || 0)}
                                    color="danger"
                                    subtitle="All expenses"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiTrendingUp}
                                    title="Monthly Total"
                                    value={formatCurrency(summary?.monthlyExpenseTotal || 0)}
                                    color="warning"
                                    subtitle="Current period"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiPieChart}
                                    title="Categories"
                                    value={categories.length}
                                    color="success"
                                    subtitle="Expense types"
                                />
                            </Col>
                        </Row>

                        {/* Category Cards */}
                        {categories.length > 0 && (
                            <Row className="mb-4">
                                {categories.map((cat, idx) => (
                                    <Col lg={2} md={4} sm={6} className="mb-3" key={idx}>
                                        <CategoryCard
                                            category={cat.category}
                                            amount={cat.amount}
                                            color={getCategoryColor(cat.category)}
                                            icon={getCategoryIcon(cat.category).type}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        )}

                        {/* Charts Row */}
                        <Row className="mb-4">
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiPieChart size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Expense Distribution by Category</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Pie data={categoryPieData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiTrendingUp size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Monthly Expense Trend</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Line data={monthlyLineData} options={chartOptions} />
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
                                            <h6 className="mb-0">Expenses by Building</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px" }}>
                                            <Doughnut data={buildingDoughnutData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiClock size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Payment Method Distribution</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px" }}>
                                            <Pie data={methodPieData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Search and Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <h5 className="mb-0">Expense Details</h5>
                                    <div style={{ width: "300px" }}>
                                        <Input
                                            type="text"
                                            placeholder="Search by expense, category, description..."
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

export default ExpenseReport;
