import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../../Components/Common/AppDataTable";
import Select from "../../../Components/Common/AppSelect";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";
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
    Progress,
    Row,
    UncontrolledTooltip,
} from "reactstrap";
import {
    FiAlertCircle,
    FiBarChart2,
    FiCheckCircle,
    FiDollarSign,
    FiFileText,
    FiHome,
    FiMail,
    FiPhone,
    FiPieChart,
    FiPrinter,
    FiRefreshCw,
    FiUser,
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

const formatDateRange = (from, to) => {
    if (from && to) return `${from} to ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Up to ${to}`;
    return "All dates";
};

const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
                    <Icon size={22} className={`text-${color}`} />
                </div>
            </div>
            <h3 className="mb-1 fw-bold">{value}</h3>
            <p className="text-muted mb-0 small">{title}</p>
            {subtitle ? <small className="text-muted">{subtitle}</small> : null}
        </CardBody>
    </Card>
);

const TenantBalanceReport = () => {
    document.title = "Tenant Balance Report | Degaanly";

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tenantOptions, setTenantOptions] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await TenantsAPI.list({ page: 1, limit: 100 });
                if (!response.success) return;

                setTenantOptions(
                    (response.data?.data || []).map((tenant) => ({
                        value: tenant._id,
                        label:
                            `${tenant.personalInfo?.firstName || ""} ${tenant.personalInfo?.lastName || ""}`.trim() ||
                            tenant.tenantCode ||
                            "Unknown Tenant",
                    })),
                );
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
            const response = await ReportsAPI.tenantBalances({
                tenantId: selectedTenant.value,
                dateFrom: dateRange.from || undefined,
                dateTo: dateRange.to || undefined,
            });

            setReportData(response.success ? response.data : null);
        } catch (error) {
            console.error("Error fetching report:", error);
            setReportData(null);
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
    }, [fetchReport, selectedTenant]);

    const selectedRow = useMemo(() => reportData?.details?.[0] || null, [reportData]);

    const summary = useMemo(() => {
        const totalInvoiced = Number(selectedRow?.totalInvoiced || 0);
        const beginningBalance = Number(selectedRow?.beginningBalance || 0);
        const securityDeposit = Number(selectedRow?.securityDeposit || 0);
        const totalOwed = totalInvoiced + beginningBalance + securityDeposit;

        const totalPaid = Number(selectedRow?.totalPaid || 0);
        const outstandingBalance = Number(selectedRow?.outstandingBalance || 0);

        return {
            totalInvoiced: totalOwed,
            totalPaid,
            outstandingBalance,
            collectionRate: totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0,
        };
    }, [selectedRow]);



    const columns = [
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
            name: "Contact",
            cell: (row) => (
                <div>
                    <div className="small">{row.tenant?.phone || "-"}</div>
                    <div className="small text-muted">{row.tenant?.email || "-"}</div>
                </div>
            ),
        },
        {
            name: "Invoiced / Owed",
            cell: (row) => {
                const totalOwed = (row.totalInvoiced || 0) + (row.beginningBalance || 0) + (row.securityDeposit || 0);
                return (
                    <div>
                        <div className="fw-semibold">{formatCurrency(totalOwed)}</div>
                        <small className="text-muted d-block">Invoices: {formatCurrency(row.totalInvoiced)}</small>
                        {(row.beginningBalance || 0) > 0 && (
                            <small className="text-muted d-block">Beg. Balance: {formatCurrency(row.beginningBalance)}</small>
                        )}
                        {(row.securityDeposit || 0) > 0 && (
                            <small className="text-muted d-block">Sec. Deposit: {formatCurrency(row.securityDeposit)}</small>
                        )}
                    </div>
                );
            },
        },
        {
            name: "Reconciled Paid",
            cell: (row) => {
                const invoicePaid = (row.totalPaid || 0) - (row.depositPaid || 0) - (row.beginningBalancePaid || 0);
                return (
                    <div>
                        <div className="fw-semibold text-success">{formatCurrency(row.totalPaid)}</div>
                        <small className="text-muted d-block">Invoices: {formatCurrency(invoicePaid)}</small>
                        {(row.beginningBalancePaid || 0) > 0 && (
                            <small className="text-muted d-block">Beg. Balance: {formatCurrency(row.beginningBalancePaid)}</small>
                        )}
                        {(row.depositPaid || 0) > 0 && (
                            <small className="text-muted d-block">Sec. Deposit: {formatCurrency(row.depositPaid)}</small>
                        )}
                    </div>
                );
            },
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
            name: "Collection Rate",
            cell: (row) => {
                const totalOwed = (row.totalInvoiced || 0) + (row.beginningBalance || 0) + (row.securityDeposit || 0);
                const rate = totalOwed > 0 ? (row.totalPaid / totalOwed) * 100 : 0;

                return (
                    <div style={{ minWidth: "120px" }}>
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

    const exportRows = selectedRow
        ? [
            {
                Tenant: selectedRow.tenant?.fullName || selectedTenant?.label || "Unknown Tenant",
                "Tenant Code": selectedRow.tenant?.tenantCode || "-",
                Lease: selectedRow.lease?.leaseNumber || "-",
                Phone: selectedRow.tenant?.phone || "-",
                Email: selectedRow.tenant?.email || "-",
                "Date Filter": formatDateRange(dateRange.from, dateRange.to),
                "Invoices (Owed)": selectedRow.totalInvoiced || 0,
                "Beg. Balance (Owed)": selectedRow.beginningBalance || 0,
                "Sec. Deposit (Owed)": selectedRow.securityDeposit || 0,
                "Total Owed": (selectedRow.totalInvoiced || 0) + (selectedRow.beginningBalance || 0) + (selectedRow.securityDeposit || 0),
                "Invoices (Paid)": (selectedRow.totalPaid || 0) - (selectedRow.depositPaid || 0) - (selectedRow.beginningBalancePaid || 0),
                "Beg. Balance (Paid)": selectedRow.beginningBalancePaid || 0,
                "Sec. Deposit (Paid)": selectedRow.depositPaid || 0,
                "Total Reconciled Paid": selectedRow.totalPaid || 0,
                "Outstanding Balance": selectedRow.outstandingBalance || 0,
                "Collection Rate": `${summary.collectionRate.toFixed(1)}%`,
            },
        ]
        : [];

    const printReport = () => {
        if (!selectedRow) return;

        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) return;

        const summaryHtml = `
            <div style="max-width: 500px; margin-bottom: 30px;">
                <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Report Summary</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
                    <tbody>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Invoiced / Owed</td>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${formatCurrency(summary.totalInvoiced)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Reconciled Paid</td>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #10b981;">${formatCurrency(summary.totalPaid)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Outstanding</td>
                            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #ef4444;">${formatCurrency(summary.outstandingBalance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        const printInvoicePaid = (selectedRow.totalPaid || 0) - (selectedRow.depositPaid || 0) - (selectedRow.beginningBalancePaid || 0);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Tenant Balance Report</title>
                    <style>
                        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px; color: #1e293b; }
                        h1 { margin-bottom: 8px; }
                        .muted { color: #64748b; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1; }
                        th, td { padding: 12px; border: 1px solid #cbd5e1; text-align: left; }
                    </style>
                </head>
                <body>
                    <h1>Tenant Balance Report</h1>
                    <div class="muted">Tenant: ${selectedRow.tenant?.fullName || selectedTenant?.label || "Unknown Tenant"}</div>
                    <div class="muted">Date Filter: ${formatDateRange(dateRange.from, dateRange.to)}</div>
                    ${summaryHtml}
                    <table>
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="width: 60px; text-align: center;">SQN</th>
                                <th>Lease</th>
                                <th>Contact</th>
                                <th>Invoiced / Owed Details</th>
                                <th>Reconciled Paid Details</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="text-align: center;">1</td>
                                <td>${selectedRow.lease?.leaseNumber || "-"}</td>
                                <td>${selectedRow.tenant?.phone || "-"}<br/><small>${selectedRow.tenant?.email || "-"}</small></td>
                                <td>
                                    <strong>${formatCurrency((selectedRow.totalInvoiced || 0) + (selectedRow.beginningBalance || 0) + (selectedRow.securityDeposit || 0))}</strong><br/>
                                    <span style="font-size: 11px; color: #64748b;">Invoices: ${formatCurrency(selectedRow.totalInvoiced)}</span>
                                    ${(selectedRow.beginningBalance || 0) > 0 ? `<br/><span style="font-size: 11px; color: #64748b;">Beg. Balance: ${formatCurrency(selectedRow.beginningBalance)}</span>` : ''}
                                    ${(selectedRow.securityDeposit || 0) > 0 ? `<br/><span style="font-size: 11px; color: #64748b;">Sec. Deposit: ${formatCurrency(selectedRow.securityDeposit)}</span>` : ''}
                                </td>
                                <td>
                                    <strong style="color: #10b981;">${formatCurrency(selectedRow.totalPaid)}</strong><br/>
                                    <span style="font-size: 11px; color: #64748b;">Invoices: ${formatCurrency(printInvoicePaid)}</span>
                                    ${(selectedRow.beginningBalancePaid || 0) > 0 ? `<br/><span style="font-size: 11px; color: #64748b;">Beg. Balance: ${formatCurrency(selectedRow.beginningBalancePaid)}</span>` : ''}
                                    ${(selectedRow.depositPaid || 0) > 0 ? `<br/><span style="font-size: 11px; color: #64748b;">Sec. Deposit: ${formatCurrency(selectedRow.depositPaid)}</span>` : ''}
                                </td>
                                <td style="font-weight: bold; color: ${selectedRow.outstandingBalance > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(selectedRow.outstandingBalance)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
                                <td colspan="3" style="text-align: right;">Total:</td>
                                <td>${formatCurrency(summary.totalInvoiced)}</td>
                                <td>${formatCurrency(summary.totalPaid)}</td>
                                <td style="color: ${summary.outstandingBalance > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(summary.outstandingBalance)}</td>
                            </tr>
                        </tfoot>
                    </table>
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tenant Balance");
            XLSX.writeFile(workbook, `tenant_balance_${new Date().toISOString().split("T")[0]}.xlsx`);
        });
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Tenant Balance Report" pageTitle="Reports" />

                <Card className="mb-4 border-0 shadow-sm">
                    <CardBody className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                        <FiUser size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Single Tenant Balance View</h4>
                                        <p className="text-muted mb-0">
                                            Review one tenant&apos;s invoiced amount, reconciled payments, and outstanding balance.
                                        </p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
                                    <Button color="success" onClick={exportToExcel} id="tenantBalanceExcel" disabled={!selectedRow}>
                                        <FiFileText className="me-1" size={16} /> Excel
                                    </Button>
                                    <UncontrolledTooltip target="tenantBalanceExcel">Export selected tenant</UncontrolledTooltip>
                                    <Button color="light" onClick={printReport} id="tenantBalancePrint" disabled={!selectedRow}>
                                        <FiPrinter className="me-1" size={16} /> Print
                                    </Button>
                                    <UncontrolledTooltip target="tenantBalancePrint">Print selected tenant</UncontrolledTooltip>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

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
                                <Label className="form-label text-muted small mb-1">From Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                                    placeholder="Select from date"
                                />
                            </Col>
                            <Col lg={3} md={6}>
                                <Label className="form-label text-muted small mb-1">To Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                                    placeholder="Select to date"
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
                        <CardBody className="p-4">
                            <Loader text="Loading tenant balance report..." />
                        </CardBody>
                    </Card>
                ) : !selectedTenant ? (
                    <Card className="border-0 shadow-sm">
                        <CardBody className="p-4">
                            <NoDataFound
                                title="Select a Tenant"
                                description="Choose one tenant and an optional date range to view this report."
                            />
                        </CardBody>
                    </Card>
                ) : !selectedRow ? (
                    <Card className="border-0 shadow-sm">
                        <CardBody className="p-4">
                            <NoDataFound
                                title="No Tenant Balance Found"
                                description="No balance data matched the selected tenant and date filter."
                            />
                        </CardBody>
                    </Card>
                ) : (
                    <>
                        <Card className="mb-4 border-0 shadow-sm">
                            <CardBody className="p-4">
                                <Row className="g-4 align-items-center">
                                    <Col lg={7}>
                                        <div className="d-flex align-items-start">
                                            <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                                                <FiUser size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                                    <h4 className="mb-0">{selectedRow.tenant?.fullName || selectedTenant.label}</h4>
                                                    <Badge color={summary.outstandingBalance > 0 ? "danger" : "success"} pill>
                                                        {summary.outstandingBalance > 0 ? "Outstanding Balance" : "Settled"}
                                                    </Badge>
                                                </div>
                                                <div className="text-muted small mb-2">
                                                    {selectedRow.tenant?.tenantCode || "Tenant Code Unavailable"}
                                                </div>
                                                <div className="d-flex flex-wrap gap-3 text-muted small">
                                                    <span><FiPhone className="me-1" />{selectedRow.tenant?.phone || "-"}</span>
                                                    <span><FiMail className="me-1" />{selectedRow.tenant?.email || "-"}</span>
                                                    <span><FiHome className="me-1" />{selectedRow.lease?.leaseNumber || "-"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col lg={5}>
                                        <div className="bg-light rounded-3 p-3">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted small">Date Filter</span>
                                                <span className="fw-semibold small">{formatDateRange(dateRange.from, dateRange.to)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted small">Monthly Rent</span>
                                                <span className="fw-semibold">{formatCurrency(selectedRow.lease?.rentAmount)}</span>
                                            </div>
                                             <div className="d-flex justify-content-between pt-2 border-top">
                                                 <span className="text-muted small">Monthly Rent</span>
                                                 <span className="fw-semibold">{formatCurrency(selectedRow.lease?.rentAmount)}</span>
                                             </div>
                                         </div>
                                     </Col>
                                 </Row>
                             </CardBody>
                         </Card>

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
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Invoiced</td>
                                                        <td className="fw-bold text-primary" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary.totalInvoiced)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Reconciled Paid</td>
                                                        <td className="fw-bold text-success" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary.totalPaid)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Outstanding Balance</td>
                                                        <td className="fw-bold text-danger" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary.outstandingBalance)}</td>
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
                                    <h5 className="mb-0">Tenant Balance Details</h5>
                                    <Badge color="light" className="px-3 py-2 text-primary">
                                        1 tenant record
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="table-responsive px-4 pb-4">
                                    <table className="table table-bordered align-middle mb-0" style={{ borderColor: "#cbd5e1" }}>
                                        <thead className="table-light">
                                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #cbd5e1" }}>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1", width: "70px", textAlign: "center" }}>SQN</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Lease</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Contact</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Invoiced / Owed</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Reconciled Paid</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Balance</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Collection Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedRow ? (
                                                <tr style={{ borderBottom: "1px solid #cbd5e1" }}>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>1</td>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                        <div className="fw-semibold">{selectedRow.lease?.leaseNumber || "-"}</div>
                                                        <small className="text-muted">Rent: {formatCurrency(selectedRow.lease?.rentAmount)}</small>
                                                    </td>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                        <div className="small">{selectedRow.tenant?.phone || "-"}</div>
                                                        <div className="small text-muted">{selectedRow.tenant?.email || "-"}</div>
                                                    </td>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                        <div className="fw-semibold">{formatCurrency((selectedRow.totalInvoiced || 0) + (selectedRow.beginningBalance || 0) + (selectedRow.securityDeposit || 0))}</div>
                                                        <small className="text-muted d-block">Invoices: {formatCurrency(selectedRow.totalInvoiced)}</small>
                                                        {(selectedRow.beginningBalance || 0) > 0 && (
                                                            <small className="text-muted d-block">Beg. Balance: {formatCurrency(selectedRow.beginningBalance)}</small>
                                                        )}
                                                        {(selectedRow.securityDeposit || 0) > 0 && (
                                                            <small className="text-muted d-block">Sec. Deposit: {formatCurrency(selectedRow.securityDeposit)}</small>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                        <div className="fw-semibold text-success">{formatCurrency(selectedRow.totalPaid)}</div>
                                                        <small className="text-muted d-block">Invoices: {formatCurrency((selectedRow.totalPaid || 0) - (selectedRow.depositPaid || 0) - (selectedRow.beginningBalancePaid || 0))}</small>
                                                        {(selectedRow.beginningBalancePaid || 0) > 0 && (
                                                            <small className="text-muted d-block">Beg. Balance: {formatCurrency(selectedRow.beginningBalancePaid)}</small>
                                                        )}
                                                        {(selectedRow.depositPaid || 0) > 0 && (
                                                            <small className="text-muted d-block">Sec. Deposit: {formatCurrency(selectedRow.depositPaid)}</small>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                        <div className={`fw-bold ${selectedRow.outstandingBalance > 0 ? "text-danger" : "text-success"}`}>
                                                            {formatCurrency(selectedRow.outstandingBalance)}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                        <div style={{ minWidth: "120px" }}>
                                                            <Progress
                                                                value={summary.collectionRate}
                                                                color={summary.collectionRate === 100 ? "success" : summary.collectionRate > 0 ? "warning" : "danger"}
                                                                style={{ height: "6px" }}
                                                                className="mb-1"
                                                            />
                                                            <small className="text-muted">{summary.collectionRate.toFixed(1)}%</small>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center p-4 text-muted" style={{ border: "1px solid #cbd5e1" }}>
                                                        No record found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot style={{ borderTop: "2px solid #64748b" }}>
                                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                <td colSpan="3" className="text-end fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>Total:</td>
                                                <td className="fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>{formatCurrency(summary.totalInvoiced)}</td>
                                                <td className="fw-bold text-success" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>{formatCurrency(summary.totalPaid)}</td>
                                                <td className={`fw-bold ${summary.outstandingBalance > 0 ? "text-danger" : "text-success"}`} style={{ padding: "12px", border: "1px solid #cbd5e1" }}>{formatCurrency(summary.outstandingBalance)}</td>
                                                <td className="fw-bold text-success" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>{summary.collectionRate.toFixed(1)}%</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    </>
                )}
            </Container>
        </div>
    );
};

export default TenantBalanceReport;
