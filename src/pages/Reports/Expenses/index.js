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
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ReportsAPI } from "../../../helpers/backend_helper";
import { getBuildings as onGetBuildings } from "../../../slices/thunks";
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
    document.title = "Expense Report | Degaanly";
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
      <div style="display: flex; gap: 40px; margin-bottom: 30px; flex-wrap: wrap;">
        <div style="min-width: 300px; flex: 1;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Report Summary</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Expenses</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${summary.totalExpenses || 0}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Total Amount</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #ef4444;">${formatCurrency(summary.totalExpenseAmount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Monthly Average</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${formatCurrency(summary.monthlyExpenseTotal)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Categories Count</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${categories.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${categories.length > 0 ? `
        <div style="min-width: 300px; flex: 1;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">Category Summary</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #1e293b; font-weight: 600;">Category</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #1e293b; font-weight: 600; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map((cat) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-transform: capitalize;">${cat.category}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #ef4444;">${formatCurrency(cat.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ` : ""}
      </div>
    `;

        const totalAmount = filteredRows.reduce((sum, row) => sum + (row.amount || 0), 0);
        const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">SQN</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Expense #</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Category</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Description</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #cbd5e1;">Building</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Amount</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">Status</th>
           </tr>
        </thead>
        <tbody>
          ${filteredRows.map((row, idx) => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                ${row.expenseNumber}<br/>
                <small>${formatDate(row.expenseDate)}</small>
              </td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                <span style="text-transform: capitalize;">${row.category}</span>
              </td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                ${row.description || "-"}<br/>
                <small>Payee: ${row.payee?.name || "-"}</small>
              </td>
              <td style="padding: 12px; border: 1px solid #cbd5e1;">
                ${row.building?.name || "-"}<br/>
                <small>${row.building?.code || "-"}</small>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1; color: #ef4444;">${formatCurrency(row.amount)}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #cbd5e1;">
                <span style="background: ${row.approval?.status === 'approved' ? '#d4edda' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px;">
                  ${row.approval?.status?.toUpperCase() || "PENDING"}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr style="background: #f8f9fa; font-weight: bold; border-top: 2px solid #64748b;">
            <td colspan="5" style="padding: 12px; text-align: right; border: 1px solid #cbd5e1;">Total:</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #cbd5e1; color: #ef4444;">${formatCurrency(totalAmount)}</td>
            <td style="border: 1px solid #cbd5e1;"></td>
          </tr>
        </tfoot>
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
            <h1>Expense Report</h1>
            <div class="date">Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}</div>
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
                        {/* Summary Tables */}
                        <Row className="mb-4">
                            <Col md={6} className="mb-3">
                                <Card className="border-0 shadow-sm h-100">
                                    <CardBody className="p-4">
                                        <h5 className="mb-3">Report Summary</h5>
                                        <div className="table-responsive">
                                            <table className="table table-bordered mb-0" style={{ borderColor: "#cbd5e1" }}>
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Expenses</td>
                                                        <td className="fw-bold" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{summary?.totalExpenses || 0}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Total Amount</td>
                                                        <td className="fw-bold text-danger" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.totalExpenseAmount || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Monthly Average</td>
                                                        <td className="fw-bold" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(summary?.monthlyExpenseTotal || 0)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Categories Count</td>
                                                        <td className="fw-bold" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{categories.length}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                            {categories.length > 0 && (
                                <Col md={6} className="mb-3">
                                    <Card className="border-0 shadow-sm h-100">
                                        <CardBody className="p-4">
                                            <h5 className="mb-3">Category Summary</h5>
                                            <div className="table-responsive" style={{ maxHeight: "220px", overflowY: "auto" }}>
                                                <table className="table table-bordered mb-0" style={{ borderColor: "#cbd5e1" }}>
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Category</th>
                                                            <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {categories.map((cat, idx) => (
                                                            <tr key={idx}>
                                                                <td className="text-capitalize" style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{cat.category}</td>
                                                                <td className="fw-bold text-danger" style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{formatCurrency(cat.amount)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            )}
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
                                <div className="table-responsive px-4 pb-4">
                                    <table className="table table-bordered align-middle mb-0" style={{ borderColor: "#cbd5e1" }}>
                                        <thead className="table-light">
                                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #cbd5e1" }}>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1", width: "70px", textAlign: "center" }}>SQN</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Expense</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Category</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Description</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Building</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Amount</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Payment</th>
                                                <th style={{ padding: "12px", color: "#1e293b", fontWeight: 600, border: "1px solid #cbd5e1" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRows.length > 0 ? (
                                                filteredRows.map((row, rowIdx) => (
                                                    <tr key={row._id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", textAlign: "center" }}>{rowIdx + 1}</td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold mb-1">{row.expenseNumber}</div>
                                                            <small className="text-muted">{formatDate(row.expenseDate)}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                 {getCategoryIcon(row.category)}
                                                                 <span className="fw-semibold text-capitalize">{row.category}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div>{row.description || "-"}</div>
                                                            {row.payee?.name && (
                                                                <small className="text-muted">Payee: {row.payee.name}</small>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="fw-semibold">{row.building?.name || "-"}</div>
                                                            <small className="text-muted">{row.building?.code || "-"}</small>
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1", fontWeight: "bold" }} className="text-danger">
                                                            {formatCurrency(row.amount)}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <div className="d-flex align-items-center gap-1">
                                                                {getPaymentMethodIcon(row.payment?.method)}
                                                                <span className="text-capitalize">{row.payment?.method || "-"}</span>
                                                            </div>
                                                            {row.payment?.transactionId && (
                                                                <small className="text-muted">Ref: {row.payment.transactionId}</small>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                            <Badge
                                                                color={row.approval?.status === "approved" ? "success" : "warning"}
                                                                className="d-inline-flex align-items-center gap-1 px-3 py-2"
                                                            >
                                                                {row.approval?.status === "approved" ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                                                                <span className="ms-1 text-capitalize">{row.approval?.status || "Pending"}</span>
                                                            </Badge>
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
                                                <td colSpan="5" className="text-end fw-bold" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>Total:</td>
                                                <td className="fw-bold text-danger" style={{ padding: "12px", border: "1px solid #cbd5e1" }}>
                                                    {formatCurrency(filteredRows.reduce((sum, row) => sum + (row.amount || 0), 0))}
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

export default ExpenseReport;
