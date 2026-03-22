import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { LeasesAPI } from "../../helpers/backend_helper";
import {
  createLease as onCreateLease,
  getBuildings as onGetBuildings,
  getLeases as onGetLeases,
  getTenants as onGetTenants,
  getUnits as onGetUnits,
  terminateLease as onTerminateLease,
  updateLease as onUpdateLease,
} from "../../slices/thunks";

const leaseStatusOptions = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
];

const Leases = () => {
  document.title = "Leases | Apartment Management";
  const dispatch = useDispatch();

  const leaseSelector = createSelector(
    (state) => state.Leases,
    (s) => ({
      leases: s.leases,
      pagination: s.pagination,
      loading: s.loading,
    }),
  );
  const tenantSelector = createSelector((state) => state.Tenants, (s) => s.tenants || []);
  const buildingSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
  const unitSelector = createSelector((state) => state.Units, (s) => s.units || []);

  const { leases, pagination, loading } = useSelector(leaseSelector);
  const tenants = useSelector(tenantSelector);
  const buildings = useSelector(buildingSelector);
  const units = useSelector(unitSelector);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [activeLeaseReferences, setActiveLeaseReferences] = useState({
    tenantIds: new Set(),
    unitIds: new Set(),
  });

  const fetchLeases = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(status !== "all" && { status }),
    };
    dispatch(onGetLeases({ params }));
  }, [currentPage, dispatch, status]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  useEffect(() => {
    dispatch(onGetTenants({ params: { page: 1, limit: 100 } }));
    dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
    dispatch(onGetUnits({ params: { page: 1, limit: 100 } }));
  }, [dispatch]);

  useEffect(() => {
    const loadActiveLeaseReferences = async () => {
      try {
        const res = await LeasesAPI.active();
        if (!res.success) return;
        const data = Array.isArray(res.data) ? res.data : [];
        const tenantIds = new Set();
        const unitIds = new Set();
        data.forEach((lease) => {
          const tenantId =
            typeof lease.tenantId === "object" ? lease.tenantId?._id : lease.tenantId;
          const unitId = typeof lease.unitId === "object" ? lease.unitId?._id : lease.unitId;
          if (tenantId) tenantIds.add(tenantId);
          if (unitId) unitIds.add(unitId);
        });
        setActiveLeaseReferences({ tenantIds, unitIds });
      } catch (_e) {
        setActiveLeaseReferences({ tenantIds: new Set(), unitIds: new Set() });
      }
    };

    loadActiveLeaseReferences();
  }, []);

  const tenantOptions = useMemo(
    () =>
      tenants
        .filter((t) => {
          const tenantId = t._id;
          const editingTenantId =
            typeof selectedLease?.tenantId === "object"
              ? selectedLease?.tenantId?._id
              : selectedLease?.tenantId;
          if (tenantId === editingTenantId) return true;
          return !activeLeaseReferences.tenantIds.has(tenantId);
        })
        .map((t) => ({
        value: t._id,
        label: `${t.personalInfo?.firstName || ""} ${t.personalInfo?.lastName || ""} (${t.tenantCode})`,
        })),
    [activeLeaseReferences.tenantIds, selectedLease?.tenantId, tenants],
  );

  const buildingOptions = useMemo(
    () =>
      buildings.map((b) => ({
        value: b._id,
        label: `${b.name} (${b.code})`,
      })),
    [buildings],
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      leaseNumber: selectedLease?.leaseNumber || "",
      tenantId:
        typeof selectedLease?.tenantId === "object"
          ? selectedLease?.tenantId?._id || ""
          : selectedLease?.tenantId || "",
      buildingId:
        typeof selectedLease?.buildingId === "object"
          ? selectedLease?.buildingId?._id || ""
          : selectedLease?.buildingId || "",
      unitId:
        typeof selectedLease?.unitId === "object"
          ? selectedLease?.unitId?._id || ""
          : selectedLease?.unitId || "",
      status: selectedLease?.status || "active",
      period: {
        startDate: selectedLease?.period?.startDate
          ? new Date(selectedLease.period.startDate).toISOString().split("T")[0]
          : "",
        endDate: selectedLease?.period?.endDate
          ? new Date(selectedLease.period.endDate).toISOString().split("T")[0]
          : "",
        duration: selectedLease?.period?.duration ?? 12,
      },
      terms: {
        rentAmount: selectedLease?.terms?.rentAmount ?? 0,
        rentDueDay: selectedLease?.terms?.rentDueDay ?? 1,
        securityDeposit: selectedLease?.terms?.securityDeposit ?? 0,
        depositPaid: Boolean(selectedLease?.terms?.depositPaid),
        paymentFrequency: selectedLease?.terms?.paymentFrequency || "monthly",
        lateFeeType: selectedLease?.terms?.lateFeeType || "percentage",
        lateFeeValue: selectedLease?.terms?.lateFeeValue ?? 5,
        gracePeriodDays: selectedLease?.terms?.gracePeriodDays ?? 5,
      },
    },
    validationSchema: Yup.object({
      leaseNumber: Yup.string().required("Lease number is required"),
      tenantId: Yup.string().required("Tenant is required"),
      buildingId: Yup.string().required("Building is required"),
      unitId: Yup.string().required("Unit is required"),
      period: Yup.object({
        startDate: Yup.string().required("Start date is required"),
        endDate: Yup.string().required("End date is required"),
      }),
      terms: Yup.object({
        rentAmount: Yup.number().min(0).required("Rent amount is required"),
        securityDeposit: Yup.number().min(0).required("Deposit is required"),
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        leaseNumber: values.leaseNumber.trim(),
        tenantId: values.tenantId,
        buildingId: values.buildingId,
        unitId: values.unitId,
        status: values.status,
        period: {
          startDate: values.period.startDate,
          endDate: values.period.endDate,
          duration: Number(values.period.duration),
        },
        terms: {
          rentAmount: Number(values.terms.rentAmount),
          rentDueDay: Number(values.terms.rentDueDay),
          securityDeposit: Number(values.terms.securityDeposit),
          depositPaid: Boolean(values.terms.depositPaid),
          paymentFrequency: values.terms.paymentFrequency,
          lateFeeType: values.terms.lateFeeType,
          lateFeeValue: Number(values.terms.lateFeeValue),
          gracePeriodDays: Number(values.terms.gracePeriodDays),
        },
      };
      try {
        if (selectedLease?._id) {
          await dispatch(onUpdateLease({ id: selectedLease._id, data: payload }));
        } else {
          await dispatch(onCreateLease({ data: payload }));
        }
        setModal(false);
        setSelectedLease(null);
        resetForm();
        fetchLeases();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const unitOptions = useMemo(() => {
    const selectedBuildingId = formik.values.buildingId;
    const filtered = selectedBuildingId
      ? units.filter((u) => {
          const value = typeof u.buildingId === "object" ? u.buildingId?._id : u.buildingId;
          return value === selectedBuildingId;
        })
      : units;

    return filtered
      .filter((u) => {
        const editingUnitId =
          typeof selectedLease?.unitId === "object"
            ? selectedLease?.unitId?._id
            : selectedLease?.unitId;
        if (u._id === editingUnitId) return true;
        if (u.status !== "vacant") return false;
        return !activeLeaseReferences.unitIds.has(u._id);
      })
      .map((u) => ({
        value: u._id,
        label: `${u.unitNumber} (Floor ${u.floor}, ${u.type})`,
      }));
  }, [activeLeaseReferences.unitIds, formik.values.buildingId, selectedLease?.unitId, units]);

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_row, index) => (currentPage - 1) * (pagination?.limit || 10) + index + 1,
    },
    {
      name: "Lease",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.leaseNumber}</div>
          <small className="text-muted">
            {new Date(row.period?.startDate || Date.now()).toLocaleDateString()} -{" "}
            {new Date(row.period?.endDate || Date.now()).toLocaleDateString()}
          </small>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Tenant",
      grow: 2,
      cell: (row) => {
        const tenant = row.tenantId;
        if (!tenant || typeof tenant !== "object") return "-";
        return `${tenant.personalInfo?.firstName || ""} ${tenant.personalInfo?.lastName || ""}`;
      },
    },
    {
      name: "Unit",
      cell: (row) =>
        typeof row.unitId === "object"
          ? `${row.unitId?.unitNumber || "-"} (${row.buildingId?.name || "-"})`
          : "-",
      grow: 2,
    },
    {
      name: "Rent",
      cell: (row) => `$${Number(row.terms?.rentAmount || 0).toLocaleString()}`,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={row.status === "active" ? "success" : "secondary"} className="text-capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-info"
            size="sm"
            className="btn-icon"
            onClick={() => {
              setSelectedLease(row);
              setViewModal(true);
            }}
          >
            <i className="ri-eye-line" />
          </Button>
          <Button
            color="outline-primary"
            size="sm"
            className="btn-icon"
            onClick={() => {
              setSelectedLease(row);
              setModal(true);
            }}
          >
            <i className="ri-pencil-line" />
          </Button>
          {row.status === "active" && (
            <Button
              color="outline-danger"
              size="sm"
              className="btn-icon"
              onClick={async () => {
                await dispatch(
                  onTerminateLease({
                    id: row._id,
                    data: { reason: "Terminated from UI", fees: 0 },
                  }),
                );
                fetchLeases();
              }}
            >
              <i className="ri-close-circle-line" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Leases" pageTitle="Properties" />

        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Status</Label>
                  <Select
                    options={leaseStatusOptions}
                    value={leaseStatusOptions.find((x) => x.value === status)}
                    onChange={(opt) => {
                      setStatus(opt?.value || "all");
                      setCurrentPage(1);
                    }}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <Button
                  color="primary"
                  className="w-100 mb-3"
                  onClick={() => {
                    setStatus("all");
                    setCurrentPage(1);
                  }}
                >
                  <i className="ri-refresh-line me-1" />
                  Reset
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0">
              <i className="ri-file-list-2-line me-2" />
              Leases
              <Badge color="primary" className="ms-2">
                {pagination?.total || leases.length}
              </Badge>
            </h5>
            <Button
              color="primary"
              onClick={() => {
                setSelectedLease(null);
                setModal(true);
              }}
            >
              <i className="ri-add-line me-1" />
              Lease
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={leases}
                pagination
                paginationServer
                paginationTotalRows={pagination?.total || 0}
                paginationPerPage={pagination?.limit || 10}
                paginationDefaultPage={currentPage}
                onChangePage={(p) => setCurrentPage(p)}
                responsive
              />
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg" centered>
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          {selectedLease ? "Edit Lease" : "Create Lease"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Lease Number *</Label>
                  <Input
                    name="leaseNumber"
                    placeholder="Enter lease number (e.g. LSE-0001)"
                    value={formik.values.leaseNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.leaseNumber && !!formik.errors.leaseNumber}
                  />
                  <FormFeedback>{formik.errors.leaseNumber}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Status</Label>
                  <Select
                    options={leaseStatusOptions.filter((x) => x.value !== "all" && x.value !== "expired")}
                    placeholder="Select lease status"
                    value={leaseStatusOptions.find((x) => x.value === formik.values.status)}
                    onChange={(opt) => formik.setFieldValue("status", opt?.value || "active")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Tenant *</Label>
                  <Select
                    options={tenantOptions}
                    placeholder="Select available tenant"
                    value={tenantOptions.find((x) => x.value === formik.values.tenantId) || null}
                    onChange={(opt) => formik.setFieldValue("tenantId", opt?.value || "")}
                    classNamePrefix="select"
                  />
                  {formik.touched.tenantId && formik.errors.tenantId ? (
                    <div className="text-danger small mt-1">{formik.errors.tenantId}</div>
                  ) : null}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Building *</Label>
                  <Select
                    options={buildingOptions}
                    placeholder="Select building"
                    value={buildingOptions.find((x) => x.value === formik.values.buildingId) || null}
                    onChange={(opt) => {
                      formik.setFieldValue("buildingId", opt?.value || "");
                      formik.setFieldValue("unitId", "");
                    }}
                    classNamePrefix="select"
                  />
                  {formik.touched.buildingId && formik.errors.buildingId ? (
                    <div className="text-danger small mt-1">{formik.errors.buildingId}</div>
                  ) : null}
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label className="form-label">Unit *</Label>
              <Select
                options={unitOptions}
                placeholder="Select available unit"
                value={unitOptions.find((x) => x.value === formik.values.unitId) || null}
                onChange={(opt) => formik.setFieldValue("unitId", opt?.value || "")}
                classNamePrefix="select"
              />
              {formik.touched.unitId && formik.errors.unitId ? (
                <div className="text-danger small mt-1">{formik.errors.unitId}</div>
              ) : null}
            </FormGroup>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Start Date *</Label>
                  <Input
                    type="date"
                    name="period.startDate"
                    value={formik.values.period.startDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.period?.startDate && !!formik.errors.period?.startDate
                    }
                  />
                  <FormFeedback>{formik.errors.period?.startDate}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">End Date *</Label>
                  <Input
                    type="date"
                    name="period.endDate"
                    value={formik.values.period.endDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.period?.endDate && !!formik.errors.period?.endDate}
                  />
                  <FormFeedback>{formik.errors.period?.endDate}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Duration (months)</Label>
                  <Input
                    type="number"
                    min="1"
                    name="period.duration"
                    placeholder="Enter duration in months"
                    value={formik.values.period.duration}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Rent Amount *</Label>
                  <Input
                    type="number"
                    min="0"
                    name="terms.rentAmount"
                    placeholder="Enter monthly rent amount"
                    value={formik.values.terms.rentAmount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.terms?.rentAmount && !!formik.errors.terms?.rentAmount
                    }
                  />
                  <FormFeedback>{formik.errors.terms?.rentAmount}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Rent Due Day</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    name="terms.rentDueDay"
                    placeholder="Enter due day (1-31)"
                    value={formik.values.terms.rentDueDay}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Security Deposit *</Label>
                  <Input
                    type="number"
                    min="0"
                    name="terms.securityDeposit"
                    placeholder="Enter security deposit amount"
                    value={formik.values.terms.securityDeposit}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.terms?.securityDeposit &&
                      !!formik.errors.terms?.securityDeposit
                    }
                  />
                  <FormFeedback>{formik.errors.terms?.securityDeposit}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light">
            <Button color="light" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : selectedLease ? (
                "Update Lease"
              ) : (
                "Create Lease"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          Lease Details
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Lease Number</Label>
              <div className="fw-semibold">{selectedLease?.leaseNumber || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Status</Label>
              <div className="fw-semibold text-capitalize">{selectedLease?.status || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Tenant</Label>
              <div className="fw-semibold">
                {selectedLease?.tenantId?.personalInfo
                  ? `${selectedLease.tenantId.personalInfo.firstName || ""} ${selectedLease.tenantId.personalInfo.lastName || ""}`.trim()
                  : "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Building</Label>
              <div className="fw-semibold">{selectedLease?.buildingId?.name || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Unit</Label>
              <div className="fw-semibold">{selectedLease?.unitId?.unitNumber || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Rent Amount</Label>
              <div className="fw-semibold">
                ${Number(selectedLease?.terms?.rentAmount || 0).toLocaleString()}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Security Deposit</Label>
              <div className="fw-semibold">
                ${Number(selectedLease?.terms?.securityDeposit || 0).toLocaleString()}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Start Date</Label>
              <div className="fw-semibold">
                {selectedLease?.period?.startDate
                  ? new Date(selectedLease.period.startDate).toLocaleDateString()
                  : "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">End Date</Label>
              <div className="fw-semibold">
                {selectedLease?.period?.endDate
                  ? new Date(selectedLease.period.endDate).toLocaleDateString()
                  : "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Duration</Label>
              <div className="fw-semibold">{selectedLease?.period?.duration || "-"} months</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Payment Frequency</Label>
              <div className="fw-semibold text-capitalize">
                {selectedLease?.terms?.paymentFrequency || "-"}
              </div>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default Leases;
