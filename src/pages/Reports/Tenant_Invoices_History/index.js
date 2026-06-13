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
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI, TenantsAPI } from "../../../helpers/backend_helper";

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
    document.title = "Tenant Invoice & Payments History | Degaanly";

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [tenantOptions, setTenantOptions] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await TenantsAPI.list({ page: 1, limit: 100 });
                if (!response.success) return;
                const options = (response.data?.data || []).map((tenant) => ({
                    value: tenant._id,
                    label: `${tenant.personalInfo?.firstName || ""} ${tenant.personalInfo?.lastName || ""}`.trim() || tenant.tenantCode || "Unknown Tenant",
                }));
                setTenantOptions(options);
            } catch (_error) {
                setTenantOptions([]);
            }
        };

        fetchTenants();
    }, []);

    const fetchReport = useCallback(async () => {
        if (!selectedTenant?.value) {
            setReportData(null);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                tenantId: selectedTenant.value,
                dateFrom: dateRange.from || undefined,
                dateTo: dateRange.to || undefined,
            };
            const response = await ReportsAPI.tenantHistory(payload);
            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange.from, dateRange.to, selectedTenant]);

    useEffect(() => {
        if (selectedTenant?.value) {
            fetchReport();
        } else {
            setReportData(null);
        }
    }, [fetchReport]);

    const chartData = useMemo(() => {
        if (!reportData?.details) return null;

        const invoices = reportData.details.invoices || [];
        const payments = (reportData.details.payments || []).filter(
            (payment) => payment.status?.toLowerCase() === "reconciled",
        );

        const beginningBalance = Number(reportData.summary?.beginningBalance || 0);
        const beginningBalancePaid = Number(reportData.summary?.beginningBalancePaid || 0);
        const securityDeposit = Number(reportData.summary?.securityDeposit || 0);
        const depositPaid = Number(reportData.summary?.depositPaid || 0);

        const invoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const invoicePaid = payments.reduce((sum, pay) => sum + pay.amount, 0) - beginningBalancePaid - depositPaid;
        const totalOwed = invoiceAmount + beginningBalance + securityDeposit;
        const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
        const outstandingBalance = totalOwed - totalPaid;

        return {
            totalInvoices: invoices.length,
            totalPayments: payments.length,
            totalInvoiceAmount: invoiceAmount,
            totalPaymentAmount: totalPaid,
            beginningBalance,
            beginningBalancePaid,
            securityDeposit,
            depositPaid,
            invoicePaid,
            totalOwed,
            outstandingBalance,
        };
    }, [reportData]);

    // Combine and filter data
    const allTransactions = useMemo(() => {
        if (!reportData?.details) return [];
        const invoices = (reportData.details.invoices || []).map(inv => ({ ...inv, transactionType: "Invoice" }));
        const payments = (reportData.details.payments || [])
            .filter((pay) => pay.status?.toLowerCase() === "reconciled")
            .map(pay => ({ ...pay, transactionType: "Payment" }));
        return [...invoices, ...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [reportData]);

    const filteredTransactions = useMemo(() => {
        let transactions = [...allTransactions];

        if (activeTab !== "all") {
            transactions = transactions.filter(t => t.type === activeTab);
        }

        return transactions;
    }, [activeTab, allTransactions]);

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
        return filteredTransactions.map((row, idx) => ({
            "SQN": idx + 1,
            "Type": row.type === "invoice" ? "Invoice" : "Payment",
            "Reference": row.reference,
            "Date": formatDate(row.date),
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

        const summaryHtml = `
      <div style="max-width: 600px; margin-bottom: 30px;">
        <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Report Summary</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left; color: #0f172a;">Category</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #0f172a;">Invoiced / Owed</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #0f172a;">Reconciled Paid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Monthly Invoices</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #3b82f6;">${formatCurrency(chartData?.totalInvoiceAmount || 0)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #10b981;">${formatCurrency(chartData?.invoicePaid || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Beginning Balance</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #3b82f6;">${formatCurrency(chartData?.beginningBalance || 0)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #10b981;">${formatCurrency(chartData?.beginningBalancePaid || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Security Deposit</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #3b82f6;">${formatCurrency(chartData?.securityDeposit || 0)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #10b981;">${formatCurrency(chartData?.depositPaid || 0)}</td>
            </tr>
            <tr style="background: #f8f9fa; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #cbd5e1; color: #0f172a;">Total</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #3b82f6;">${formatCurrency(chartData?.totalOwed || 0)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #10b981;">${formatCurrency(chartData?.totalPaymentAmount || 0)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td colspan="2" style="padding: 8px; border: 1px solid #cbd5e1; color: #0f172a;">Outstanding Balance</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: ${chartData?.outstandingBalance > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(chartData?.outstandingBalance || 0)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Transactions</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: 600; color: #1e293b;">${(chartData?.totalInvoices || 0) + (chartData?.totalPayments || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">SQN</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Type</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Reference</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Amount</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Paid</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Balance</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map((row, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                <span style="background: ${row.type === 'invoice' ? '#e0f2fe' : '#d4edda'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.type === "invoice" ? "Invoice" : "Payment"}
                </span>
              </td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                ${row.reference}<br/>
                <small>${formatDate(row.date)}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">
                ${row.type === "payment" ? "+" : ""}${formatCurrency(row.amount)}
              </td>
              <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">
                ${row.type === "invoice" ? formatCurrency(row.paidAmount) : "-"}
              </td>
              <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: ${row.balance > 0 ? '#ef4444' : '#1e293b'};">
                ${row.type === "invoice" ? formatCurrency(row.balance) : "-"}
              </td>
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">
                <span style="background: ${getStatusColor(row.status) === 'success' ? '#d4edda' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.status?.toUpperCase() || "PENDING"}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #0f172a;">Total Owed / Reconciled Paid / Balance:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #0f172a;">
              <div>${formatCurrency(chartData?.totalOwed || 0)}</div>
              <small style="font-weight: normal; color: #64748b; display: block;">Invoices: ${formatCurrency(chartData?.totalInvoiceAmount || 0)}</small>
              ${(chartData?.beginningBalance || 0) > 0 ? `<small style="font-weight: normal; color: #64748b; display: block;">Beg. Balance: ${formatCurrency(chartData?.beginningBalance)}</small>` : ''}
              ${(chartData?.securityDeposit || 0) > 0 ? `<small style="font-weight: normal; color: #64748b; display: block;">Sec. Deposit: ${formatCurrency(chartData?.securityDeposit)}</small>` : ''}
            </td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #0f172a;">
              <div style="color: #10b981;">Paid: ${formatCurrency(chartData?.totalPaymentAmount || 0)}</div>
              <small style="font-weight: normal; color: #64748b; display: block;">Invoices: ${formatCurrency(chartData?.invoicePaid || 0)}</small>
              ${(chartData?.beginningBalancePaid || 0) > 0 ? `<small style="font-weight: normal; color: #64748b; display: block;">Beg. Balance: ${formatCurrency(chartData?.beginningBalancePaid)}</small>` : ''}
              ${(chartData?.depositPaid || 0) > 0 ? `<small style="font-weight: normal; color: #64748b; display: block;">Sec. Deposit: ${formatCurrency(chartData?.depositPaid)}</small>` : ''}
            </td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: ${chartData?.outstandingBalance > 0 ? '#ef4444' : '#10b981'};">
              <div>Balance: ${formatCurrency(chartData?.outstandingBalance || 0)}</div>
            </td>
            <td style="border: 1px solid #cbd5e1;"></td>
          </tr>
        </tfoot>
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
                                        <h4 className="mb-1">Single Tenant Invoice & Payments History</h4>
                                        <p className="text-muted mb-0">
                                            Review one tenant at a time and count only reconciled payments in totals
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
                                <Label className="form-label text-muted small mb-1">Tenant</Label>
                                <Select
                                    options={tenantOptions}
                                    value={selectedTenant}
                                    onChange={setSelectedTenant}
                                    placeholder="Select tenant"
                                    isClearable
                                    styles={selectStyles}
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
                                <Button color="primary" onClick={fetchReport} className="w-100" disabled={!selectedTenant?.value}>
                                    <FiRefreshCw className="me-1" size={16} /> Apply
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
                            <Col lg={8} md={12} className="mb-3">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardBody className="p-4">
                                        <h5 className="mb-3">Tenant Transaction Summary</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered mb-0" style={{ borderColor: "#cbd5e1" }}>
                                                <thead>
                                                    <tr className="table-light">
                                                        <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Category</th>
                                                        <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Invoiced / Owed</th>
                                                        <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Reconciled Paid</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Monthly Invoices</td>
                                                        <td className="fw-semibold text-primary" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(chartData?.totalInvoiceAmount || 0)}</td>
                                                        <td className="fw-semibold text-success" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(chartData?.invoicePaid || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Beginning Balance</td>
                                                        <td className="fw-semibold text-primary" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(chartData?.beginningBalance || 0)}</td>
                                                        <td className="fw-semibold text-success" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(chartData?.beginningBalancePaid || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Security Deposit</td>
                                                        <td className="fw-semibold text-primary" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(chartData?.securityDeposit || 0)}</td>
                                                        <td className="fw-semibold text-success" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(chartData?.depositPaid || 0)}</td>
                                                    </tr>
                                                    <tr className="table-light fw-bold" style={{ borderTop: "2px solid #cbd5e1" }}>
                                                        <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total</td>
                                                        <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right", color: "#3b82f6" }}>{formatCurrency(chartData?.totalOwed || 0)}</td>
                                                        <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right", color: "#10b981" }}>{formatCurrency(chartData?.totalPaymentAmount || 0)}</td>
                                                    </tr>
                                                    <tr className="fw-bold">
                                                        <td colSpan="2" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Outstanding Balance</td>
                                                        <td className={chartData?.outstandingBalance > 0 ? "text-danger" : "text-success"} style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>
                                                            {formatCurrency(chartData?.outstandingBalance || 0)}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" colSpan="2" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Transactions Count</td>
                                                        <td className="fw-semibold text-info" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>
                                                            {(chartData?.totalInvoices || 0) + (chartData?.totalPayments || 0)}
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
                                                    Reconciled Payments
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
                                <div className="table-responsive px-4 pb-4">
                                    <table className="table table-bordered align-middle mb-0" style={{ borderColor: "#cbd5e1" }}>
                                        <thead className="table-light">
                                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #cbd5e1" }}>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1", width: "70px", textAlign: "center" }}>SQN</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Type</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Reference</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Lease</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Amount</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Paid/Balance</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTransactions.length > 0 ? (
                                                filteredTransactions.map((row, idx) => (
                                                    <tr key={idx} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>{idx + 1}</td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <Badge
                                                                color={row.type === "invoice" ? "primary" : "success"}
                                                                className="px-3 py-2"
                                                            >
                                                                {row.type === "invoice" ? "Invoice" : "Payment"}
                                                            </Badge>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold">{row.reference}</div>
                                                            <small className="text-muted">{formatDate(row.date)}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div>{row.lease?.leaseNumber || "-"}</div>
                                                            <small className="text-muted">Rent: {formatCurrency(row.lease?.rentAmount)}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", fontWeight: "bold" }} className={row.type === "payment" ? "text-success" : "text-primary"}>
                                                            {row.type === "payment" ? "+" : ""}{formatCurrency(row.amount)}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            {row.type === "invoice" ? (
                                                                <div>
                                                                    <div className="text-success">Paid: {formatCurrency(row.paidAmount)}</div>
                                                                    <div className={row.balance > 0 ? "text-danger" : "text-success"}>
                                                                        Balance: {formatCurrency(row.balance)}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted">-</div>
                                                            )}
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
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center p-4 text-muted" style={{ border: "1px solid #cbd5e1" }}>
                                                        No records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot style={{ borderTop: "2px solid #64748b" }}>
                                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                <td colSpan="4" className="text-end fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>Total Owed / Reconciled Paid / Balance:</td>
                                                <td className="fw-bold text-primary" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    <div>{formatCurrency(chartData?.totalOwed || 0)}</div>
                                                    <small className="text-muted d-block fw-normal">Invoices: {formatCurrency(chartData?.totalInvoiceAmount || 0)}</small>
                                                    {(chartData?.beginningBalance || 0) > 0 && (
                                                        <small className="text-muted d-block fw-normal">Beg. Balance: {formatCurrency(chartData?.beginningBalance)}</small>
                                                    )}
                                                    {(chartData?.securityDeposit || 0) > 0 && (
                                                        <small className="text-muted d-block fw-normal">Sec. Deposit: {formatCurrency(chartData?.securityDeposit)}</small>
                                                    )}
                                                </td>
                                                <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    <div className="text-success fw-bold">Paid: {formatCurrency(chartData?.totalPaymentAmount || 0)}</div>
                                                    <small className="text-muted d-block fw-normal">Invoices: {formatCurrency(chartData?.invoicePaid || 0)}</small>
                                                    {(chartData?.beginningBalancePaid || 0) > 0 && (
                                                        <small className="text-muted d-block fw-normal">Beg. Balance: {formatCurrency(chartData?.beginningBalancePaid)}</small>
                                                    )}
                                                    {(chartData?.depositPaid || 0) > 0 && (
                                                        <small className="text-muted d-block fw-normal">Sec. Deposit: {formatCurrency(chartData?.depositPaid)}</small>
                                                    )}
                                                </td>
                                                <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    <div className="fw-bold text-muted small">Outstanding Balance:</div>
                                                    <div className={`fw-bold ${chartData?.outstandingBalance > 0 ? "text-danger" : "text-success"}`}>
                                                        {formatCurrency(chartData?.outstandingBalance || 0)}
                                                    </div>
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

export default TenantHistoryReport;
