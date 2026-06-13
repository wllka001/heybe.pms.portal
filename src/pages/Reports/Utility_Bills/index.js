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
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../../helpers/backend_helper";
import { getBuildings as onGetBuildings, getLeases as onGetLeases } from "../../../slices/thunks";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

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
    document.title = "Utility Bills Report | Degaanly";
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

        reportData.details.forEach((bill) => {
            const type = bill.utilityTypeName || bill.utilityType;
            utilityTotals[type] = (utilityTotals[type] || 0) + (bill.totalAmount || 0);
        });

        return {
            utilityTotals,
            utilityTypes: Object.keys(utilityTotals),
        };
    }, [reportData]);

    const filteredRows = useMemo(() => {
        if (!reportData?.details) return [];
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return reportData.details;
        return reportData.details.filter((row) =>
            JSON.stringify(row).toLowerCase().includes(keyword)
        );
    }, [reportData, searchText]);

    const exportRows = useMemo(() => {
        return filteredRows.map((row, idx) => ({
            "SQN": idx + 1,
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
      <div style="display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Utility Summary</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Amount</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #3b82f6;">${formatCurrency(reportData?.summary?.grandTotal || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Consumption</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #0ea5e9;">${reportData?.summary?.totalConsumption || 0} units</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Tax</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #eab308;">${formatCurrency(reportData?.summary?.totalTaxAmount || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Bills</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${reportData?.summary?.billedCount || 0} / ${reportData?.summary?.totalBills || 0} Billed</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="flex: 1; min-width: 300px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Utility Type Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Type</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Bills</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${chartData?.utilityTypes.map((type) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">${type}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${reportData.details?.filter(b => b.utilityTypeName === type).length || 0}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #10b981;">${formatCurrency(chartData.utilityTotals[type] || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
 
        const totalConsumption = filteredRows.reduce((sum, row) => sum + (row.consumption || 0), 0);
        const totalAmount = filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">SQN</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Utility</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Unit/Tenant</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">Consumption</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Rate</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Amount</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">${row.utilityTypeName || row.utilityType}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                Unit ${row.unit?.unitNumber || "-"}<br/>
                <small>${row.tenant?.fullName || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${row.consumption || 0}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">${formatCurrency(row.ratePerUnit || row.fixedAmount)}</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; color: #10b981;">${formatCurrency(row.totalAmount)}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">
                <span style="background: ${row.isBilled ? "#d4edda" : "#fff3cd"}; padding: 4px 8px; border-radius: 4px;">
                  ${row.isBilled ? "Billed" : "Pending"}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Total:</td>
            <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${totalConsumption} units</td>
            <td style="border: 1px solid #cbd5e1;"></td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #10b981;">${formatCurrency(totalAmount)}</td>
            <td style="border: 1px solid #cbd5e1;"></td>
          </tr>
        </tfoot>
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
            <h1>Utility Bills Report</h1>
            <div class="date">Period: ${monthOptions.find(m => m.value === billingMonth)?.label} ${billingYear}</div>
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
                        {/* Summary Tables */}
                        <Row className="mb-4">
                            <Col md={6} className="mb-3">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardBody className="p-4">
                                        <h5 className="mb-3">Utility Summary</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered mb-0" style={{ borderColor: "#cbd5e1" }}>
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Amount</td>
                                                        <td className="fw-bold text-primary" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(reportData.summary?.grandTotal || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Consumption</td>
                                                        <td className="fw-bold text-info" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{`${reportData.summary?.totalConsumption || 0} units`}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Tax</td>
                                                        <td className="fw-bold text-warning" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(reportData.summary?.totalTaxAmount || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Bills</td>
                                                        <td className="fw-bold text-dark" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{`${reportData.summary?.billedCount || 0} / ${reportData.summary?.totalBills || 0} Billed`}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardBody className="p-4">
                                        <h5 className="mb-3">Utility Type Breakdown</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered mb-0" style={{ borderColor: "#cbd5e1" }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                        <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Type</th>
                                                        <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>Bills</th>
                                                        <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Total Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {chartData?.utilityTypes.map((type) => (
                                                        <tr key={type}>
                                                            <td style={{ padding: "8px", border: "1px solid #cbd5e1" }} className="fw-semibold">{type}</td>
                                                            <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>{reportData.details?.filter(b => b.utilityTypeName === type).length || 0}</td>
                                                            <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }} className="fw-bold text-success">{formatCurrency(chartData.utilityTotals[type] || 0)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
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
                                <div className="table-responsive px-4 pb-4">
                                    <table className="table table-bordered align-middle mb-0" style={{ borderColor: "#cbd5e1" }}>
                                        <thead className="table-light">
                                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #cbd5e1" }}>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1", width: "70px", textAlign: "center" }}>SQN</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Utility</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Unit/Tenant</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Consumption</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Rate</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Amount</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Status</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Reading Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRows.length > 0 ? (
                                                filteredRows.map((row, idx) => (
                                                    <tr key={row._id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>{idx + 1}</td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                {getUtilityIcon(row.utilityType)}
                                                                <span className="fw-semibold">{row.utilityTypeName || row.utilityType}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div>
                                                                <div className="fw-semibold">Unit {row.unit?.unitNumber || "-"}</div>
                                                                <small className="text-muted">{row.tenant?.fullName || "-"}</small>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                                                            <div className="fw-semibold">{row.consumption || 0}</div>
                                                            <small className="text-muted">units</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            {formatCurrency(row.ratePerUnit || row.fixedAmount)}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", fontWeight: "bold" }} className="text-success">
                                                            {formatCurrency(row.totalAmount)}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <Badge color={row.isBilled ? "success" : "warning"} className="px-3 py-1">
                                                                {row.isBilled ? "Billed" : "Pending"}
                                                            </Badge>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <small className="text-muted">{formatDate(row.readings?.current?.date)}</small>
                                                            {row.readings?.current?.notes && (
                                                                <div className="small text-muted">{row.readings.current.notes}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center p-4 text-muted" style={{ border: "1px solid #cbd5e1" }}>
                                                        No records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot style={{ borderTop: "2px solid #64748b" }}>
                                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                                <td colSpan="3" className="text-end fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>Total:</td>
                                                <td className="fw-bold text-center" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {filteredRows.reduce((sum, row) => sum + (row.consumption || 0), 0)} units
                                                </td>
                                                <td style={{ border: "1px solid #cbd5e1" }}></td>
                                                <td className="fw-bold text-success" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0))}
                                                </td>
                                                <td colSpan="2" style={{ border: "1px solid #cbd5e1" }}></td>
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

export default UtilityBillsReport;
