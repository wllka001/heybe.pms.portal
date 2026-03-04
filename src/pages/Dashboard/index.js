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
  Table,
  Progress,
  Spinner,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import useAuthUser from "../../Components/Hooks/useAuthUser";
import { setAuthorization } from "../../helpers/api_helper";
import { getDashboardOverview } from "../../helpers/backend_helper";

const defaultOverview = {
  generatedAt: "",
  summary: {
    totalUsers: 0,
    totalBusinesses: 0,
    approvedBusinesses: 0,
    pendingBusinesses: 0,
    rejectedBusinesses: 0,
    totalPackages: 0,
    totalOrders: 0,
    totalReviews: 0,
    totalRevenue: 0,
    averageRating: 0,
  },
  orders: {
    byStatus: {
      RESERVED: 0,
      PAID: 0,
      READY_FOR_PICKUP: 0,
      COMPLETED: 0,
      EXPIRED: 0,
      CANCELLED: 0,
    },
    today: {
      count: 0,
      revenue: 0,
    },
  },
  trends: {
    ordersLast7Days: [],
    usersLast7Days: [],
    businessesLast7Days: [],
  },
  recent: {
    orders: [],
    reviews: [],
    businesses: [],
    recentLogins: [],
  },
};

const Dashboard = () => {
  document.title = "Dashboard | apartment";

  const authUser = useAuthUser();
  const obj = JSON.parse(sessionStorage.getItem("authUser"));
  const userName = obj.data.user.firstName || "Admin";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(defaultOverview);
  const [timeRange, setTimeRange] = useState("7days");

  const fetchOverview = useCallback(async () => {
    setLoading(true);
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
    }
  }, []);

  useEffect(() => {
    if (authUser?.token) {
      setAuthorization(authUser.token);
    }
    fetchOverview();
  }, [authUser?.token, fetchOverview]);

  const summary = overview?.summary || defaultOverview.summary;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format number with K/M suffixes
  const formatNumber = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value?.toLocaleString() || 0;
  };

  const summaryCards = [
    {
      key: "users",
      title: "Total Users",
      value: formatNumber(summary.totalUsers),
      trend: "+12%",
      icon: "ri-team-line",
      color: "primary",
      bgColor: "rgba(13, 110, 253, 0.1)",
    },
    {
      key: "businesses",
      title: "Total Businesses",
      value: formatNumber(summary.totalBusinesses),
      trend: "+8%",
      icon: "ri-store-2-line",
      color: "success",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      key: "orders",
      title: "Total Orders",
      value: formatNumber(summary.totalOrders),
      trend: "+23%",
      icon: "ri-shopping-bag-3-line",
      color: "warning",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
      key: "revenue",
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      trend: "+15%",
      icon: "ri-money-dollar-circle-line",
      color: "info",
      bgColor: "rgba(13, 202, 240, 0.1)",
    },
    {
      key: "reviews",
      title: "Total Reviews",
      value: formatNumber(summary.totalReviews),
      trend: "+5%",
      icon: "ri-star-smile-line",
      color: "purple",
      bgColor: "rgba(111, 66, 193, 0.1)",
    },
    {
      key: "avg",
      title: "Average Rating",
      value: Number(summary.averageRating || 0).toFixed(1),
      suffix: "/5.0",
      icon: "ri-star-smile-line",
      color: "warning",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
  ];

  const ordersStatusData = useMemo(() => {
    const byStatus = overview?.orders?.byStatus || {};
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return Object.keys(byStatus).map((status) => ({
      label: status.replaceAll("_", " "),
      value: Number(byStatus[status] || 0),
      percentage: total > 0 ? Math.round((byStatus[status] / total) * 100) : 0,
      color:
        status === "COMPLETED"
          ? "success"
          : status === "CANCELLED"
            ? "danger"
            : status === "EXPIRED"
              ? "secondary"
              : status === "PAID"
                ? "info"
                : status === "READY_FOR_PICKUP"
                  ? "warning"
                  : "primary",
    }));
  }, [overview?.orders?.byStatus]);

  const businessApprovalData = useMemo(() => {
    const approved = summary.approvedBusinesses || 0;
    const pending = summary.pendingBusinesses || 0;
    const rejected = summary.rejectedBusinesses || 0;
    const total = approved + pending + rejected;

    return {
      approved,
      pending,
      rejected,
      total,
      approvedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
      rejectedPercentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
    };
  }, [summary]);

  const ordersTrendChart = useMemo(() => {
    const source = overview?.trends?.ordersLast7Days || [];
    const categories = source.map((item) => {
      const date = new Date(item?.date || "");
      return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    });

    return {
      series: [
        {
          name: "Orders",
          data: source.map((item) => Number(item?.count || 0)),
        },
      ],
      options: {
        chart: {
          toolbar: { show: false },
          zoom: { enabled: false },
          sparkline: { enabled: false },
          fontFamily: "Inter, sans-serif",
        },
        stroke: {
          width: 3,
          curve: "smooth",
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.5,
            opacityTo: 0.1,
            stops: [0, 90, 100],
          },
        },
        dataLabels: { enabled: false },
        colors: ["#0ab39c"],
        markers: {
          size: 4,
          colors: ["#0ab39c"],
          strokeColors: "#fff",
          strokeWidth: 2,
          hover: {
            size: 6,
          },
        },
        xaxis: {
          categories: categories,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            style: {
              colors: "#878a99",
              fontSize: "12px",
            },
          },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
          labels: {
            style: {
              colors: "#878a99",
              fontSize: "12px",
            },
          },
        },
        grid: {
          borderColor: "#f1f1f1",
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
        },
        tooltip: {
          theme: "dark",
          x: { show: true },
          marker: { show: false },
        },
      },
    };
  }, [overview?.trends?.ordersLast7Days]);

  const growthTrendChart = useMemo(() => {
    const users = overview?.trends?.usersLast7Days || [];
    const businesses = overview?.trends?.businessesLast7Days || [];
    const categories = users.map((item) => {
      const date = new Date(item?.date || "");
      return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    });

    return {
      series: [
        {
          name: "Users",
          data: users.map((item) => Number(item?.count || 0)),
        },
        {
          name: "Businesses",
          data: businesses.map((item) => Number(item?.count || 0)),
        },
      ],
      options: {
        chart: {
          toolbar: { show: false },
          zoom: { enabled: false },
          fontFamily: "Inter, sans-serif",
        },
        stroke: {
          width: 3,
          curve: "smooth",
        },
        dataLabels: { enabled: false },
        colors: ["#405189", "#0ab39c"],
        markers: {
          size: 4,
          hover: { size: 6 },
        },
        xaxis: {
          categories: categories,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            style: {
              colors: "#878a99",
              fontSize: "12px",
            },
          },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
          labels: {
            style: {
              colors: "#878a99",
              fontSize: "12px",
            },
          },
        },
        grid: {
          borderColor: "#f1f1f1",
          strokeDashArray: 4,
        },
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "13px",
          labels: { colors: "#495057" },
          markers: { width: 8, height: 8, radius: 4 },
        },
        tooltip: {
          theme: "dark",
          shared: true,
        },
      },
    };
  }, [overview?.trends?.usersLast7Days, overview?.trends?.businessesLast7Days]);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Dashboard" pageTitle="Overview" />

        {/* Welcome Section */}
        <Row className="mb-4 g-3">
          <Col lg={8}>
            <Card className="border-0 shadow-sm bg-primary h-100 text-white overflow-hidden">
              <div className="position-absolute end-0 top-0 opacity-10">
                <i className="ri-stack-line" style={{ fontSize: "120px" }}></i>
              </div>
              <CardBody className="p-4">
                <Row className="align-items-center">
                  <Col sm={8}>
                    <h1 className="display-6 fw-bold mb-2 text-white">
                      Welcome back, {userName || "Admin"}! 👋
                    </h1>
                    <p className="text-white-75 mb-3 fs-5">
                      Here's what's happening with your platform today.
                    </p>
                    <div className="d-flex gap-3 flex-wrap">
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block">Today's Orders</small>
                        <span className="text-white fw-bold fs-4">
                          {overview?.orders?.today?.count || 0}
                        </span>
                      </div>
                      <div className="bg-white-10 rounded-3 px-3 py-2">
                        <small className="text-white-75 d-block">Today's Revenue</small>
                        <span className="text-white fw-bold fs-4">
                          {formatCurrency(overview?.orders?.today?.revenue || 0)}
                        </span>
                      </div>
                    </div>
                  </Col>

                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="text-muted mb-0">Last Updated</h6>
                  <Button
                    color="light"
                    size="sm"
                    onClick={fetchOverview}
                    disabled={loading}
                    className="rounded-pill"
                  >
                    <i className={`ri-refresh-line me-1 ${loading ? "spin" : ""}`}></i>
                    Refresh
                  </Button>
                </div>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm">
                      <div className="avatar-title bg-light text-primary rounded-circle">
                        <i className="ri-time-line fs-4"></i>
                      </div>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="mb-1">
                      {overview?.generatedAt
                        ? new Date(overview.generatedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </h5>
                    <p className="text-muted small mb-0">
                      {overview?.generatedAt
                        ? new Date(overview.generatedAt).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                        : "No data available"}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {loading ? (
          <Loader />
        ) : error ? (
          <Card className="border-0 shadow-sm mb-4">
            <CardBody className="text-center py-5">
              <div className="avatar-lg mx-auto mb-3">
                <div className="avatar-title bg-danger-subtle text-danger rounded-circle fs-1">
                  <i className="ri-error-warning-line"></i>
                </div>
              </div>
              <h5 className="mb-2">Failed to Load Dashboard</h5>
              <p className="text-muted mb-3">{error}</p>
              <Button color="primary" onClick={fetchOverview}>
                <i className="ri-refresh-line me-2"></i>
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
                  <Card className="border-0 shadow-sm h-100 card-hover">
                    <CardBody className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: item.bgColor,
                          }}
                        >
                          <i className={`${item.icon} fs-24 text-${item.color}`}></i>
                        </div>
                        {item.trend && (
                          <Badge color="success" pill className="bg-success-subtle text-success border-0">
                            <i className="ri-arrow-up-line me-1"></i>
                            {item.trend}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-muted text-uppercase fs-12 mb-1">{item.title}</p>
                        <div className="d-flex align-items-baseline">
                          <h4 className="mb-0 fw-bold">{item.value}</h4>
                          {item.suffix && (
                            <span className="text-muted ms-1 fs-13">{item.suffix}</span>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Charts Row */}
            <Row className="g-4 mb-4">
              <Col xl={7}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Order Trends</h5>
                        <p className="text-muted small mb-0">Daily order volume for the last 7 days</p>
                      </div>
                      <div className="d-flex gap-2">
                        <Badge color="light" className="rounded-pill px-3 text-primary py-2">
                          <span className="d-inline-block rounded-circle me-1" style={{ width: "8px", height: "8px", backgroundColor: "#338427" }}></span>
                          Orders
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <ReactApexChart
                      options={ordersTrendChart.options}
                      series={ordersTrendChart.series}
                      type="area"
                      height={320}
                    />
                  </CardBody>
                </Card>
              </Col>
              <Col xl={5}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Business Approvals</h5>
                        <p className="text-muted small mb-0">Current approval status distribution</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block">
                        <div className="avatar-xl">
                          <div className="avatar-title bg-light rounded-circle">
                            <span className="fs-2 text-primary fw-bold">{businessApprovalData.total}</span>
                            <span className="fs-6 text-primary">Total</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <Badge color="success" className="rounded-pill me-2">●</Badge>
                          <span className="fw-medium">Approved</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">{businessApprovalData.approved}</span>
                          <span className="text-muted small">{businessApprovalData.approvedPercentage}%</span>
                        </div>
                      </div>
                      <Progress
                        value={businessApprovalData.approvedPercentage}
                        color="success"
                        className="rounded-pill mb-3"
                        style={{ height: "6px" }}
                      />

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <Badge color="warning" className="rounded-pill me-2">●</Badge>
                          <span className="fw-medium">Pending</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">{businessApprovalData.pending}</span>
                          <span className="text-muted small">{businessApprovalData.pendingPercentage}%</span>
                        </div>
                      </div>
                      <Progress
                        value={businessApprovalData.pendingPercentage}
                        color="warning"
                        className="rounded-pill mb-3"
                        style={{ height: "6px" }}
                      />

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <Badge color="danger" className="rounded-pill me-2">●</Badge>
                          <span className="fw-medium">Rejected</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">{businessApprovalData.rejected}</span>
                          <span className="text-muted small">{businessApprovalData.rejectedPercentage}%</span>
                        </div>
                      </div>
                      <Progress
                        value={businessApprovalData.rejectedPercentage}
                        color="danger"
                        className="rounded-pill"
                        style={{ height: "6px" }}
                      />
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Orders by Status & Growth Chart */}
            <Row className="g-4 mb-4">
              <Col xl={5}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Orders by Status</h5>
                        <p className="text-muted small mb-0">Current order status distribution</p>
                      </div>
                      <Badge color="light" className="rounded-pill px-3 text-primary py-2">
                        Total: {Object.values(overview?.orders?.byStatus || {}).reduce((a, b) => a + b, 0)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="row g-3">
                      {ordersStatusData.map((item) => (
                        <Col md={6} key={item.label}>
                          <div className="border rounded-4 p-3 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <Badge
                                color={item.color}
                                className="rounded-pill px-3 py-2 bg-opacity-10 text-dark border-0"
                                style={{ fontWeight: "500" }}
                              >
                                {item.label}
                              </Badge>
                              <span className="fw-bold fs-5">{item.value}</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <Progress
                                value={item.percentage}
                                color={item.color}
                                className="flex-grow-1 rounded-pill me-2"
                                style={{ height: "4px" }}
                              />
                              <span className="text-muted small">{item.percentage}%</span>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col xl={7}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Growth Trends</h5>
                        <p className="text-muted small mb-0">Users vs Businesses growth (7 days)</p>
                      </div>
                      <div className="d-flex gap-3">
                        <div className="d-flex align-items-center">
                          <span className="d-inline-block rounded-circle me-1" style={{ width: "8px", height: "8px", backgroundColor: "#405189" }}></span>
                          <small>Users</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="d-inline-block rounded-circle me-1" style={{ width: "8px", height: "8px", backgroundColor: "#0ab39c" }}></span>
                          <small>Businesses</small>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <ReactApexChart
                      options={growthTrendChart.options}
                      series={growthTrendChart.series}
                      type="line"
                      height={280}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity Tables */}
            <Row className="g-4">
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Recent Reviews</h5>
                        <p className="text-muted small mb-0">Latest customer feedback</p>
                      </div>
                      <Badge color="primary" className="rounded-pill px-3 py-2">
                        {overview?.recent?.reviews?.length || 0} New
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="list-group list-group-flush">
                      {(overview?.recent?.reviews || []).length === 0 ? (
                        <div className="text-center py-5">
                          <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-light text-muted rounded-circle fs-2">
                              <i className="ri-chat-review-line"></i>
                            </div>
                          </div>
                          <h6 className="fw-normal text-muted">No recent reviews</h6>
                        </div>
                      ) : (
                        (overview?.recent?.reviews || []).map((item, index) => (
                          <div key={item.reviewId || index} className="list-group-item border-0 border-bottom px-4 py-3">
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0">
                                <div className="avatar-sm">
                                  <div className="avatar-title bg-light text-primary rounded-circle">
                                    {item.reviewerName?.charAt(0) || "U"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0">{item.reviewerName || "Anonymous"}</h6>
                                  <div className="d-flex align-items-center">
                                    <span className="text-warning me-1">★</span>
                                    <span className="fw-semibold">{item.rating || 0}</span>
                                  </div>
                                </div>
                                <p className="text-muted small mb-1">{item.businessName || "-"}</p>
                                <small className="text-muted">
                                  {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>

              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Recent Businesses</h5>
                        <p className="text-muted small mb-0">Newly registered businesses</p>
                      </div>
                      <Badge color="info" className="rounded-pill px-3 py-2">
                        {overview?.recent?.businesses?.length || 0} New
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="list-group list-group-flush">
                      {(overview?.recent?.businesses || []).length === 0 ? (
                        <div className="text-center py-5">
                          <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-light text-muted rounded-circle fs-2">
                              <i className="ri-store-line"></i>
                            </div>
                          </div>
                          <h6 className="fw-normal text-muted">No recent businesses</h6>
                        </div>
                      ) : (
                        (overview?.recent?.businesses || []).map((item) => (
                          <div key={item?._id} className="list-group-item border-0 border-bottom px-4 py-3">
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0">
                                {item?.logo ? (
                                  <img
                                    src={item.logo}
                                    alt={item.businessName}
                                    className="rounded-circle avatar-sm"
                                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                  />
                                ) : (
                                  <div className="avatar-sm">
                                    <div className="avatar-title bg-light text-primary rounded-circle">
                                      <i className="ri-store-2-line"></i>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0">{item?.businessName || "-"}</h6>
                                  <Badge
                                    color={
                                      item?.status === "APPROVED"
                                        ? "success"
                                        : item?.status === "REJECTED"
                                          ? "danger"
                                          : "warning"
                                    }
                                    pill
                                    className="px-3 py-2 bg-opacity-10 text-dark border-0"
                                  >
                                    {item?.status || "-"}
                                  </Badge>
                                </div>
                                <small className="text-muted">
                                  {item?.createdAt
                                    ? new Date(item.createdAt).toLocaleDateString()
                                    : "-"}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>

              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <CardHeader className="bg-transparent border-0 pt-4 px-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="card-title mb-1">Recent Logins</h5>
                        <p className="text-muted small mb-0">Latest user activity</p>
                      </div>
                      <Badge color="secondary" className="rounded-pill px-3 py-2">
                        {overview?.recent?.recentLogins?.length || 0} Today
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <div className="list-group list-group-flush">
                      {(overview?.recent?.recentLogins || []).length === 0 ? (
                        <div className="text-center py-5">
                          <div className="avatar-md mx-auto mb-3">
                            <div className="avatar-title bg-light text-muted rounded-circle fs-2">
                              <i className="ri-login-box-line"></i>
                            </div>
                          </div>
                          <h6 className="fw-normal text-muted">No login activity</h6>
                        </div>
                      ) : (
                        (overview?.recent?.recentLogins || []).map((item, index) => (
                          <div key={`${item.userId}-${item.loginAt}-${index}`} className="list-group-item border-0 border-bottom px-4 py-3">
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0">
                                <div className="avatar-sm">
                                  <div className="avatar-title bg-light text-info rounded-circle">
                                    {item.userName?.charAt(0) || "U"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-grow-1 ms-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0">{item.userName || "-"}</h6>
                                  <small className="text-muted">
                                    {item.loginAt
                                      ? new Date(item.loginAt).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                      : "-"}
                                  </small>
                                </div>
                                <div className="d-flex gap-2">
                                  <Badge color="light" pill className="px-2 py-1 text-primary" style={{ fontSize: "11px" }}>
                                    {item.role || "User"}
                                  </Badge>
                                  <small className="text-primary">
                                    <i className="ri-wifi-line me-1"></i>
                                    {item.ipAddress || "-"}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #0b63c1 0%, #0ab39c 100%);
        }
        .text-white-75 {
          color: rgba(255, 255, 255, 0.75);
        }
        .bg-white-10 {
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
        }
        .avatar-xl {
          width: 120px;
          height: 120px;
        }
        .avatar-xl .avatar-title {
          width: 120px;
          height: 120px;
          font-size: 2rem;
        }
        .bg-purple {
          background-color: #6f42c1 !important;
        }
        .bg-opacity-10 {
          --bs-bg-opacity: 0.1;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .progress {
          background-color: #f1f1f1;
        }
        .list-group-item {
          transition: background-color 0.2s ease;
        }
        .list-group-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;