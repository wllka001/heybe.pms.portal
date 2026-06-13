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
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../../helpers/backend_helper";
import { useDispatch } from "react-redux";

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
    document.title = "General Finance Report | Degaanly";
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
        const summaryHtml = `
      <div style="max-width: 500px; margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Financial Summary</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Income</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalIncome)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Expenses</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #ef4444;">${formatCurrency(summary.totalExpenses)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Net ${summary.netProfitOrLoss >= 0 ? "Profit" : "Loss"}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: ${summary.netProfitOrLoss >= 0 ? "#10b981" : "#ef4444"};">
                ${formatCurrency(Math.abs(summary.netProfitOrLoss))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

        const totalIncomeVal = incomeRows.reduce((sum, row) => sum + (row.amount || 0), 0);
        const incomeTable = incomeRows.length > 0 ? `
      <h3 style="margin: 30px 0 20px 0; color: #10b981;">Income Transactions</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">SQN</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Date</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Reference</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Description</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Amount</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${incomeRows.map((row, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${formatDate(row.periodDate)}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${row.reference}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${row.notes || "-"}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; color: #10b981;">+${formatCurrency(row.amount)}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${row.status || "Recorded"}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            <td colspan="4" style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Total Income:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #10b981;">+${formatCurrency(totalIncomeVal)}</td>
            <td style="border: 1px solid #cbd5e1;"></td>
          </tr>
        </tfoot>
      </table>
    ` : "";

        const totalExpensesVal = expenseRows.reduce((sum, row) => sum + (row.amount || 0), 0);
        const expenseTable = expenseRows.length > 0 ? `
      <h3 style="margin: 30px 0 20px 0; color: #ef4444;">Expense Transactions</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">SQN</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Date</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Reference</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Category</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Description</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Amount</th>
           </tr>
        </thead>
        <tbody>
          ${expenseRows.map((row, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${formatDate(row.periodDate)}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${row.reference}</td>
              <td style="padding: 12px; text-transform: capitalize; border: 1px solid #cbd5e1;">${row.category || "-"}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${row.notes || "-"}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; color: #ef4444;">-${formatCurrency(row.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            <td colspan="5" style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Total Expenses:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #ef4444;">-${formatCurrency(totalExpensesVal)}</td>
          </tr>
        </tfoot>
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
            <h1>General Finance Report</h1>
            <div class="date">Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}</div>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
          </div>
          ${summaryHtml}
          ${incomeTable}
          ${expenseTable}
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
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Income</td>
                                                        <td className="fw-bold text-success" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.totalIncome || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Expenses</td>
                                                        <td className="fw-bold text-danger" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.totalExpenses || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Net Profit/Loss</td>
                                                        <td className={`fw-bold ${summary?.netProfitOrLoss >= 0 ? "text-success" : "text-danger"}`} style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>
                                                            {formatCurrency(summary?.netProfitOrLoss || 0)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
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
                                <div className="table-responsive px-4 pb-4">
                                    <table className="table table-bordered align-middle mb-0" style={{ borderColor: "#cbd5e1" }}>
                                        <thead className="table-light">
                                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #cbd5e1" }}>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1", width: "70px", textAlign: "center" }}>SQN</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Date</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Reference</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Description</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Amount</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayRows.length > 0 ? (
                                                displayRows.map((row, idx) => (
                                                    <tr key={idx} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>{idx + 1}</td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold">{formatDate(row.periodDate)}</div>
                                                            {row.transactionType && (
                                                                <small className="text-muted">{row.transactionType}</small>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold">{row.reference}</div>
                                                            {row.category && (
                                                                <small className="text-muted text-capitalize">{row.category}</small>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div>{row.notes || "-"}</div>
                                                            {row.payee && <small className="text-muted">Payee: {row.payee}</small>}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", fontWeight: "bold" }} className={row.type === "income" ? "text-success" : "text-danger"}>
                                                            {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <Badge
                                                                color={getStatusColor(row.status)}
                                                                className="d-inline-flex align-items-center gap-1 px-3 py-2"
                                                            >
                                                                {getStatusIcon(row.status)}
                                                                <span className="ms-1 text-capitalize">{row.status || "Recorded"}</span>
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center p-4 text-muted" style={{ border: "1px solid #cbd5e1" }}>
                                                        No records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot style={{ borderTop: "2px solid #64748b" }}>
                                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                <td colSpan="4" className="text-end fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>Net Profit/Loss:</td>
                                                <td className={`fw-bold ${(displayRows.reduce((sum, row) => sum + (row.type === "income" ? row.amount : -row.amount), 0)) >= 0 ? "text-success" : "text-danger"}`} style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(displayRows.reduce((sum, row) => sum + (row.type === "income" ? row.amount : -row.amount), 0))}
                                                </td>
                                                <td style={{ border: "1px solid #cbd5e1" }}></td>
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

export default GeneralFinanceReport;
