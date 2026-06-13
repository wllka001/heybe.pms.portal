import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../Components/Common/AppDataTable";
import Select from "../../Components/Common/AppSelect";
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
import { RiAttachment2, RiMoneyDollarCircleLine, RiUserSettingsLine } from "react-icons/ri";
import { ToastContainer } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import ActionIconButton from "../../Components/Common/ActionIconButton";
import {
  addMaintenanceAttachment as onAddMaintenanceAttachment,
  addMaintenanceCost as onAddMaintenanceCost,
  assignMaintenanceRequest as onAssignMaintenanceRequest,
  createMaintenanceRequest as onCreateMaintenanceRequest,
  getBuildings as onGetBuildings,
  getEmployees as onGetEmployees,
  getMaintenanceRequests as onGetMaintenanceRequests,
  getTenants as onGetTenants,
  getUnits as onGetUnits,
  getVendors as onGetVendors,
  updateMaintenanceStatus as onUpdateMaintenanceStatus,
} from "../../slices/thunks";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "on_hold", label: "On Hold" },
];

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const Maintenance = () => {
  document.title = "Maintenance | Degaanly";
  const dispatch = useDispatch();

  const maintenanceSelector = createSelector(
    (state) => state.Maintenance,
    (s) => ({
      requests: s.requests,
      pagination: s.pagination,
      loading: s.loading,
    }),
  );
  const tenantSelector = createSelector((state) => state.Tenants, (s) => s.tenants || []);
  const buildingSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
  const unitSelector = createSelector((state) => state.Units, (s) => s.units || []);
  const employeeSelector = createSelector((state) => state.Employees, (s) => s.employees || []);
  const vendorsSelector = createSelector((state) => state.Maintenance, (s) => s.vendors || []);

  const { requests, pagination, loading } = useSelector(maintenanceSelector);
  const tenants = useSelector(tenantSelector);
  const buildings = useSelector(buildingSelector);
  const units = useSelector(unitSelector);
  const employees = useSelector(employeeSelector);
  const vendors = useSelector(vendorsSelector);

  const [modal, setModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [costModal, setCostModal] = useState(false);
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [assignData, setAssignData] = useState({
    assignedToId: "",
    vendorId: "",
    status: "assigned",
  });
  const [costData, setCostData] = useState({
    labor: "",
    parts: "",
    estimated: "",
    actual: "",
  });
  const [attachmentData, setAttachmentData] = useState({
    type: "document",
    note: "",
    file: null,
  });
  const [actionSaving, setActionSaving] = useState(false);

  const fetchRequests = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(status !== "all" && { status }),
    };
    dispatch(onGetMaintenanceRequests({ params }));
  }, [currentPage, dispatch, status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    dispatch(onGetTenants({ params: { page: 1, limit: 100 } }));
    dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
    dispatch(onGetUnits({ params: { page: 1, limit: 100 } }));
    dispatch(onGetEmployees({ params: { page: 1, limit: 200 } }));
    dispatch(onGetVendors());
  }, [dispatch]);

  const tenantOptions = useMemo(
    () =>
      tenants.map((t) => ({
        value: t._id,
        label: `${t.personalInfo?.firstName || ""} ${t.personalInfo?.lastName || ""} (${t.tenantCode})`,
      })),
    [tenants],
  );

  const buildingOptions = useMemo(
    () =>
      buildings.map((b) => ({
        value: b._id,
        label: `${b.name} (${b.code})`,
      })),
    [buildings],
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee._id,
        label: `${employee.personalInfo?.firstName || ""} ${employee.personalInfo?.lastName || ""} (${employee.employeeCode || "Emp"})`,
      })),
    [employees],
  );

  const vendorOptions = useMemo(
    () =>
      vendors.map((vendor) => ({
        value: vendor._id,
        label: `${vendor.name} (${vendor.vendorCode})`,
      })),
    [vendors],
  );

  const formik = useFormik({
    initialValues: {
      buildingId: "",
      unitId: "",
      tenantId: "",
      issue: {
        type: "",
        subCategory: "",
        description: "",
        priority: "medium",
      },
      status: "pending",
    },
    validationSchema: Yup.object({
      buildingId: Yup.string().required("Building is required"),
      unitId: Yup.string().required("Unit is required"),
      issue: Yup.object({
        type: Yup.string().required("Issue type is required"),
        description: Yup.string().required("Issue description is required"),
        priority: Yup.string().required("Priority is required"),
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        buildingId: values.buildingId,
        unitId: values.unitId,
        tenantId: values.tenantId || undefined,
        status: values.status,
        issue: {
          type: values.issue.type.trim(),
          subCategory: values.issue.subCategory?.trim() || undefined,
          description: values.issue.description.trim(),
          priority: values.issue.priority,
        },
      };
      try {
        await dispatch(onCreateMaintenanceRequest({ data: payload }));
        setModal(false);
        resetForm();
        fetchRequests();
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
    return filtered.map((u) => ({
      value: u._id,
      label: `${u.unitNumber} (Floor ${u.floor}, ${u.type})`,
    }));
  }, [formik.values.buildingId, units]);

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_row, index) => (currentPage - 1) * (pagination?.limit || 10) + index + 1,
    },
    {
      name: "Request",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.requestNumber}</div>
          <small className="text-muted">{row.issue?.type || "-"}</small>
        </div>
      ),
    },
    {
      name: "Unit",
      grow: 2,
      cell: (row) => (
        <div>
          <div>{row.unitId?.unitNumber || "-"}</div>
          <small className="text-muted">{row.buildingId?.name || "-"}</small>
        </div>
      ),
    },
    {
      name: "Tenant",
      cell: (row) =>
        row.tenantId?.personalInfo
          ? `${row.tenantId.personalInfo.firstName || ""} ${row.tenantId.personalInfo.lastName || ""}`
          : "-",
      grow: 2,
    },
    {
      name: "Priority",
      cell: (row) => (
        <Badge color={row.issue?.priority === "critical" ? "danger" : "warning"} className="text-capitalize">
          {row.issue?.priority || "-"}
        </Badge>
      ),
    },
    {
      name: "Status",
      cell: (row) => (
        <Select
          options={statusOptions.filter((x) => x.value !== "all")}
          value={statusOptions.find((x) => x.value === row.status)}
          onChange={async (opt) => {
            if (!opt) return;
            await dispatch(onUpdateMaintenanceStatus({ id: row._id, status: opt.value }));
            fetchRequests();
          }}
          classNamePrefix="select"
          menuPortalTarget={document.body}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base) => ({
              ...base,
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              cursor: 'pointer'
            }),
          }}
        />
      ),
      grow: 2,
    },
    {
      name: "Actions",
      width: "180px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            color="primary"
            className="btn-soft-primary"
            onClick={() => {
              setSelectedRequest(row);
              setAssignData({
                assignedToId: typeof row.assignedToId === "object" ? row.assignedToId?._id || "" : row.assignedToId || "",
                vendorId: typeof row.vendorId === "object" ? row.vendorId?._id || "" : row.vendorId || "",
                status: row.status === "in_progress" ? "in_progress" : "assigned",
              });
              setAssignModal(true);
            }}
          >
            Assign
          </Button>
          <ActionIconButton
            id={`cost-maintenance-${row._id}`}
            icon={<RiMoneyDollarCircleLine size={16} />}
            tooltip="Cost"
            onClick={() => {
              setSelectedRequest(row);
              setCostData({
                labor: row.cost?.labor ?? "",
                parts: row.cost?.parts ?? "",
                estimated: row.cost?.estimated ?? "",
                actual: row.cost?.actual ?? "",
              });
              setCostModal(true);
            }}
          />
          <ActionIconButton
            id={`attachment-maintenance-${row._id}`}
            icon={<RiAttachment2 size={16} />}
            tooltip="Files"
            onClick={() => {
              setSelectedRequest(row);
              setAttachmentData({ type: "document", note: "", file: null });
              setAttachmentModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Maintenance" pageTitle="Operations" />

        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Status</Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((x) => x.value === status)}
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
              <i className="ri-tools-line me-2" />
              Maintenance Requests
              <Badge color="primary" className="ms-2">
                {pagination?.total || requests.length}
              </Badge>
            </h5>
            <Button color="primary" onClick={() => setModal(true)}>
              <i className="ri-add-line me-1" />
              Request
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={requests}
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
          Create Maintenance Request
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Status</Label>
                  <Select
                    options={statusOptions.filter((x) => x.value !== "all")}
                    value={statusOptions.find((x) => x.value === formik.values.status)}
                    onChange={(opt) => formik.setFieldValue("status", opt?.value || "pending")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Building *</Label>
                  <Select
                    options={buildingOptions}
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
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Unit *</Label>
                  <Select
                    options={unitOptions}
                    value={unitOptions.find((x) => x.value === formik.values.unitId) || null}
                    onChange={(opt) => formik.setFieldValue("unitId", opt?.value || "")}
                    classNamePrefix="select"
                  />
                  {formik.touched.unitId && formik.errors.unitId ? (
                    <div className="text-danger small mt-1">{formik.errors.unitId}</div>
                  ) : null}
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label className="form-label">Tenant (optional)</Label>
              <Select
                options={tenantOptions}
                value={tenantOptions.find((x) => x.value === formik.values.tenantId) || null}
                onChange={(opt) => formik.setFieldValue("tenantId", opt?.value || "")}
                isClearable
                classNamePrefix="select"
              />
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Issue Type *</Label>
                  <Input
                    name="issue.type"
                    value={formik.values.issue.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.issue?.type && !!formik.errors.issue?.type}
                  />
                  <FormFeedback>{formik.errors.issue?.type}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Sub Category</Label>
                  <Input
                    name="issue.subCategory"
                    value={formik.values.issue.subCategory}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label className="form-label">Description *</Label>
              <Input
                type="textarea"
                rows="3"
                name="issue.description"
                value={formik.values.issue.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={
                  formik.touched.issue?.description && !!formik.errors.issue?.description
                }
              />
              <FormFeedback>{formik.errors.issue?.description}</FormFeedback>
            </FormGroup>
            <FormGroup className="mb-0">
              <Label className="form-label">Priority *</Label>
              <Select
                options={priorityOptions}
                value={priorityOptions.find((x) => x.value === formik.values.issue.priority)}
                onChange={(opt) => formik.setFieldValue("issue.priority", opt?.value || "medium")}
                classNamePrefix="select"
              />
            </FormGroup>
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
              ) : (
                "Create Request"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={assignModal} toggle={() => setAssignModal(false)} centered>
        <ModalHeader toggle={() => setAssignModal(false)} className="bg-light">
          Assign Request
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label className="form-label">Employee</Label>
            <Select
              options={employeeOptions}
              value={employeeOptions.find((x) => x.value === assignData.assignedToId) || null}
              onChange={(opt) =>
                setAssignData((prev) => ({ ...prev, assignedToId: opt?.value || "" }))
              }
              isClearable
              classNamePrefix="select"
            />
          </FormGroup>
          <FormGroup>
            <Label className="form-label">Vendor</Label>
            <Select
              options={vendorOptions}
              value={vendorOptions.find((x) => x.value === assignData.vendorId) || null}
              onChange={(opt) =>
                setAssignData((prev) => ({ ...prev, vendorId: opt?.value || "" }))
              }
              isClearable
              classNamePrefix="select"
            />
          </FormGroup>
          <FormGroup className="mb-0">
            <Label className="form-label">Status</Label>
            <Select
              options={[
                { value: "assigned", label: "Assigned" },
                { value: "in_progress", label: "In Progress" },
              ]}
              value={
                assignData.status === "in_progress"
                  ? { value: "in_progress", label: "In Progress" }
                  : { value: "assigned", label: "Assigned" }
              }
              onChange={(opt) =>
                setAssignData((prev) => ({ ...prev, status: opt?.value || "assigned" }))
              }
              classNamePrefix="select"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setAssignModal(false)}>
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={actionSaving || !selectedRequest?._id}
            onClick={async () => {
              if (!selectedRequest?._id) return;
              try {
                setActionSaving(true);
                await dispatch(
                  onAssignMaintenanceRequest({
                    id: selectedRequest._id,
                    data: {
                      assignedToId: assignData.assignedToId || undefined,
                      vendorId: assignData.vendorId || undefined,
                      status: assignData.status,
                    },
                  }),
                );
                setAssignModal(false);
                fetchRequests();
              } finally {
                setActionSaving(false);
              }
            }}
          >
            {actionSaving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              "Save Assignment"
            )}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={costModal} toggle={() => setCostModal(false)} centered>
        <ModalHeader toggle={() => setCostModal(false)} className="bg-light">
          Update Cost
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label className="form-label">Labor</Label>
                <Input
                  type="number"
                  min="0"
                  value={costData.labor}
                  onChange={(e) => setCostData((prev) => ({ ...prev, labor: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label className="form-label">Parts</Label>
                <Input
                  type="number"
                  min="0"
                  value={costData.parts}
                  onChange={(e) => setCostData((prev) => ({ ...prev, parts: e.target.value }))}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label className="form-label">Estimated</Label>
                <Input
                  type="number"
                  min="0"
                  value={costData.estimated}
                  onChange={(e) => setCostData((prev) => ({ ...prev, estimated: e.target.value }))}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup className="mb-0">
                <Label className="form-label">Actual</Label>
                <Input
                  type="number"
                  min="0"
                  value={costData.actual}
                  onChange={(e) => setCostData((prev) => ({ ...prev, actual: e.target.value }))}
                />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setCostModal(false)}>
            Cancel
          </Button>
          <Button
            color="success"
            disabled={actionSaving || !selectedRequest?._id}
            onClick={async () => {
              if (!selectedRequest?._id) return;
              const payload = {
                labor: costData.labor === "" ? undefined : Number(costData.labor),
                parts: costData.parts === "" ? undefined : Number(costData.parts),
                estimated: costData.estimated === "" ? undefined : Number(costData.estimated),
                actual: costData.actual === "" ? undefined : Number(costData.actual),
              };
              try {
                setActionSaving(true);
                await dispatch(
                  onAddMaintenanceCost({
                    id: selectedRequest._id,
                    data: payload,
                  }),
                );
                setCostModal(false);
                fetchRequests();
              } finally {
                setActionSaving(false);
              }
            }}
          >
            {actionSaving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              "Save Cost"
            )}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={attachmentModal} toggle={() => setAttachmentModal(false)} centered>
        <ModalHeader toggle={() => setAttachmentModal(false)} className="bg-light">
          Upload Attachment
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label className="form-label">Type</Label>
            <Select
              options={[
                { value: "image", label: "Image" },
                { value: "video", label: "Video" },
                { value: "document", label: "Document" },
              ]}
              value={{
                value: attachmentData.type,
                label:
                  attachmentData.type === "image"
                    ? "Image"
                    : attachmentData.type === "video"
                      ? "Video"
                      : "Document",
              }}
              onChange={(opt) =>
                setAttachmentData((prev) => ({ ...prev, type: opt?.value || "document" }))
              }
              classNamePrefix="select"
            />
          </FormGroup>
          <FormGroup>
            <Label className="form-label">Note</Label>
            <Input
              value={attachmentData.note}
              onChange={(e) => setAttachmentData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </FormGroup>
          <FormGroup className="mb-0">
            <Label className="form-label">File</Label>
            <Input
              type="file"
              onChange={(e) =>
                setAttachmentData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))
              }
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setAttachmentModal(false)}>
            Cancel
          </Button>
          <Button
            color="info"
            disabled={actionSaving || !selectedRequest?._id || !attachmentData.file}
            onClick={async () => {
              if (!selectedRequest?._id || !attachmentData.file) return;
              const formData = new FormData();
              formData.append("type", attachmentData.type);
              if (attachmentData.note) formData.append("note", attachmentData.note);
              formData.append("file", attachmentData.file);
              try {
                setActionSaving(true);
                await dispatch(
                  onAddMaintenanceAttachment({
                    id: selectedRequest._id,
                    formData,
                  }),
                );
                setAttachmentModal(false);
                fetchRequests();
              } finally {
                setActionSaving(false);
              }
            }}
          >
            {actionSaving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default Maintenance;
