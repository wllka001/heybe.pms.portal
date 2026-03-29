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
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI, TenantsAPI } from "../../../helpers/backend_helper";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
    document.title = "Tenant Balance Report | Apartment Management";

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
        const totalPaid = Number(selectedRow?.totalPaid || 0);
        const outstandingBalance = Number(selectedRow?.outstandingBalance || 0);

        return {
            totalInvoiced,
            totalPaid,
            outstandingBalance,
            collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        };
    }, [selectedRow]);

    const comparisonChartData = useMemo(
        () => ({
            labels: ["Invoiced", "Reconciled Paid", "Outstanding"],
            datasets: [
                {
                    data: [summary.totalInvoiced, summary.totalPaid, summary.outstandingBalance],
                    backgroundColor: ["rgba(59, 130, 246, 0.85)", "rgba(16, 185, 129, 0.85)", "rgba(239, 68, 68, 0.85)"],
                    borderRadius: 10,
                },
            ],
        }),
        [summary],
    );

    const collectionChartData = useMemo(
        () => ({
            labels: ["Reconciled Paid", "Outstanding"],
            datasets: [
                {
                    data: [summary.totalPaid, summary.outstandingBalance],
                    backgroundColor: ["#10b981", "#ef4444"],
                    borderWidth: 0,
                },
            ],
        }),
        [summary],
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => formatCurrency(context.parsed.y ?? context.parsed),
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
        cutout: "65%",
        plugins: {
            legend: { position: "bottom" },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = Number(context.raw || 0);
                        const total = summary.totalInvoiced || 0;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

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
            name: "Invoiced",
            cell: (row) => <div className="fw-semibold">{formatCurrency(row.totalInvoiced)}</div>,
        },
        {
            name: "Reconciled Paid",
            cell: (row) => <div className="fw-semibold text-success">{formatCurrency(row.totalPaid)}</div>,
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
                const rate = row.totalInvoiced > 0 ? (row.totalPaid / row.totalInvoiced) * 100 : 0;

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
                  "Total Invoiced": selectedRow.totalInvoiced || 0,
                  "Reconciled Paid": selectedRow.totalPaid || 0,
                  "Outstanding Balance": selectedRow.outstandingBalance || 0,
                  "Collection Rate": `${summary.collectionRate.toFixed(1)}%`,
              },
          ]
        : [];

    const printReport = () => {
        if (!selectedRow) return;

        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Tenant Balance Report</title>
                    <style>
                        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px; color: #1e293b; }
                        h1 { margin-bottom: 8px; }
                        .muted { color: #64748b; font-size: 14px; }
                        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
                        .card { background: #f8fafc; border-radius: 12px; padding: 16px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                    </style>
                </head>
                <body>
                    <h1>Tenant Balance Report</h1>
                    <div class="muted">Tenant: ${selectedRow.tenant?.fullName || selectedTenant?.label || "Unknown Tenant"}</div>
                    <div class="muted">Date Filter: ${formatDateRange(dateRange.from, dateRange.to)}</div>
                    <div class="grid">
                        <div class="card"><div class="muted">Total Invoiced</div><strong>${formatCurrency(summary.totalInvoiced)}</strong></div>
                        <div class="card"><div class="muted">Reconciled Paid</div><strong>${formatCurrency(summary.totalPaid)}</strong></div>
                        <div class="card"><div class="muted">Outstanding</div><strong>${formatCurrency(summary.outstandingBalance)}</strong></div>
                        <div class="card"><div class="muted">Collection Rate</div><strong>${summary.collectionRate.toFixed(1)}%</strong></div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Lease</th>
                                <th>Contact</th>
                                <th>Invoiced</th>
                                <th>Reconciled Paid</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${selectedRow.lease?.leaseNumber || "-"}</td>
                                <td>${selectedRow.tenant?.phone || "-"}<br/><small>${selectedRow.tenant?.email || "-"}</small></td>
                                <td>${formatCurrency(selectedRow.totalInvoiced)}</td>
                                <td>${formatCurrency(selectedRow.totalPaid)}</td>
                                <td>${formatCurrency(selectedRow.outstandingBalance)}</td>
                            </tr>
                        </tbody>
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
                                                <span className="text-muted small">Collection Rate</span>
                                                <span className="fw-bold text-success">{summary.collectionRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                        <Row className="mb-4">
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiDollarSign}
                                    title="Total Invoiced"
                                    value={formatCurrency(summary.totalInvoiced)}
                                    color="primary"
                                    subtitle="Within selected filter"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiCheckCircle}
                                    title="Reconciled Paid"
                                    value={formatCurrency(summary.totalPaid)}
                                    color="success"
                                    subtitle="Only reconciled payments"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiAlertCircle}
                                    title="Outstanding Balance"
                                    value={formatCurrency(summary.outstandingBalance)}
                                    color="danger"
                                    subtitle="Remaining amount"
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiBarChart2}
                                    title="Collection Rate"
                                    value={`${summary.collectionRate.toFixed(1)}%`}
                                    color="info"
                                    subtitle="Paid vs invoiced"
                                />
                            </Col>
                        </Row>

                        <Row className="mb-4">
                            <Col lg={7} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiBarChart2 size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Balance Comparison</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Bar data={comparisonChartData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={5} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiPieChart size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Paid vs Outstanding</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "320px" }}>
                                            <Doughnut data={collectionChartData} options={doughnutOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

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
                                <DataTable
                                    columns={columns}
                                    data={[selectedRow]}
                                    responsive
                                    highlightOnHover
                                    className="border-0"
                                    noDataComponent={<NoDataFound />}
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
                )}
            </Container>
        </div>
    );
};

export default TenantBalanceReport;
