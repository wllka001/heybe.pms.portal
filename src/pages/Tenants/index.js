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
import DeleteModal from "../../Components/Common/DeleteModal";
import Loader from "../../Components/Common/Loader";
import useAuthUser from "../../Components/Hooks/useAuthUser";
import {
  createTenant as onCreateTenant,
  deleteTenant as onDeleteTenant,
  getBuildings as onGetBuildings,
  getTenantLeases as onGetTenantLeases,
  getTenantDocuments as onGetTenantDocuments,
  getTenants as onGetTenants,
  uploadTenantDocument as onUploadTenantDocument,
  updateTenant as onUpdateTenant,
  verifyTenantDocument as onVerifyTenantDocument,
} from "../../slices/thunks";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "prospective", label: "Prospective" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklisted", label: "Blacklisted" },
];

const Tenants = () => {
  document.title = "Tenants | Apartment Management";
  const dispatch = useDispatch();
  const userAuth = useAuthUser();
  const organizationId = userAuth.businessId;

  const selector = createSelector(
    (state) => state,
    (state) => ({
      tenants: state.Tenants.tenants,
      pagination: state.Tenants.pagination,
      loading: state.Tenants.loading,
      tenantLeases: state.Tenants.tenantLeases,
      tenantDocuments: state.Tenants.tenantDocuments,
      buildings: state.Buildings.buildings || [],
    }),
  );
  const { tenants, pagination, loading, tenantLeases, tenantDocuments, buildings } = useSelector(selector);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [documentType, setDocumentType] = useState("OTHER");
  const [documentNote, setDocumentNote] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const buildingOptions = useMemo(
    () =>
      (buildings || []).map((building) => ({
        value: building._id,
        label: `${building.name} (${building.code || "Auto"})`,
      })),
    [buildings],
  );

  const fetchTenants = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(search && { q: search }),
      ...(status !== "all" && { status }),
    };
    dispatch(onGetTenants({ params }));
  }, [dispatch, currentPage, search, status]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    dispatch(onGetBuildings({ organizationId, params: { page: 1, limit: 100 } }));
  }, [dispatch, organizationId]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      buildingId:
        typeof selectedTenant?.buildingId === "object"
          ? selectedTenant?.buildingId?._id || ""
          : selectedTenant?.buildingId || "",
      status: selectedTenant?.status || "prospective",
      personalInfo: {
        firstName: selectedTenant?.personalInfo?.firstName || "",
        middleName: selectedTenant?.personalInfo?.middleName || "",
        lastName: selectedTenant?.personalInfo?.lastName || "",
        gender: selectedTenant?.personalInfo?.gender || "",
        dateOfBirth: selectedTenant?.personalInfo?.dateOfBirth
          ? new Date(selectedTenant.personalInfo.dateOfBirth).toISOString().split("T")[0]
          : "",
        idNumber: selectedTenant?.personalInfo?.idNumber || "",
      },
      contact: {
        primaryPhone: selectedTenant?.contact?.primaryPhone || "",
        secondaryPhone: selectedTenant?.contact?.secondaryPhone || "",
        email: selectedTenant?.contact?.email || "",
        emergencyContact: {
          name: selectedTenant?.contact?.emergencyContact?.name || "",
          relationship: selectedTenant?.contact?.emergencyContact?.relationship || "",
          phone: selectedTenant?.contact?.emergencyContact?.phone || "",
        },
      },
      nationalIdNumber: selectedTenant?.nationalIdNumber || "",
      passportNumber: selectedTenant?.passportNumber || "",
      isVerified: Boolean(selectedTenant?.isVerified),
    },
    validationSchema: Yup.object({
      buildingId: Yup.string().when([], {
        is: () => !selectedTenant?._id,
        then: (schema) => schema.required("Building is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      personalInfo: Yup.object({
        firstName: Yup.string().required("First name is required"),
        lastName: Yup.string().required("Last name is required"),
        idNumber: Yup.string().required("ID number is required"),
      }),
      contact: Yup.object({
        primaryPhone: Yup.string().required("Primary phone is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        status: values.status,
        personalInfo: {
          firstName: values.personalInfo.firstName.trim(),
          middleName: values.personalInfo.middleName?.trim() || undefined,
          lastName: values.personalInfo.lastName.trim(),
          gender: values.personalInfo.gender || undefined,
          dateOfBirth: values.personalInfo.dateOfBirth || undefined,
          idNumber: values.personalInfo.idNumber.trim(),
        },
        contact: {
          primaryPhone: values.contact.primaryPhone.trim(),
          secondaryPhone: values.contact.secondaryPhone?.trim() || undefined,
          email: values.contact.email.trim(),
          emergencyContact:
            values.contact.emergencyContact?.name ||
              values.contact.emergencyContact?.relationship ||
              values.contact.emergencyContact?.phone
              ? {
                name: values.contact.emergencyContact?.name?.trim() || undefined,
                relationship:
                  values.contact.emergencyContact?.relationship?.trim() || undefined,
                phone: values.contact.emergencyContact?.phone?.trim() || undefined,
              }
              : undefined,
        },
        nationalIdNumber: values.nationalIdNumber?.trim() || undefined,
        passportNumber: values.passportNumber?.trim() || undefined,
        isVerified: Boolean(values.isVerified),
      };
      if (!selectedTenant?._id) {
        payload.buildingId = values.buildingId;
      }
      try {
        if (selectedTenant?._id) {
          await dispatch(onUpdateTenant({ id: selectedTenant._id, data: payload }));
        } else {
          await dispatch(onCreateTenant({ data: payload }));
        }
        setModal(false);
        setSelectedTenant(null);
        resetForm();
        fetchTenants();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const statusBadgeColor = (value) => {
    if (value === "active") return "success";
    if (value === "inactive") return "secondary";
    if (value === "blacklisted") return "danger";
    return "warning";
  };

  const columns = useMemo(
    () => [
      {
        name: "#",
        width: "70px",
        cell: (_row, i) => (currentPage - 1) * (pagination?.limit || 10) + i + 1,
      },
      {
        name: "Tenant",
        grow: 2,
        cell: (row) => (
          <div>
            <div className="fw-semibold">
              {row.personalInfo?.firstName} {row.personalInfo?.lastName}
            </div>
            <small className="text-muted">{row.tenantCode}</small>
          </div>
        ),
      },
      { name: "ID Number", selector: (row) => row.personalInfo?.idNumber || "-" },
      {
        name: "Contact",
        grow: 2,
        cell: (row) => (
          <div>
            <div>{row.contact?.primaryPhone || "-"}</div>
            <small className="text-muted">{row.contact?.email || "-"}</small>
          </div>
        ),
      },
      {
        name: "Status",
        cell: (row) => (
          <Badge color={statusBadgeColor(row.status)} className="text-capitalize">
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
              onClick={async () => {
                setSelectedTenant(row);
                await dispatch(onGetTenantLeases({ id: row._id }));
                await dispatch(onGetTenantDocuments({ id: row._id }));
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
                setSelectedTenant(row);
                setModal(true);
              }}
            >
              <i className="ri-pencil-line" />
            </Button>
            <Button
              color="outline-danger"
              size="sm"
              className="btn-icon"
              onClick={() => {
                setSelectedTenant(row);
                setDeleteModal(true);
              }}
            >
              <i className="ri-delete-bin-line" />
            </Button>
          </div>
        ),
      },
    ],
    [currentPage, dispatch, pagination?.limit, tenantLeases],
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Tenants" pageTitle="Properties" />
        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={5}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search</Label>
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by tenant name, email, code or ID..."
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
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
              <Col md={3}>
                <Button
                  color="primary"
                  className="w-100 mb-3"
                  onClick={() => {
                    setSearch("");
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
              <i className="ri-team-line me-2" />
              Tenants
              <Badge color="primary" className="ms-2">
                {pagination?.total || tenants.length}
              </Badge>
            </h5>
            <Button
              color="primary"
              onClick={() => {
                setSelectedTenant(null);
                setModal(true);
              }}
            >
              <i className="ri-add-line me-1" />
              Tenant
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={tenants}
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

      <Modal isOpen={modal} toggle={() => setModal(false)} centered size="xl">
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          {selectedTenant ? "Edit Tenant" : "Create Tenant"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row>
              {!selectedTenant ? (
                <Col md={4}>
                  <FormGroup>
                    <Label className="form-label">Building *</Label>
                    <Select
                      options={buildingOptions}
                      value={buildingOptions.find((x) => x.value === formik.values.buildingId) || null}
                      onChange={(opt) => formik.setFieldValue("buildingId", opt?.value || "")}
                      classNamePrefix="select"
                    />
                    {(formik.touched.buildingId || formik.submitCount > 0) && formik.errors.buildingId ? (
                      <div className="text-danger small mt-1">{formik.errors.buildingId}</div>
                    ) : null}
                  </FormGroup>
                </Col>
              ) : null}
              <Col md={selectedTenant ? 6 : 4}>
                <FormGroup>
                  <Label className="form-label">First Name *</Label>
                  <Input
                    name="personalInfo.firstName"
                    value={formik.values.personalInfo.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.personalInfo?.firstName &&
                      !!formik.errors.personalInfo?.firstName
                    }
                  />
                  <FormFeedback>{formik.errors.personalInfo?.firstName}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={selectedTenant ? 6 : 4}>
                <FormGroup>
                  <Label className="form-label">Last Name *</Label>
                  <Input
                    name="personalInfo.lastName"
                    value={formik.values.personalInfo.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.personalInfo?.lastName &&
                      !!formik.errors.personalInfo?.lastName
                    }
                  />
                  <FormFeedback>{formik.errors.personalInfo?.lastName}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">ID Number *</Label>
                  <Input
                    name="personalInfo.idNumber"
                    value={formik.values.personalInfo.idNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.personalInfo?.idNumber &&
                      !!formik.errors.personalInfo?.idNumber
                    }
                  />
                  <FormFeedback>{formik.errors.personalInfo?.idNumber}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Gender</Label>
                  <Select
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                    value={
                      formik.values.personalInfo.gender
                        ? {
                          value: formik.values.personalInfo.gender,
                          label:
                            formik.values.personalInfo.gender === "male" ? "Male" : "Female",
                        }
                        : null
                    }
                    onChange={(opt) => formik.setFieldValue("personalInfo.gender", opt?.value || "")}
                    isClearable
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Date of Birth</Label>
                  <Input
                    type="date"
                    name="personalInfo.dateOfBirth"
                    value={formik.values.personalInfo.dateOfBirth}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Status</Label>
                  <Select
                    options={statusOptions.filter((x) => x.value !== "all")}
                    value={statusOptions.find((x) => x.value === formik.values.status)}
                    onChange={(opt) => formik.setFieldValue("status", opt?.value || "prospective")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Primary Phone *</Label>
                  <Input
                    name="contact.primaryPhone"
                    value={formik.values.contact.primaryPhone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.contact?.primaryPhone &&
                      !!formik.errors.contact?.primaryPhone
                    }
                  />
                  <FormFeedback>{formik.errors.contact?.primaryPhone}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Secondary Phone</Label>
                  <Input
                    name="contact.secondaryPhone"
                    value={formik.values.contact.secondaryPhone}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Emergency Name</Label>
                  <Input
                    name="contact.emergencyContact.name"
                    value={formik.values.contact.emergencyContact.name}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Emergency Relation</Label>
                  <Input
                    name="contact.emergencyContact.relationship"
                    value={formik.values.contact.emergencyContact.relationship}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Emergency Phone</Label>
                  <Input
                    name="contact.emergencyContact.phone"
                    value={formik.values.contact.emergencyContact.phone}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">National ID Number</Label>
                  <Input
                    name="nationalIdNumber"
                    value={formik.values.nationalIdNumber}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Passport Number</Label>
                  <Input
                    name="passportNumber"
                    value={formik.values.passportNumber}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup className="mb-0">
              <Label className="form-label">Email *</Label>
              <Input
                name="contact.email"
                type="email"
                value={formik.values.contact.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.contact?.email && !!formik.errors.contact?.email}
              />
              <FormFeedback>{formik.errors.contact?.email}</FormFeedback>
            </FormGroup>
            <FormGroup check className="mt-3">
              <Input
                id="tenant-is-verified"
                type="checkbox"
                name="isVerified"
                checked={formik.values.isVerified}
                onChange={formik.handleChange}
              />
              <Label check htmlFor="tenant-is-verified">
                Tenant Verified
              </Label>
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
              ) : selectedTenant ? (
                "Update Tenant"
              ) : (
                "Create Tenant"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} centered size="lg">
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          Tenant Details
        </ModalHeader>
        <ModalBody>
          {selectedTenant ? (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="fw-semibold">Name</div>
                  <div>
                    {selectedTenant.personalInfo?.firstName} {selectedTenant.personalInfo?.lastName}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="fw-semibold">Status</div>
                  <Badge color={statusBadgeColor(selectedTenant.status)} className="text-capitalize">
                    {selectedTenant.status}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="fw-semibold">Phone</div>
                  <div>{selectedTenant.contact?.primaryPhone || "-"}</div>
                </Col>
                <Col md={6}>
                  <div className="fw-semibold">Email</div>
                  <div>{selectedTenant.contact?.email || "-"}</div>
                </Col>
              </Row>
              <h6 className="mb-2">Lease History</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Lease #</th>
                      <th>Unit</th>
                      <th>Building</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantLeases.length ? (
                      tenantLeases.map((lease) => (
                        <tr key={lease._id}>
                          <td>{lease.leaseNumber}</td>
                          <td>{lease.unitId?.unitNumber || "-"}</td>
                          <td>{lease.buildingId?.name || "-"}</td>
                          <td className="text-capitalize">{lease.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No lease history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <hr />
              <h6 className="mb-2">Tenant Documents</h6>
              <Row className="g-2 mb-3">
                <Col md={4}>
                  <Label className="form-label">Document Type</Label>
                  <Select
                    options={[
                      { value: "PASSPORT", label: "Passport" },
                      { value: "NATIONAL_ID", label: "National ID" },
                      { value: "CONTRACT_COPY", label: "Contract Copy" },
                      { value: "OTHER", label: "Other" },
                    ]}
                    value={{
                      value: documentType,
                      label:
                        documentType === "PASSPORT"
                          ? "Passport"
                          : documentType === "NATIONAL_ID"
                            ? "National ID"
                            : documentType === "CONTRACT_COPY"
                              ? "Contract Copy"
                              : "Other",
                    }}
                    onChange={(opt) => setDocumentType(opt?.value || "OTHER")}
                    classNamePrefix="select"
                  />
                </Col>
                <Col md={4}>
                  <Label className="form-label">File</Label>
                  <Input type="file" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                </Col>
                <Col md={4}>
                  <Label className="form-label">Note</Label>
                  <Input value={documentNote} onChange={(e) => setDocumentNote(e.target.value)} />
                </Col>
              </Row>
              <Button
                color="primary"
                className="mb-3"
                disabled={!documentFile || documentSaving || !selectedTenant?._id}
                onClick={async () => {
                  if (!documentFile || !selectedTenant?._id) return;
                  const formData = new FormData();
                  formData.append("documentType", documentType);
                  formData.append("note", documentNote);
                  formData.append("file", documentFile);
                  try {
                    setDocumentSaving(true);
                    await dispatch(
                      onUploadTenantDocument({
                        id: selectedTenant._id,
                        formData,
                      }),
                    );
                    setDocumentFile(null);
                    setDocumentNote("");
                    await dispatch(onGetTenantDocuments({ id: selectedTenant._id }));
                  } finally {
                    setDocumentSaving(false);
                  }
                }}
              >
                {documentSaving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload Document"
                )}
              </Button>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantDocuments.length ? (
                      tenantDocuments.map((doc) => (
                        <tr key={doc._id}>
                          <td className="text-capitalize">{doc.documentType?.replaceAll("_", " ")}</td>
                          <td>
                            {doc.documentUrl ? (
                              <a href={doc.documentUrl} target="_blank" rel="noreferrer">
                                View
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            <Badge color={doc.isVerified ? "success" : "warning"}>
                              {doc.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              color={doc.isVerified ? "outline-secondary" : "outline-success"}
                              onClick={async () => {
                                await dispatch(
                                  onVerifyTenantDocument({
                                    tenantId: selectedTenant._id,
                                    documentId: doc._id,
                                    isVerified: !doc.isVerified,
                                  }),
                                );
                                await dispatch(onGetTenantDocuments({ id: selectedTenant._id }));
                              }}
                            >
                              {doc.isVerified ? "Unverify" : "Verify"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No tenant documents found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </ModalBody>
      </Modal>

      <DeleteModal
        show={deleteModal}
        onDeleteClick={async () => {
          if (!selectedTenant?._id) return;
          await dispatch(onDeleteTenant({ id: selectedTenant._id }));
          setDeleteModal(false);
          setSelectedTenant(null);
          fetchTenants();
        }}
        onCloseClick={() => setDeleteModal(false)}
        confirmationText={
          selectedTenant
            ? `Are you sure you want to delete tenant "${selectedTenant.tenantCode}"?`
            : ""
        }
      />

      <ToastContainer />
    </div>
  );
};

export default Tenants;
