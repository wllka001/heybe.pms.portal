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
    FiBarChart2,
    FiCalendar,
    FiDownload,
    FiFileText,
    FiPrinter,
    FiRefreshCw,
    FiDroplet,
    FiZap,
    FiTrash2,
    FiTrendingUp,
    FiDollarSign,
    FiPieChart,
    FiActivity,
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
import { Bar, Pie, Line } from "react-chartjs-2";
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

const getUtilityIcon = (type) => {
    const icons = {
        WATER: <FiDroplet size={16} className="text-info" />,
        ELECTRIC: <FiZap size={16} className="text-warning" />,
        TRASH: <FiTrash2 size={16} className="text-success" />,
        GAS: <FiActivity size={16} className="text-danger" />,
    };
    return icons[type] || <FiTrendingUp size={16} className="text-primary" />;
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

// Utility Type Card
const UtilityTypeCard = ({ type, amount, count, color, icon: Icon }) => (
    <Card className="border-0 shadow-sm h-100">
        <CardBody className="p-4 text-center">
            <div className={`bg-${color} bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3`}>
                <Icon size={28} className={`text-${color}`} />
            </div>
            <h5 className="mb-1">{type}</h5>
            <div className="fs-4 fw-bold text-primary">{formatCurrency(amount)}</div>
            <small className="text-muted">{count} bills</small>
        </CardBody>
    </Card>
);

const UtilityBillsReport = () => {
    document.title = "Utility Bills Report | Apartment Management";
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

            const response = await ReportsAPI.utilityBills(payload);
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

        const utilityTotals = {};
        const consumptionByUtility = {};
        const billingStatus = { billed: 0, unbilled: 0 };

        reportData.details.forEach((bill) => {
            const type = bill.utilityTypeName || bill.utilityType;
            utilityTotals[type] = (utilityTotals[type] || 0) + (bill.totalAmount || 0);
            consumptionByUtility[type] = (consumptionByUtility[type] || 0) + (bill.consumption || 0);
            if (bill.isBilled) {
                billingStatus.billed += bill.totalAmount || 0;
            } else {
                billingStatus.unbilled += bill.totalAmount || 0;
            }
        });

        return {
            utilityTotals,
            consumptionByUtility,
            billingStatus,
            utilityTypes: Object.keys(utilityTotals),
        };
    }, [reportData]);

    // Bar Chart Data
    const barChartData = {
        labels: chartData?.utilityTypes || [],
        datasets: [
            {
                label: "Total Amount ($)",
                data: chartData?.utilityTypes.map((type) => chartData.utilityTotals[type]) || [],
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                borderRadius: 8,
            },
        ],
    };

    // Pie Chart Data
    const pieChartData = {
        labels: chartData?.utilityTypes || [],
        datasets: [
            {
                data: chartData?.utilityTypes.map((type) => chartData.utilityTotals[type]) || [],
                backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
                borderWidth: 0,
            },
        ],
    };

    // Consumption Line Chart
    const lineChartData = {
        labels: chartData?.utilityTypes || [],
        datasets: [
            {
                label: "Consumption (Units)",
                data: chartData?.utilityTypes.map((type) => chartData.consumptionByUtility[type]) || [],
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: "#10b981",
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
            name: "Utility",
            cell: (row) => (
                <div className="d-flex align-items-center gap-2">
                    {getUtilityIcon(row.utilityType)}
                    <span className="fw-semibold">{row.utilityTypeName || row.utilityType}</span>
                </div>
            ),
        },
        {
            name: "Unit/Tenant",
            cell: (row) => (
                <div>
                    <div className="fw-semibold">Unit {row.unit?.unitNumber || "-"}</div>
                    <small className="text-muted">{row.tenant?.fullName || "-"}</small>
                </div>
            ),
        },
        {
            name: "Consumption",
            cell: (row) => (
                <div className="text-center">
                    <div className="fw-semibold">{row.consumption || 0}</div>
                    <small className="text-muted">units</small>
                </div>
            ),
        },
        {
            name: "Rate",
            cell: (row) => formatCurrency(row.ratePerUnit || row.fixedAmount),
        },
        {
            name: "Amount",
            cell: (row) => <span className="fw-bold text-success">{formatCurrency(row.totalAmount)}</span>,
        },
        {
            name: "Status",
            cell: (row) => (
                <Badge color={row.isBilled ? "success" : "warning"} className="px-3 py-1">
                    {row.isBilled ? "Billed" : "Pending"}
                </Badge>
            ),
        },
        {
            name: "Reading Date",
            cell: (row) => (
                <div>
                    <small className="text-muted">{formatDate(row.readings?.current?.date)}</small>
                    {row.readings?.current?.notes && (
                        <div className="small text-muted">{row.readings.current.notes}</div>
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
            "Utility Type": row.utilityTypeName || row.utilityType,
            "Unit Number": row.unit?.unitNumber || "-",
            Tenant: row.tenant?.fullName || "-",
            Consumption: row.consumption || 0,
            "Rate Per Unit": row.ratePerUnit || 0,
            "Fixed Amount": row.fixedAmount || 0,
            Amount: row.amount || 0,
            Tax: row.taxAmount || 0,
            Total: row.totalAmount || 0,
            Status: row.isBilled ? "Billed" : "Pending",
            "Reading Date": formatDate(row.readings?.current?.date),
            "Previous Reading": row.readings?.previous?.value || "-",
            "Current Reading": row.readings?.current?.value || "-",
        }));
    }, [filteredRows]);

    const printReport = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const summaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        ${Object.entries(reportData?.summary || {}).map(([key, value]) => `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="color: #6c757d; font-size: 12px; margin-bottom: 8px;">${key.replace(/([A-Z])/g, " $1").trim()}</div>
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${typeof value === "number" ? formatCurrency(value) : value}</div>
          </div>
        `).join("")}
      </div>
    `;

        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left;">Utility</th>
            <th style="padding: 12px; text-align: left;">Unit/Tenant</th>
            <th style="padding: 12px; text-align: center;">Consumption</th>
            <th style="padding: 12px; text-align: right;">Rate</th>
            <th style="padding: 12px; text-align: right;">Amount</th>
            <th style="padding: 12px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px;">${row.utilityTypeName || row.utilityType}</td>
              <td style="padding: 12px;">
                Unit ${row.unit?.unitNumber || "-"}<br/>
                <small>${row.tenant?.fullName || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: center;">${row.consumption || 0}</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(row.ratePerUnit || row.fixedAmount)}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(row.totalAmount)}</td>
              <td style="padding: 12px; text-align: center;">
                <span style="background: ${row.isBilled ? "#d4edda" : "#fff3cd"}; padding: 4px 8px; border-radius: 4px;">
                  ${row.isBilled ? "Billed" : "Pending"}
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
          <title>Utility Bills Report - ${monthOptions.find(m => m.value === billingMonth)?.label} ${billingYear}</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              padding: 40px;
              max-width: 1200px;
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
            <h1>Utility Bills Report</h1>
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Utility Bills Report");
            XLSX.writeFile(workbook, `utility_bills_${billingYear}_${billingMonth}.xlsx`);
        });
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Utility Bills Report" pageTitle="Reports" />

                {/* Header Card */}
                <Card className="mb-4 border-0 shadow-sm">
                    <CardBody className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                        <FiBarChart2 size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1">Utility Bills Report</h4>
                                        <p className="text-muted mb-0">
                                            Comprehensive analysis of utility consumption and billing
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
                                    <Button color="primary" onClick={() => { }} id="pdfBtn">
                                        <FiDownload className="me-1" size={16} /> PDF
                                    </Button>
                                    <UncontrolledTooltip target="pdfBtn">Download PDF</UncontrolledTooltip>
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
                            <Col lg={6} md={6} className="mb-3">
                                <StatCard
                                    icon={FiDollarSign}
                                    title="Total Amount"
                                    value={formatCurrency(reportData.summary?.grandTotal || 0)}
                                    color="primary"
                                    subtitle={`${reportData.summary?.billedCount || 0} bills billed`}
                                />
                            </Col>
                            {/* <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiTrendingUp}
                                    title="Total Consumption"
                                    value={`${reportData.summary?.totalConsumption || 0} units`}
                                    color="info"
                                    subtitle={`${reportData.summary?.totalBills || 0} total bills`}
                                />
                            </Col>
                            <Col lg={3} md={6} className="mb-3">
                                <StatCard
                                    icon={FiZap}
                                    title="Total Tax"
                                    value={formatCurrency(reportData.summary?.totalTaxAmount || 0)}
                                    color="warning"
                                    subtitle="Tax collected"
                                />
                            </Col> */}
                            <Col lg={6} md={6} className="mb-3">
                                <StatCard
                                    icon={FiActivity}
                                    title="Billing Rate"
                                    value={`${((reportData.summary?.billedCount || 0) / (reportData.summary?.totalBills || 1) * 100).toFixed(1)}%`}
                                    color="success"
                                    subtitle="Billed vs Total"
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
                                            <h6 className="mb-0">Utility Cost Distribution</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px" }}>
                                            <Pie data={pieChartData} options={pieOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col lg={6} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-0 pt-4">
                                        <div className="d-flex align-items-center">
                                            <FiTrendingUp size={18} className="text-primary me-2" />
                                            <h6 className="mb-0">Consumption by Utility Type</h6>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px" }}>
                                            <Line data={lineChartData} options={chartOptions} />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* Utility Type Breakdown */}
                        <Row className="mb-4">
                            {chartData?.utilityTypes.map((type, idx) => {
                                const icons = {
                                    Water: FiDroplet,
                                    Electric: FiZap,
                                    Trash: FiTrash2,
                                    Gas: FiActivity,
                                };
                                const colors = {
                                    Water: "info",
                                    Electric: "warning",
                                    Trash: "success",
                                    Gas: "danger",
                                };
                                const Icon = icons[type] || FiTrendingUp;
                                const color = colors[type] || "primary";
                                return (
                                    <Col lg={3} md={6} key={type}>
                                        <UtilityTypeCard
                                            type={type}
                                            amount={chartData.utilityTotals[type]}
                                            count={reportData.details?.filter(b => b.utilityTypeName === type).length || 0}
                                            color={color}
                                            icon={Icon}
                                        />
                                    </Col>
                                );
                            })}
                        </Row>

                        {/* Search and Details Table */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <h5 className="mb-0">Utility Bills Details</h5>
                                    <div style={{ width: "300px" }}>
                                        <Input
                                            type="text"
                                            placeholder="Search by utility, tenant, unit..."
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

export default UtilityBillsReport;
