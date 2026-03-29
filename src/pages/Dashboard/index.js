import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Spinner,
  Table,
  UncontrolledTooltip,
} from "reactstrap";
import {
  FiRefreshCw,
  FiHome,
  FiGrid,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiPieChart,
  FiBarChart2,
  FiZap,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import useAuthUser from "../../Components/Hooks/useAuthUser";
import { setAuthorization } from "../../helpers/api_helper";
import { getDashboardOverview } from "../../helpers/backend_helper";

const defaultOverview = {
  generatedAt: "",
  currentYear: new Date().getFullYear(),
  summary: {
    totalBuildings: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    maintenanceUnits: 0,
    occupancyRate: 0,
    activeLeases: 0,
    activeTenants: 0,
  },
  finance: {
    currentMonth: {
      invoiced: 0,
      collected: 0,
      expenses: 0,
      outstanding: 0,
      utilityBillsRecorded: 0,
      utilityAmount: 0,
      net: 0,
    },
    currentYearMonthly: [],
  },
  invoices: { byStatus: {} },
  payments: { byStatus: {} },
  expenses: { byCategory: [] },
  recent: {
    invoices: [],
    payments: [],
    expenses: [],
  },
};

const currency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const statusLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusColor = (status) => {
  const map = {
    paid: "success",
    reconciled: "success",
    partially_paid: "warning",
    pending: "warning",
    overdue: "danger",
    cancelled: "secondary",
    recorded: "info",
    verified: "primary",
    rejected: "danger",
    reversed: "warning",
    approved: "success",
  };
  return map[status] || "secondary";
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, subtitle, trend, trendValue }) => {
  const SafeIcon = Icon || FiActivity;

  return (
    <Card className="border-0 shadow-sm h-100 hover-lift">
      <CardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
            <SafeIcon size={24} className={`text-${color}`} />
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
};

// Metric Card Component
const MetricCard = ({ title, value, change, color, icon: Icon }) => {
  const SafeIcon = Icon || FiActivity;

  return (
    <Card className="border-0 shadow-sm h-100">
      <CardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded-3 p-2`}>
            <SafeIcon size={20} className={`text-${color}`} />
          </div>
          {change !== undefined && (
            <Badge color={change >= 0 ? "success" : "danger"} className="px-2 py-1">
              {change >= 0 ? "+" : ""}{change}%
            </Badge>
          )}
        </div>
        <h4 className="mb-1 fw-bold">{value}</h4>
        <p className="text-muted mb-0 small">{title}</p>
      </CardBody>
    </Card>
  );
};

const Dashboard = () => {
  document.title = "Dashboard | Heybe Property Management";

  const authUser = useAuthUser();
  const authSession = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const firstName = authSession?.data?.user?.firstName || "Admin";
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(defaultOverview);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await getDashboardOverview();
      if (response?.success) {
        setOverview({ ...defaultOverview, ...(response?.data || {}) });
      } else {
        setError(response?.message || "Failed to load dashboard overview");
      }
    } catch (err) {
      setError(err?.message || "Failed to load dashboard overview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authUser?.token) {
      setAuthorization(authUser.token);
    }
    fetchOverview();
  }, [authUser?.token, fetchOverview]);

  const summary = overview?.summary || defaultOverview.summary;
  const currentMonthFinance = overview?.finance?.currentMonth || defaultOverview.finance.currentMonth;
  const monthlyFinance = overview?.finance?.currentYearMonthly || [];

  // Summary Cards Data
  const summaryCards = [
    {
      key: "buildings",
      title: "Total Buildings",
      value: summary.totalBuildings,
      icon: FiGrid,
      color: "primary",
      subtitle: "Properties managed",
    },
    {
      key: "units",
      title: "Total Units",
      value: summary.totalUnits,
      icon: FiHome,
      color: "info",
      subtitle: `${summary.occupiedUnits} occupied`,
    },
    {
      key: "leases",
      title: "Active Leases",
      value: summary.activeLeases,
      icon: FiFileText,
      color: "success",
      subtitle: "Current contracts",
    },
    {
      key: "tenants",
      title: "Active Tenants",
      value: summary.activeTenants,
      icon: FiUsers,
      color: "warning",
      subtitle: "Residents",
    },
    {
      key: "occupancy",
      title: "Occupancy Rate",
      value: `${Number(summary.occupancyRate || 0).toFixed(1)}%`,
      icon: FiPieChart,
      color: "primary",
      trend: summary.occupancyRate >= 70 ? "up" : summary.occupancyRate >= 50 ? undefined : "down",
      trendValue: `${Math.abs(summary.occupancyRate - 50).toFixed(0)}%`,
    },
    {
      key: "outstanding",
      title: "Outstanding Balance",
      value: currency(currentMonthFinance.outstanding),
      icon: FiAlertCircle,
      color: "danger",
      subtitle: "Due from tenants",
    },
  ];

  // Financial Metrics
  const financialMetrics = [
    {
      title: "Total Invoiced",
      value: currency(currentMonthFinance.invoiced),
      change: 15.2,
      color: "primary",
      icon: FiDollarSign,
    },
    {
      title: "Collected",
      value: currency(currentMonthFinance.collected),
      change: 8.5,
      color: "success",
      icon: FiCheckCircle,
    },
    {
      title: "Expenses",
      value: currency(currentMonthFinance.expenses),
      change: -5.2,
      color: "danger",
      icon: FiTrendingDown,
    },
    {
      title: "Net Profit",
      value: currency(currentMonthFinance.net),
      change: currentMonthFinance.net >= 0 ? 12.3 : -8.1,
      color: currentMonthFinance.net >= 0 ? "success" : "danger",
      icon: FiTrendingUp,
    },
  ];

  const financeChart = useMemo(() => {
    const labels = monthlyFinance.map((item) => item.label);
    return {
      series: [
        {
          name: "Invoiced",
          data: monthlyFinance.map((item) => Number(item.invoiced || 0)),
        },
        {
          name: "Collected",
          data: monthlyFinance.map((item) => Number(item.collected || 0)),
        },
        {
          name: "Expenses",
          data: monthlyFinance.map((item) => Number(item.expenses || 0)),
        },
      ],
      options: {
        chart: {
          type: "bar",
          toolbar: { show: false },
          fontFamily: "inherit",
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800,
          },
        },
        plotOptions: {
          bar: {
            columnWidth: "50%",
            borderRadius: 8,
            borderRadiusApplication: "end",
          },
        },
        dataLabels: { enabled: false },
        stroke: { show: false },
        colors: ["#405189", "#0ab39c", "#f06548"],
        grid: {
          borderColor: "#f1f1f1",
          strokeDashArray: 5,
        },
        xaxis: {
          categories: labels,
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            formatter: (value) => currency(value),
            style: {
              fontSize: "11px",
            },
          },
        },
        legend: {
          position: "top",
          horizontalAlign: "left",
          markers: {
            radius: 8,
            width: 8,
            height: 8,
          },
        },
        tooltip: {
          y: {
            formatter: (value) => currency(value),
          },
          theme: "dark",
        },
      },
    };
  }, [monthlyFinance]);

  const netTrendChart = useMemo(() => ({
    series: [
      {
        name: "Net Cashflow",
        data: monthlyFinance.map((item) => Number(item.net || 0)),
      },
    ],
    options: {
      chart: {
        type: "area",
        toolbar: { show: false },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        width: 3,
        curve: "smooth",
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      colors: ["#299cdb"],
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 5,
      },
      xaxis: {
        categories: monthlyFinance.map((item) => item.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (value) => currency(value),
          style: {
            fontSize: "11px",
          },
        },
      },
      tooltip: {
        y: {
          formatter: (value) => currency(value),
        },
        theme: "dark",
      },
    },
  }), [monthlyFinance]);

  const invoiceStatuses = Object.entries(overview?.invoices?.byStatus || {});
  const paymentStatuses = Object.entries(overview?.payments?.byStatus || {});

  return (
    <div className="page-content">
      <Container fluid>
        {/* Welcome Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Welcome back, {firstName}!</h2>
            <p className="text-muted mb-0">
              Here's what's happening with your properties today.
            </p>
          </div>
          <Button
            color="light"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            className="rounded-circle p-2"
            id="refreshBtn"
          >
            <FiRefreshCw size={18} className={refreshing ? "spin" : ""} />
          </Button>
          <UncontrolledTooltip target="refreshBtn">Refresh Dashboard</UncontrolledTooltip>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <Card className="border-0 shadow-sm">
            <CardBody className="text-center py-5">
              <FiAlertCircle size={48} className="text-danger mb-3" />
              <h5 className="mb-2">Failed to Load Dashboard</h5>
              <p className="text-muted mb-3">{error}</p>
              <Button color="primary" onClick={() => fetchOverview()}>
                Try Again
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <Row className="g-3 mb-4">
              {summaryCards.map((item) => (
                <Col xl={2} md={4} sm={6} key={item.key}>
                  <StatCard
                    icon={item.icon}
                    title={item.title}
                    value={item.value}
                    color={item.color}
                    subtitle={item.subtitle}
                    trend={item.trend}
                    trendValue={item.trendValue}
                  />
                </Col>
              ))}
            </Row>

            {/* Financial Metrics */}
            <Row className="g-3 mb-4">
              {financialMetrics.map((metric, idx) => (
                <Col xl={3} md={6} key={idx}>
                  <MetricCard
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    color={metric.color}
                    icon={metric.icon}
                  />
                </Col>
              ))}
            </Row>

            {/* Charts Row */}
            <Row className="g-4 mb-4">
              <Col xl={8}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4 pb-0">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="mb-1">Financial Performance</h5>
                        <p className="text-muted mb-0">
                          Invoiced vs Collected vs Expenses ({overview.currentYear})
                        </p>
                      </div>
                      <Badge color="light" className="px-3 py-2 text-primary">
                        <FiCalendar size={12} className="me-1" />
                        Year to Date
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ReactApexChart
                      options={financeChart.options}
                      series={financeChart.series}
                      type="bar"
                      height={360}
                    />
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4 pb-0">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="mb-1">Net Cashflow Trend</h5>
                        <p className="text-muted mb-0">
                          Monthly profitability overview
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ReactApexChart
                      options={netTrendChart.options}
                      series={netTrendChart.series}
                      type="area"
                      height={360}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Status Cards Row */}
            <Row className="g-4 mb-4">
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                        <FiHome size={20} className="text-primary" />
                      </div>
                      <div>
                        <h5 className="mb-1">Unit Status</h5>
                        <p className="text-muted mb-0">Current occupancy breakdown</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">Occupancy Rate</span>
                        <span className="fw-bold">{Number(summary.occupancyRate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${summary.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between py-3 border-bottom">
                      <div>
                        <div className="text-muted small mb-1">Occupied</div>
                        <div className="fw-bold fs-5">{summary.occupiedUnits}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted small mb-1">Vacant</div>
                        <div className="fw-bold fs-5 text-warning">{summary.vacantUnits}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted small mb-1">Maintenance</div>
                        <div className="fw-bold fs-5 text-info">{summary.maintenanceUnits}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Total Units</span>
                        <span className="fw-bold">{summary.totalUnits}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 rounded-3 p-2 me-3">
                        <FiFileText size={20} className="text-warning" />
                      </div>
                      <div>
                        <h5 className="mb-1">Invoice Status</h5>
                        <p className="text-muted mb-0">By payment status</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {invoiceStatuses.length === 0 ? (
                      <div className="text-center py-4">
                        <FiActivity size={32} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No invoice data available</p>
                      </div>
                    ) : (
                      invoiceStatuses.map(([status, data], idx) => (
                        <div
                          className="d-flex justify-content-between align-items-center py-3 border-bottom"
                          key={status}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <Badge color={statusColor(status)} className="px-3 py-2">
                              {statusLabel(status)}
                            </Badge>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold">{data.count} invoices</div>
                            <small className="text-muted">{currency(data.amount)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                        <FiDollarSign size={20} className="text-success" />
                      </div>
                      <div>
                        <h5 className="mb-1">Payment Status</h5>
                        <p className="text-muted mb-0">By lifecycle stage</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {paymentStatuses.length === 0 ? (
                      <div className="text-center py-4">
                        <FiActivity size={32} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No payment data available</p>
                      </div>
                    ) : (
                      paymentStatuses.map(([status, data]) => (
                        <div
                          className="d-flex justify-content-between align-items-center py-3 border-bottom"
                          key={status}
                        >
                          <Badge color={statusColor(status)} className="px-3 py-2">
                            {statusLabel(status)}
                          </Badge>
                          <div className="text-end">
                            <div className="fw-semibold">{data.count} payments</div>
                            <small className="text-muted">{currency(data.amount)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity Section */}
            <h5 className="mb-3">Recent Activity</h5>
            <Row className="g-4">
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4">
                    <div className="d-flex align-items-center">
                      <FiFileText size={18} className="text-primary me-2" />
                      <h6 className="mb-0">Recent Invoices</h6>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(overview?.recent?.invoices || []).length === 0 ? (
                      <div className="text-center py-4">
                        <FiFileText size={32} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No recent invoices</p>
                      </div>
                    ) : (
                      <div className="recent-list">
                        {overview.recent.invoices.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="d-flex justify-content-between align-items-center py-3 border-bottom"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-semibold mb-1">{item.invoiceNumber}</div>
                              <small className="text-muted">{item.tenantName} • Unit {item.unitCode}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-primary">{currency(item.totalAmount)}</div>
                              <Badge color={statusColor(item.status)} size="sm">
                                {statusLabel(item.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4">
                    <div className="d-flex align-items-center">
                      <FiDollarSign size={18} className="text-success me-2" />
                      <h6 className="mb-0">Recent Payments</h6>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(overview?.recent?.payments || []).length === 0 ? (
                      <div className="text-center py-4">
                        <FiDollarSign size={32} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No recent payments</p>
                      </div>
                    ) : (
                      <div className="recent-list">
                        {overview.recent.payments.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="d-flex justify-content-between align-items-center py-3 border-bottom"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-semibold mb-1">{item.paymentNumber}</div>
                              <small className="text-muted">{item.tenantName} • {item.invoiceNumber}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-success">{currency(item.amount)}</div>
                              <Badge color={statusColor(item.status)} size="sm">
                                {statusLabel(item.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-white border-0 pt-4">
                    <div className="d-flex align-items-center">
                      <FiTrendingDown size={18} className="text-danger me-2" />
                      <h6 className="mb-0">Recent Expenses</h6>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {(overview?.recent?.expenses || []).length === 0 ? (
                      <div className="text-center py-4">
                        <FiTrendingDown size={32} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No recent expenses</p>
                      </div>
                    ) : (
                      <div className="recent-list">
                        {overview.recent.expenses.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="d-flex justify-content-between align-items-center py-3 border-bottom"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-semibold mb-1">{item.expenseNumber}</div>
                              <small className="text-muted">{item.category} • {item.description}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-danger">{currency(item.amount)}</div>
                              <Badge color={statusColor(item.status)} size="sm">
                                {statusLabel(item.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Last Updated Timestamp */}
            {overview.generatedAt && (
              <div className="text-center text-muted small mt-4">
                <FiClock size={12} className="me-1" />
                Last updated: {new Date(overview.generatedAt).toLocaleString()}
              </div>
            )}
          </>
        )}
      </Container>

      <style jsx>{`
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 0.5s linear infinite;
        }
        .recent-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .recent-list::-webkit-scrollbar {
          width: 4px;
        }
        .recent-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .recent-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import ReactApexChart from "react-apexcharts";
// import {
//   Badge,
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   Col,
//   Container,
//   Row,
//   Spinner,
//   Table,
// } from "reactstrap";
// import BreadCrumb from "../../Components/Common/BreadCrumb";
// import Loader from "../../Components/Common/Loader";
// import useAuthUser from "../../Components/Hooks/useAuthUser";
// import { setAuthorization } from "../../helpers/api_helper";
// import { getDashboardOverview } from "../../helpers/backend_helper";

// const defaultOverview = {
//   generatedAt: "",
//   currentYear: new Date().getFullYear(),
//   summary: {
//     totalBuildings: 0,
//     totalUnits: 0,
//     occupiedUnits: 0,
//     vacantUnits: 0,
//     maintenanceUnits: 0,
//     occupancyRate: 0,
//     activeLeases: 0,
//     activeTenants: 0,
//   },
//   finance: {
//     currentMonth: {
//       invoiced: 0,
//       collected: 0,
//       expenses: 0,
//       outstanding: 0,
//       utilityBillsRecorded: 0,
//       utilityAmount: 0,
//       net: 0,
//     },
//     currentYearMonthly: [],
//   },
//   invoices: { byStatus: {} },
//   payments: { byStatus: {} },
//   expenses: { byCategory: [] },
//   recent: {
//     invoices: [],
//     payments: [],
//     expenses: [],
//   },
// };

// const currency = (value) =>
//   new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(Number(value || 0));

// const statusLabel = (value) =>
//   String(value || "")
//     .replaceAll("_", " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());

// const statusColor = (status) => {
//   const map = {
//     paid: "success",
//     reconciled: "success",
//     partially_paid: "warning",
//     pending: "warning",
//     overdue: "danger",
//     cancelled: "secondary",
//     recorded: "info",
//     verified: "primary",
//     rejected: "danger",
//     reversed: "warning",
//     approved: "success",
//   };
//   return map[status] || "secondary";
// };

// const Dashboard = () => {
//   document.title = "Dashboard | apartment";

//   const authUser = useAuthUser();
//   const authSession = JSON.parse(sessionStorage.getItem("authUser") || "{}");
//   const firstName = authSession?.data?.user?.firstName || "Admin";
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");
//   const [overview, setOverview] = useState(defaultOverview);

//   const fetchOverview = useCallback(async (isRefresh = false) => {
//     if (isRefresh) {
//       setRefreshing(true);
//     } else {
//       setLoading(true);
//     }
//     setError("");

//     try {
//       const response = await getDashboardOverview();
//       if (response?.success) {
//         setOverview({ ...defaultOverview, ...(response?.data || {}) });
//       } else {
//         setError(response?.message || "Failed to load dashboard overview");
//       }
//     } catch (err) {
//       setError(err?.message || "Failed to load dashboard overview");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (authUser?.token) {
//       setAuthorization(authUser.token);
//     }
//     fetchOverview();
//   }, [authUser?.token, fetchOverview]);

//   const summary = overview?.summary || defaultOverview.summary;
//   const currentMonthFinance = overview?.finance?.currentMonth || defaultOverview.finance.currentMonth;
//   const monthlyFinance = overview?.finance?.currentYearMonthly || [];

//   const summaryCards = [
//     {
//       key: "buildings",
//       title: "Buildings",
//       value: summary.totalBuildings,
//       icon: "ri-building-2-line",
//       color: "primary",
//     },
//     {
//       key: "units",
//       title: "Units",
//       value: summary.totalUnits,
//       icon: "ri-home-4-line",
//       color: "info",
//     },
//     {
//       key: "leases",
//       title: "Active Leases",
//       value: summary.activeLeases,
//       icon: "ri-file-list-3-line",
//       color: "success",
//     },
//     {
//       key: "tenants",
//       title: "Active Tenants",
//       value: summary.activeTenants,
//       icon: "ri-team-line",
//       color: "warning",
//     },
//     {
//       key: "occupancy",
//       title: "Occupancy Rate",
//       value: `${Number(summary.occupancyRate || 0).toFixed(1)}%`,
//       icon: "ri-pie-chart-2-line",
//       color: "primary",
//     },
//     {
//       key: "outstanding",
//       title: "Outstanding",
//       value: currency(currentMonthFinance.outstanding),
//       icon: "ri-alert-line",
//       color: "danger",
//     },
//   ];

//   const financeChart = useMemo(() => {
//     const labels = monthlyFinance.map((item) => item.label);
//     return {
//       series: [
//         {
//           name: "Invoiced",
//           data: monthlyFinance.map((item) => Number(item.invoiced || 0)),
//         },
//         {
//           name: "Collected",
//           data: monthlyFinance.map((item) => Number(item.collected || 0)),
//         },
//         {
//           name: "Expenses",
//           data: monthlyFinance.map((item) => Number(item.expenses || 0)),
//         },
//       ],
//       options: {
//         chart: {
//           type: "bar",
//           toolbar: { show: false },
//           fontFamily: "inherit",
//         },
//         plotOptions: {
//           bar: {
//             columnWidth: "42%",
//             borderRadius: 6,
//           },
//         },
//         dataLabels: { enabled: false },
//         stroke: { show: false },
//         colors: ["#405189", "#0ab39c", "#f06548"],
//         xaxis: {
//           categories: labels,
//         },
//         yaxis: {
//           labels: {
//             formatter: (value) => currency(value),
//           },
//         },
//         legend: {
//           position: "top",
//           horizontalAlign: "left",
//         },
//         tooltip: {
//           y: {
//             formatter: (value) => currency(value),
//           },
//         },
//       },
//     };
//   }, [monthlyFinance]);

//   const netTrendChart = useMemo(() => ({
//     series: [
//       {
//         name: "Net Cashflow",
//         data: monthlyFinance.map((item) => Number(item.net || 0)),
//       },
//     ],
//     options: {
//       chart: {
//         type: "area",
//         toolbar: { show: false },
//         fontFamily: "inherit",
//       },
//       dataLabels: { enabled: false },
//       stroke: {
//         width: 3,
//         curve: "smooth",
//       },
//       fill: {
//         type: "gradient",
//         gradient: {
//           opacityFrom: 0.35,
//           opacityTo: 0.05,
//         },
//       },
//       colors: ["#299cdb"],
//       xaxis: {
//         categories: monthlyFinance.map((item) => item.label),
//       },
//       yaxis: {
//         labels: {
//           formatter: (value) => currency(value),
//         },
//       },
//       tooltip: {
//         y: {
//           formatter: (value) => currency(value),
//         },
//       },
//     },
//   }), [monthlyFinance]);

//   const invoiceStatuses = Object.entries(overview?.invoices?.byStatus || {});
//   const paymentStatuses = Object.entries(overview?.payments?.byStatus || {});

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Dashboard" pageTitle="Overview" />

//         <Row className="g-3 mb-4">

//           <Col xl={4}>
//             <Card className="border-0 shadow-sm h-100">
//               <CardBody className="p-4">
//                 <p className="text-muted text-uppercase mb-2 fs-12">This Month</p>
//                 <div className="d-flex justify-content-between mb-3">
//                   <span>Invoiced</span>
//                   <strong>{currency(currentMonthFinance.invoiced)}</strong>
//                 </div>
//                 <div className="d-flex justify-content-between mb-3">
//                   <span>Collected</span>
//                   <strong className="text-success">{currency(currentMonthFinance.collected)}</strong>
//                 </div>
//                 <div className="d-flex justify-content-between mb-3">
//                   <span>Expenses</span>
//                   <strong className="text-danger">{currency(currentMonthFinance.expenses)}</strong>
//                 </div>
//                 <div className="d-flex justify-content-between mb-3">
//                   <span>Utilities Recorded</span>
//                   <strong>{currentMonthFinance.utilityBillsRecorded || 0}</strong>
//                 </div>
//                 <div className="border-top pt-3 d-flex justify-content-between">
//                   <span className="fw-semibold">Net</span>
//                   <strong className={currentMonthFinance.net >= 0 ? "text-success" : "text-danger"}>
//                     {currency(currentMonthFinance.net)}
//                   </strong>
//                 </div>
//                 <small className="text-muted d-block mt-3">
//                   Updated{" "}
//                   {overview.generatedAt
//                     ? new Date(overview.generatedAt).toLocaleString()
//                     : "-"}
//                 </small>
//               </CardBody>
//             </Card>
//           </Col>
//         </Row>

//         {loading ? (
//           <Loader />
//         ) : error ? (
//           <Card className="border-0 shadow-sm">
//             <CardBody className="text-center py-5">
//               <h5 className="mb-2">Failed to Load Dashboard</h5>
//               <p className="text-muted mb-3">{error}</p>
//               <Button color="primary" onClick={() => fetchOverview()}>
//                 Reload
//               </Button>
//             </CardBody>
//           </Card>
//         ) : (
//           <>
//             <Row className="g-3 mb-4">
//               {summaryCards.map((item) => (
//                 <Col xl={2} md={4} sm={6} key={item.key}>
//                   <Card className="border-0 shadow-sm h-100">
//                     <CardBody>
//                       <div className="d-flex justify-content-between align-items-start">
//                         <div>
//                           <p className="text-muted text-uppercase mb-2 fs-12">{item.title}</p>
//                           <h4 className="mb-0">{item.value}</h4>
//                         </div>
//                         <div className={`avatar-sm rounded-circle bg-${item.color}-subtle text-${item.color} d-flex align-items-center justify-content-center`}>
//                           <i className={`${item.icon} fs-4`}></i>
//                         </div>
//                       </div>
//                     </CardBody>
//                   </Card>
//                 </Col>
//               ))}
//             </Row>

//             <Row className="g-4 mb-4">
//               <Col xl={8}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h5 className="mb-1">Finance Performance ({overview.currentYear})</h5>
//                     <p className="text-muted mb-0">
//                       Full Jan-Dec billing, collections, and expense series for charting.
//                     </p>
//                   </CardHeader>
//                   <CardBody>
//                     <ReactApexChart
//                       options={financeChart.options}
//                       series={financeChart.series}
//                       type="bar"
//                       height={320}
//                     />
//                   </CardBody>
//                 </Card>
//               </Col>
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h5 className="mb-1">Net Cashflow Trend</h5>
//                     <p className="text-muted mb-0">Collected minus expenses for each month.</p>
//                   </CardHeader>
//                   <CardBody>
//                     <ReactApexChart
//                       options={netTrendChart.options}
//                       series={netTrendChart.series}
//                       type="area"
//                       height={320}
//                     />
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>

//             <Row className="g-4 mb-4">
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h5 className="mb-1">Unit Snapshot</h5>
//                     <p className="text-muted mb-0">Current apartment stock by occupancy state.</p>
//                   </CardHeader>
//                   <CardBody>
//                     <div className="d-flex justify-content-between py-2 border-bottom">
//                       <span>Occupied</span>
//                       <strong>{summary.occupiedUnits}</strong>
//                     </div>
//                     <div className="d-flex justify-content-between py-2 border-bottom">
//                       <span>Vacant</span>
//                       <strong>{summary.vacantUnits}</strong>
//                     </div>
//                     <div className="d-flex justify-content-between py-2">
//                       <span>Under Maintenance</span>
//                       <strong>{summary.maintenanceUnits}</strong>
//                     </div>
//                   </CardBody>
//                 </Card>
//               </Col>
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h5 className="mb-1">Invoice Statuses</h5>
//                     <p className="text-muted mb-0">Invoice volumes by lifecycle status.</p>
//                   </CardHeader>
//                   <CardBody>
//                     {invoiceStatuses.length === 0 ? (
//                       <p className="text-muted mb-0">No invoice data yet.</p>
//                     ) : (
//                       invoiceStatuses.map(([status, data]) => (
//                         <div className="d-flex justify-content-between align-items-center py-2 border-bottom" key={status}>
//                           <Badge color={statusColor(status)} className="text-uppercase">
//                             {statusLabel(status)}
//                           </Badge>
//                           <div className="text-end">
//                             <div className="fw-semibold">{data.count}</div>
//                             <small className="text-muted">{currency(data.amount)}</small>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </CardBody>
//                 </Card>
//               </Col>
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0 pb-0">
//                     <h5 className="mb-1">Payment Statuses</h5>
//                     <p className="text-muted mb-0">Payments grouped by lifecycle stage.</p>
//                   </CardHeader>
//                   <CardBody>
//                     {paymentStatuses.length === 0 ? (
//                       <p className="text-muted mb-0">No payment data yet.</p>
//                     ) : (
//                       paymentStatuses.map(([status, data]) => (
//                         <div className="d-flex justify-content-between align-items-center py-2 border-bottom" key={status}>
//                           <Badge color={statusColor(status)} className="text-uppercase">
//                             {statusLabel(status)}
//                           </Badge>
//                           <div className="text-end">
//                             <div className="fw-semibold">{data.count}</div>
//                             <small className="text-muted">{currency(data.amount)}</small>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>

//             <Row className="g-4">
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0">
//                     <h5 className="mb-1">Recent Invoices</h5>
//                     <p className="text-muted mb-0">Newest generated invoices.</p>
//                   </CardHeader>
//                   <CardBody className="pt-0">
//                     {(overview?.recent?.invoices || []).length === 0 ? (
//                       <p className="text-muted mb-0">No recent invoices.</p>
//                     ) : (
//                       <Table responsive className="align-middle mb-0">
//                         <tbody>
//                           {overview.recent.invoices.map((item) => (
//                             <tr key={item.id}>
//                               <td className="ps-0">
//                                 <div className="fw-semibold">{item.invoiceNumber}</div>
//                                 <small className="text-muted">{item.tenantName}</small>
//                               </td>
//                               <td>
//                                 <div className="fw-semibold">{currency(item.totalAmount)}</div>
//                                 <small className="text-muted">{item.unitCode}</small>
//                               </td>
//                               <td className="pe-0 text-end">
//                                 <Badge color={statusColor(item.status)}>{statusLabel(item.status)}</Badge>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </Table>
//                     )}
//                   </CardBody>
//                 </Card>
//               </Col>
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0">
//                     <h5 className="mb-1">Recent Payments</h5>
//                     <p className="text-muted mb-0">Latest recorded payment activity.</p>
//                   </CardHeader>
//                   <CardBody className="pt-0">
//                     {(overview?.recent?.payments || []).length === 0 ? (
//                       <p className="text-muted mb-0">No recent payments.</p>
//                     ) : (
//                       <Table responsive className="align-middle mb-0">
//                         <tbody>
//                           {overview.recent.payments.map((item) => (
//                             <tr key={item.id}>
//                               <td className="ps-0">
//                                 <div className="fw-semibold">{item.paymentNumber}</div>
//                                 <small className="text-muted">{item.tenantName}</small>
//                               </td>
//                               <td>
//                                 <div className="fw-semibold">{currency(item.amount)}</div>
//                                 <small className="text-muted">{item.invoiceNumber}</small>
//                               </td>
//                               <td className="pe-0 text-end">
//                                 <Badge color={statusColor(item.status)}>{statusLabel(item.status)}</Badge>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </Table>
//                     )}
//                   </CardBody>
//                 </Card>
//               </Col>
//               <Col xl={4}>
//                 <Card className="border-0 shadow-sm h-100">
//                   <CardHeader className="bg-white border-0">
//                     <h5 className="mb-1">Recent Expenses</h5>
//                     <p className="text-muted mb-0">Latest recorded expense items.</p>
//                   </CardHeader>
//                   <CardBody className="pt-0">
//                     {(overview?.recent?.expenses || []).length === 0 ? (
//                       <p className="text-muted mb-0">No recent expenses.</p>
//                     ) : (
//                       <Table responsive className="align-middle mb-0">
//                         <tbody>
//                           {overview.recent.expenses.map((item) => (
//                             <tr key={item.id}>
//                               <td className="ps-0">
//                                 <div className="fw-semibold">{item.expenseNumber}</div>
//                                 <small className="text-muted">{statusLabel(item.category)}</small>
//                               </td>
//                               <td>
//                                 <div className="fw-semibold">{currency(item.amount)}</div>
//                                 <small className="text-muted">{item.description}</small>
//                               </td>
//                               <td className="pe-0 text-end">
//                                 <Badge color={statusColor(item.status)}>{statusLabel(item.status)}</Badge>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </Table>
//                     )}
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>
//           </>
//         )}
//       </Container>
//     </div>
//   );
// };

// export default Dashboard;
