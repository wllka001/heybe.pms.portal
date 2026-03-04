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
import {
  createUtilityUsage as onCreateUtilityUsage,
  deleteUtilityUsage as onDeleteUtilityUsage,
  getLeases as onGetLeases,
  getUtilityUsages as onGetUtilityUsages,
  updateUtilityUsage as onUpdateUtilityUsage,
} from "../../slices/thunks";

const UtilityUsages = () => {
  document.title = "Utility Usage | Apartment Management";
  const dispatch = useDispatch();

  const usageSelector = createSelector(
    (state) => state.UtilityUsages,
    (s) => ({ usages: s.usages, pagination: s.pagination, loading: s.loading }),
  );
  const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const { usages, pagination, loading } = useSelector(usageSelector);
  const leases = useSelector(leaseSelector);

  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeaseId, setSelectedLeaseId] = useState("");

  const fetchUsages = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(selectedLeaseId && { leaseId: selectedLeaseId }),
    };
    dispatch(onGetUtilityUsages({ params }));
  }, [dispatch, currentPage, selectedLeaseId]);

  useEffect(() => {
    fetchUsages();
  }, [fetchUsages]);

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 200 } }));
  }, [dispatch]);

  const leaseOptions = useMemo(
    () =>
      leases.map((lease) => ({
        value: lease._id,
        label: `${lease.leaseNumber} - ${lease.unitId?.unitNumber || "Unit"}`,
      })),
    [leases],
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      leaseId:
        typeof selectedUsage?.leaseId === "object"
          ? selectedUsage.leaseId?._id || ""
          : selectedUsage?.leaseId || "",
      month: selectedUsage?.month || "",
      waterUsed: selectedUsage?.waterUsed ?? 0,
      electricityUsed: selectedUsage?.electricityUsed ?? 0,
      gasUsed: selectedUsage?.gasUsed ?? 0,
    },
    validationSchema: Yup.object({
      leaseId: Yup.string().required("Lease is required"),
      month: Yup.string()
        .matches(/^\d{4}-(0[1-9]|1[0-2])$/, "Month format must be YYYY-MM")
        .required("Month is required"),
      waterUsed: Yup.number().min(0).required("Water is required"),
      electricityUsed: Yup.number().min(0).required("Electricity is required"),
      gasUsed: Yup.number().min(0).required("Gas is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        leaseId: values.leaseId,
        month: values.month,
        waterUsed: Number(values.waterUsed),
        electricityUsed: Number(values.electricityUsed),
        gasUsed: Number(values.gasUsed),
      };
      try {
        if (selectedUsage?._id) {
          await dispatch(onUpdateUtilityUsage({ id: selectedUsage._id, data: payload }));
        } else {
          await dispatch(onCreateUtilityUsage({ data: payload }));
        }
        setModal(false);
        setSelectedUsage(null);
        resetForm();
        fetchUsages();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const columns = [
    {
      name: "#",
      width: "70px",
      cell: (_row, i) => (currentPage - 1) * (pagination?.limit || 10) + i + 1,
    },
    {
      name: "Lease",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.leaseId?.leaseNumber || "-"}</div>
          <small className="text-muted">{row.leaseId?.unitId || "-"}</small>
        </div>
      ),
    },
    { name: "Month", selector: (row) => row.month },
    { name: "Water", selector: (row) => row.waterUsed ?? 0 },
    { name: "Electricity", selector: (row) => row.electricityUsed ?? 0 },
    { name: "Gas", selector: (row) => row.gasUsed ?? 0 },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-primary"
            size="sm"
            className="btn-icon"
            onClick={() => {
              setSelectedUsage(row);
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
              setSelectedUsage(row);
              setDeleteModal(true);
            }}
          >
            <i className="ri-delete-bin-line" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Utility Usage" pageTitle="Operations" />
        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Lease</Label>
                  <Select
                    options={[{ value: "", label: "All Leases" }, ...leaseOptions]}
                    value={
                      [{ value: "", label: "All Leases" }, ...leaseOptions].find(
                        (x) => x.value === selectedLeaseId,
                      ) || null
                    }
                    onChange={(opt) => {
                      setSelectedLeaseId(opt?.value || "");
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
                    setSelectedLeaseId("");
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
              <i className="ri-flashlight-line me-2" />
              Utility Usage
              <Badge color="primary" className="ms-2">
                {pagination?.total || usages.length}
              </Badge>
            </h5>
            <Button
              color="primary"
              onClick={() => {
                setSelectedUsage(null);
                setModal(true);
              }}
            >
              <i className="ri-add-line me-1" />
              Entry
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Loader />
            ) : (
              <DataTable
                columns={columns}
                data={usages}
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

      <Modal isOpen={modal} toggle={() => setModal(false)} centered>
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          {selectedUsage ? "Edit Usage" : "Create Usage"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label className="form-label">Lease *</Label>
              <Select
                options={leaseOptions}
                value={leaseOptions.find((x) => x.value === formik.values.leaseId) || null}
                onChange={(opt) => formik.setFieldValue("leaseId", opt?.value || "")}
                classNamePrefix="select"
              />
              {formik.touched.leaseId && formik.errors.leaseId ? (
                <div className="text-danger small mt-1">{formik.errors.leaseId}</div>
              ) : null}
            </FormGroup>
            <FormGroup>
              <Label className="form-label">Month (YYYY-MM) *</Label>
              <Input
                name="month"
                placeholder="2026-02"
                value={formik.values.month}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.month && !!formik.errors.month}
              />
              <FormFeedback>{formik.errors.month}</FormFeedback>
            </FormGroup>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Water Used *</Label>
                  <Input
                    type="number"
                    min="0"
                    name="waterUsed"
                    value={formik.values.waterUsed}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Electricity Used *</Label>
                  <Input
                    type="number"
                    min="0"
                    name="electricityUsed"
                    value={formik.values.electricityUsed}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Gas Used *</Label>
                  <Input
                    type="number"
                    min="0"
                    name="gasUsed"
                    value={formik.values.gasUsed}
                    onChange={formik.handleChange}
                  />
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
              ) : selectedUsage ? (
                "Update Usage"
              ) : (
                "Create Usage"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <DeleteModal
        show={deleteModal}
        onDeleteClick={async () => {
          if (!selectedUsage?._id) return;
          await dispatch(onDeleteUtilityUsage({ id: selectedUsage._id }));
          setDeleteModal(false);
          setSelectedUsage(null);
          fetchUsages();
        }}
        onCloseClick={() => setDeleteModal(false)}
        confirmationText={
          selectedUsage
            ? `Are you sure you want to delete utility usage "${selectedUsage.month}"?`
            : ""
        }
      />
      <ToastContainer />
    </div>
  );
};

export default UtilityUsages;

