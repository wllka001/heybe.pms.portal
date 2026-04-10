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
import { ToastContainer } from "react-toastify";
import { RiDeleteBinLine, RiPencilLine } from "react-icons/ri";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import Loader from "../../Components/Common/Loader";
import ActionIconButton from "../../Components/Common/ActionIconButton";
import {
  createEmployee as onCreateEmployee,
  deleteEmployee as onDeleteEmployee,
  getBuildings as onGetBuildings,
  getEmployees as onGetEmployees,
  updateEmployee as onUpdateEmployee,
} from "../../slices/thunks";
import { FiEye } from "react-icons/fi";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

const departmentOptions = [
  { value: "management", label: "Management" },
  { value: "maintenance", label: "Maintenance" },
  { value: "security", label: "Security" },
  { value: "cleaning", label: "Cleaning" },
  { value: "accounting", label: "Accounting" },
  { value: "admin", label: "Admin" },
];

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "maintenance", label: "Maintenance" },
  { value: "security", label: "Security" },
  { value: "reception", label: "Reception" },
];

const Employees = () => {
  document.title = "Employees | Apartment Management";
  const dispatch = useDispatch();

  const employeeSelector = createSelector(
    (state) => state.Employees,
    (s) => ({
      employees: s.employees,
      pagination: s.pagination,
      loading: s.loading,
    }),
  );
  const buildingSelector = createSelector(
    (state) => state.Buildings,
    (s) => s.buildings || [],
  );
  const { employees, pagination, loading } = useSelector(employeeSelector);
  const buildings = useSelector(buildingSelector);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEmployees = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(status !== "all" && { status }),
    };
    dispatch(onGetEmployees({ params }));
  }, [currentPage, dispatch, status]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
  }, [dispatch]);

  const buildingOptions = useMemo(
    () =>
      buildings.map((b) => ({
        value: b._id,
        label: `${b.name} (${b.code})`,
      })),
    [buildings],
  );

  const filteredEmployees = useMemo(() => {
    if (!search) return employees;
    const term = search.toLowerCase();
    return employees.filter((item) => {
      const fullName = `${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""
        }`.toLowerCase();
      return (
        fullName.includes(term) ||
        (item.employeeCode || "").toLowerCase().includes(term) ||
        (item.contact?.email || "").toLowerCase().includes(term)
      );
    });
  }, [employees, search]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      employeeCode: selectedEmployee?.employeeCode || "",
      primaryBuildingId:
        typeof selectedEmployee?.primaryBuildingId === "object"
          ? selectedEmployee?.primaryBuildingId?._id || ""
          : selectedEmployee?.primaryBuildingId || "",
      personalInfo: {
        firstName: selectedEmployee?.personalInfo?.firstName || "",
        lastName: selectedEmployee?.personalInfo?.lastName || "",
        idNumber: selectedEmployee?.personalInfo?.idNumber || "",
      },
      contact: {
        primaryPhone: selectedEmployee?.contact?.primaryPhone || "",
        email: selectedEmployee?.contact?.email || "",
      },
      employment: {
        position: selectedEmployee?.employment?.position || "",
        department: selectedEmployee?.employment?.department || "admin",
        role: selectedEmployee?.employment?.role || "reception",
        startDate: selectedEmployee?.employment?.startDate
          ? new Date(selectedEmployee.employment.startDate).toISOString().split("T")[0]
          : "",
      },
      salary: {
        amount: selectedEmployee?.salary?.amount ?? "",
        frequency: selectedEmployee?.salary?.frequency || "monthly",
      },
    },
    validationSchema: Yup.object({
      employeeCode: Yup.string().optional(),
      personalInfo: Yup.object({
        firstName: Yup.string().required("First name is required"),
        lastName: Yup.string().required("Last name is required"),
        idNumber: Yup.string().required("ID number is required"),
      }),
      contact: Yup.object({
        primaryPhone: Yup.string().required("Primary phone is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
      }),
      employment: Yup.object({
        position: Yup.string().required("Position is required"),
        startDate: Yup.string().required("Start date is required"),
      }),
      salary: Yup.object({
        amount: Yup.number().min(0).required("Salary amount is required"),
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        employeeCode: values.employeeCode.trim() || undefined,
        primaryBuildingId: values.primaryBuildingId || undefined,
        personalInfo: {
          firstName: values.personalInfo.firstName.trim(),
          lastName: values.personalInfo.lastName.trim(),
          idNumber: values.personalInfo.idNumber.trim(),
        },
        contact: {
          primaryPhone: values.contact.primaryPhone.trim(),
          email: values.contact.email.trim(),
        },
        employment: {
          position: values.employment.position.trim(),
          department: values.employment.department,
          role: values.employment.role,
          startDate: values.employment.startDate,
        },
        salary: {
          amount: Number(values.salary.amount),
          frequency: values.salary.frequency,
        },
      };

      try {
        if (selectedEmployee?._id) {
          await dispatch(onUpdateEmployee({ id: selectedEmployee._id, data: payload }));
        } else {
          await dispatch(onCreateEmployee({ data: payload }));
        }
        setModal(false);
        setSelectedEmployee(null);
        resetForm();
        fetchEmployees();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_row, index) => (currentPage - 1) * (pagination?.limit || 10) + index + 1,
    },
    {
      name: "Employee",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">
            {row.personalInfo?.firstName} {row.personalInfo?.lastName}
          </div>
          <small className="text-muted">{row.employeeCode}</small>
        </div>
      ),
    },
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
      name: "Employment",
      grow: 2,
      cell: (row) => (
        <div>
          <div>{row.employment?.position || "-"}</div>
          <small className="text-muted text-capitalize">
            {row.employment?.department || "-"} | {row.employment?.role || "-"}
          </small>
        </div>
      ),
    },
    {
      name: "Salary",
      cell: (row) => `$${Number(row.salary?.amount || 0).toLocaleString()}`,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={row.status === "active" ? "success" : "secondary"} className="text-capitalize">
          {row.status || "active"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <ActionIconButton
            id={`view-employee-${row._id}`}
            icon={<FiEye size={16} />}
            tooltip="View Employee"
            onClick={() => {
              setSelectedEmployee(row);
              setViewModal(true);
            }}
          />
          {/* <ActionIconButton
            onClick={() => openDetails(row)}
            id={`view-${row._id}`}
           
            tooltip="View Details"
          /> */}
          <ActionIconButton
            id={`edit-employee-${row._id}`}
            icon={<RiPencilLine size={16} />}
            tooltip="Edit Employee"
            onClick={() => {
              setSelectedEmployee(row);
              setModal(true);
            }}
          />
          <ActionIconButton
            id={`delete-employee-${row._id}`}
            icon={<RiDeleteBinLine size={16} />}
            tooltip="Delete Employee"
            onClick={() => {
              setSelectedEmployee(row);
              setDeleteModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Employees" pageTitle="Operations" />
        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={5}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search</Label>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, code or email..."
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
              <i className="ri-user-settings-line me-2" />
              Employees
              <Badge color="primary" className="ms-2">
                {pagination?.total || employees.length}
              </Badge>
            </h5>
            <Button
              color="primary"
              onClick={() => {
                setSelectedEmployee(null);
                setModal(true);
              }}
            >
              <i className="ri-add-line me-1" />
              Employee
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={filteredEmployees}
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

      <Modal isOpen={modal} toggle={() => setModal(false)} centered size="lg">
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          {selectedEmployee ? "Edit Employee" : "Create Employee"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row>
              {selectedEmployee && (
                <Col md={6}>
                  <FormGroup>
                    <Label className="form-label">Employee Code</Label>
                    <Input
                      name="employeeCode"
                      placeholder="Enter employee code (e.g. EMP-001)"
                      value={formik.values.employeeCode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      invalid={formik.touched.employeeCode && !!formik.errors.employeeCode}
                    />
                    <FormFeedback>{formik.errors.employeeCode}</FormFeedback>
                  </FormGroup>
                </Col>
              )}
              <Col md={selectedEmployee ? 6 : 12}>
                <FormGroup>
                  <Label className="form-label">Primary Building</Label>
                  <Select
                    options={buildingOptions}
                    placeholder="Select primary building"
                    value={buildingOptions.find((x) => x.value === formik.values.primaryBuildingId) || null}
                    onChange={(opt) =>
                      formik.setFieldValue("primaryBuildingId", opt?.value || "")
                    }
                    isClearable
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">First Name *</Label>
                  <Input
                    name="personalInfo.firstName"
                    placeholder="Enter first name"
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
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Last Name *</Label>
                  <Input
                    name="personalInfo.lastName"
                    placeholder="Enter last name"
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
                    placeholder="Enter ID number"
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
                  <Label className="form-label">Primary Phone *</Label>
                  <Input
                    name="contact.primaryPhone"
                    placeholder="Enter primary phone number"
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
            </Row>
            <FormGroup>
              <Label className="form-label">Email *</Label>
              <Input
                name="contact.email"
                type="email"
                placeholder="Enter email address"
                value={formik.values.contact.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.contact?.email && !!formik.errors.contact?.email}
              />
              <FormFeedback>{formik.errors.contact?.email}</FormFeedback>
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Position *</Label>
                  <Input
                    name="employment.position"
                    placeholder="Enter job position"
                    value={formik.values.employment.position}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.employment?.position &&
                      !!formik.errors.employment?.position
                    }
                  />
                  <FormFeedback>{formik.errors.employment?.position}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Start Date *</Label>
                  <Input
                    name="employment.startDate"
                    type="date"
                    value={formik.values.employment.startDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={
                      formik.touched.employment?.startDate &&
                      !!formik.errors.employment?.startDate
                    }
                  />
                  <FormFeedback>{formik.errors.employment?.startDate}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Department</Label>
                  <Select
                    options={departmentOptions}
                    placeholder="Select department"
                    value={
                      departmentOptions.find(
                        (x) => x.value === formik.values.employment.department,
                      ) || null
                    }
                    onChange={(opt) =>
                      formik.setFieldValue("employment.department", opt?.value || "admin")
                    }
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Role</Label>
                  <Select
                    options={roleOptions}
                    placeholder="Select role"
                    value={
                      roleOptions.find((x) => x.value === formik.values.employment.role) ||
                      null
                    }
                    onChange={(opt) => formik.setFieldValue("employment.role", opt?.value || "reception")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Salary Amount *</Label>
                  <Input
                    name="salary.amount"
                    type="number"
                    min="0"
                    placeholder="Enter salary amount"
                    value={formik.values.salary.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.salary?.amount && !!formik.errors.salary?.amount}
                  />
                  <FormFeedback>{formik.errors.salary?.amount}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Salary Frequency</Label>
                  <Input
                    name="salary.frequency"
                    type="select"
                    value={formik.values.salary.frequency}
                    onChange={formik.handleChange}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="weekly">Weekly</option>
                  </Input>
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
              ) : selectedEmployee ? (
                "Update Employee"
              ) : (
                "Create Employee"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} centered size="lg">
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          Employee Details
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Employee Code</Label>
              <div className="fw-semibold">{selectedEmployee?.employeeCode || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Primary Building</Label>
              <div className="fw-semibold">
                {selectedEmployee?.primaryBuildingId?.name || "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">First Name</Label>
              <div className="fw-semibold">{selectedEmployee?.personalInfo?.firstName || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Last Name</Label>
              <div className="fw-semibold">{selectedEmployee?.personalInfo?.lastName || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">ID Number</Label>
              <div className="fw-semibold">{selectedEmployee?.personalInfo?.idNumber || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Primary Phone</Label>
              <div className="fw-semibold">{selectedEmployee?.contact?.primaryPhone || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Email</Label>
              <div className="fw-semibold">{selectedEmployee?.contact?.email || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Position</Label>
              <div className="fw-semibold">{selectedEmployee?.employment?.position || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Department</Label>
              <div className="fw-semibold text-capitalize">
                {selectedEmployee?.employment?.department || "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Role</Label>
              <div className="fw-semibold text-capitalize">
                {selectedEmployee?.employment?.role || "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Start Date</Label>
              <div className="fw-semibold">
                {selectedEmployee?.employment?.startDate
                  ? new Date(selectedEmployee.employment.startDate).toLocaleDateString()
                  : "-"}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Salary</Label>
              <div className="fw-semibold">
                ${Number(selectedEmployee?.salary?.amount || 0).toLocaleString()}{" "}
                <span className="text-capitalize text-muted">
                  ({selectedEmployee?.salary?.frequency || "monthly"})
                </span>
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

      <DeleteModal
        show={deleteModal}
        onDeleteClick={async () => {
          if (!selectedEmployee?._id) return;
          await dispatch(onDeleteEmployee({ id: selectedEmployee._id }));
          setDeleteModal(false);
          setSelectedEmployee(null);
          fetchEmployees();
        }}
        onCloseClick={() => setDeleteModal(false)}
        confirmationText={
          selectedEmployee
            ? `Are you sure you want to delete employee "${selectedEmployee.employeeCode}"?`
            : ""
        }
      />

      <ToastContainer />
    </div>
  );
};

export default Employees;
