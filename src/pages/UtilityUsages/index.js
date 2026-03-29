import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../Components/Common/AppDataTable";
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
  createUtilityUsage as onCreateUtilityType,
  deleteUtilityUsage as onDeleteUtilityType,
  getUtilityUsages as onGetUtilityTypes,
  updateUtilityUsage as onUpdateUtilityType,
} from "../../slices/thunks";

const UtilityUsages = () => {
  document.title = "Utility Types | Apartment Management";
  const dispatch = useDispatch();

  const usageSelector = createSelector(
    (state) => state.UtilityUsages,
    (s) => ({ usages: s.usages, pagination: s.pagination, loading: s.loading }),
  );
  const { usages, pagination, loading } = useSelector(usageSelector);

  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchTypes = useCallback(() => {
    dispatch(
      onGetUtilityTypes({
        params: { page: currentPage, limit: 20, ...(search && { q: search }) },
      }),
    );
  }, [dispatch, currentPage, search]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: selectedType?.name || "",
      code: selectedType?.code || "",
      description: selectedType?.description || "",
      inputConfig: {
        hasPreviousValue: Boolean(selectedType?.inputConfig?.hasPreviousValue),
        hasCurrentValue: Boolean(selectedType?.inputConfig?.hasCurrentValue),
        hasRatePerUnit: Boolean(selectedType?.inputConfig?.hasRatePerUnit),
        hasPreviousDate: Boolean(selectedType?.inputConfig?.hasPreviousDate),
        hasCurrentDate: Boolean(selectedType?.inputConfig?.hasCurrentDate),
        hasFixedMonthlyAmount: Boolean(selectedType?.inputConfig?.hasFixedMonthlyAmount),
      },
      defaults: {
        ratePerUnit: selectedType?.defaults?.ratePerUnit ?? 0,
        fixedMonthlyAmount: selectedType?.defaults?.fixedMonthlyAmount ?? 0,
        taxRate: selectedType?.defaults?.taxRate ?? 0,
        unitLabel: selectedType?.defaults?.unitLabel || "",
      },
      isActive: selectedType?.isActive ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Type name is required"),
      code: Yup.string().required("Type code is required"),
      defaults: Yup.object({
        ratePerUnit: Yup.number().min(0),
        fixedMonthlyAmount: Yup.number().min(0),
        taxRate: Yup.number().min(0).max(100),
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        description: values.description.trim() || undefined,
        inputConfig: values.inputConfig,
        defaults: {
          ratePerUnit: Number(values.defaults.ratePerUnit || 0),
          fixedMonthlyAmount: Number(values.defaults.fixedMonthlyAmount || 0),
          taxRate: Number(values.defaults.taxRate || 0),
          unitLabel: values.defaults.unitLabel?.trim() || "",
        },
        isActive: Boolean(values.isActive),
      };

      try {
        if (selectedType?._id) {
          await dispatch(onUpdateUtilityType({ id: selectedType._id, data: payload }));
        } else {
          await dispatch(onCreateUtilityType({ data: payload }));
        }
        setModal(false);
        setSelectedType(null);
        resetForm();
        fetchTypes();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const columns = useMemo(
    () => [
      {
        name: "#",
        width: "70px",
        cell: (_row, i) => (currentPage - 1) * (pagination?.limit || 20) + i + 1,
      },
      {
        name: "Type",
        grow: 2,
        cell: (row) => (
          <div>
            <div className="fw-semibold">{row.name || "-"}</div>
            <small className="text-muted">{row.code || "-"}</small>
          </div>
        ),
      },
      {
        name: "Configuration",
        grow: 3,
        cell: (row) => {
          const flags = [];
          if (row.inputConfig?.hasPreviousValue) flags.push("Previous Value");
          if (row.inputConfig?.hasCurrentValue) flags.push("Current Value");
          if (row.inputConfig?.hasRatePerUnit) flags.push("Rate/Unit");
          if (row.inputConfig?.hasPreviousDate) flags.push("Previous Date");
          if (row.inputConfig?.hasCurrentDate) flags.push("Current Date");
          if (row.inputConfig?.hasFixedMonthlyAmount) flags.push("Fixed Monthly");
          return <small>{flags.length ? flags.join(", ") : "-"}</small>;
        },
      },
      {
        name: "Defaults",
        grow: 2,
        cell: (row) => (
          <div>
            <div>Rate: {Number(row.defaults?.ratePerUnit || 0)}</div>
            <small className="text-muted">
              Fixed: {Number(row.defaults?.fixedMonthlyAmount || 0)} | Tax:{" "}
              {Number(row.defaults?.taxRate || 0)}%
            </small>
          </div>
        ),
      },
      {
        name: "Status",
        cell: (row) => (
          <Badge color={row.isActive ? "success" : "secondary"}>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        name: "Actions",
        cell: (row) => (
          <div className="d-flex gap-2">
            <ActionIconButton
              id={`edit-usage-type-${row._id}`}
              icon={<RiPencilLine size={16} />}
              tooltip="Edit Usage Type"
              onClick={() => {
                setSelectedType(row);
                setModal(true);
              }}
            />
            <ActionIconButton
              id={`delete-usage-type-${row._id}`}
              icon={<RiDeleteBinLine size={16} />}
              tooltip="Delete Usage Type"
              onClick={() => {
                setSelectedType(row);
                setDeleteModal(true);
              }}
            />
          </div>
        ),
      },
    ],
    [currentPage, pagination?.limit],
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Utility Types" pageTitle="Operations" />
        <Card className="mb-4">
          <CardBody>
            <Row className="g-3 align-items-end">
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search</Label>
                  <Input
                    placeholder="Search by utility type name or code"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <Button
                  color="primary"
                  className="w-100 mb-3"
                  onClick={() => {
                    setSearch("");
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
            <h5 className="card-title mb-0">Utility Type Setup</h5>
            <Button
              color="primary"
              onClick={() => {
                setSelectedType(null);
                setModal(true);
              }}
            >
              <i className="ri-add-line me-1" />
              Utility Type
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
                paginationPerPage={pagination?.limit || 20}
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
          {selectedType ? "Edit Utility Type" : "Create Utility Type"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Type Name *</Label>
                  <Input
                    name="name"
                    placeholder="Enter utility type name (e.g. Water Meter)"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.name && !!formik.errors.name}
                  />
                  <FormFeedback>{formik.errors.name}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Type Code *</Label>
                  <Input
                    name="code"
                    placeholder="Enter utility code (e.g. WATER)"
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.code && !!formik.errors.code}
                  />
                  <FormFeedback>{formik.errors.code}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label className="form-label">Description</Label>
              <Input
                type="textarea"
                name="description"
                rows="2"
                placeholder="Enter utility type description"
                value={formik.values.description}
                onChange={formik.handleChange}
              />
            </FormGroup>

            <h6 className="mb-3 mt-2">Input Requirements</h6>
            <Row>
              {[
                ["hasPreviousValue", "Has Previous Value"],
                ["hasCurrentValue", "Has Current Value"],
                ["hasRatePerUnit", "Has Rate Per Unit"],
                ["hasPreviousDate", "Has Previous Date"],
                ["hasCurrentDate", "Has Current Date"],
                ["hasFixedMonthlyAmount", "Has Fixed Monthly Amount"],
              ].map(([key, label]) => (
                <Col md={4} key={key}>
                  <FormGroup check className="mb-2">
                    <Input
                      id={key}
                      type="checkbox"
                      checked={Boolean(formik.values.inputConfig[key])}
                      onChange={(e) => formik.setFieldValue(`inputConfig.${key}`, e.target.checked)}
                    />
                    <Label for={key} check>
                      {label}
                    </Label>
                  </FormGroup>
                </Col>
              ))}
            </Row>

            <h6 className="mb-3 mt-2">Default Values</h6>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Default Rate/Unit</Label>
                  <Input
                    type="number"
                    min="0"
                    name="defaults.ratePerUnit"
                    placeholder="Enter default rate"
                    value={formik.values.defaults.ratePerUnit}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Default Fixed Monthly</Label>
                  <Input
                    type="number"
                    min="0"
                    name="defaults.fixedMonthlyAmount"
                    placeholder="Enter fixed monthly amount"
                    value={formik.values.defaults.fixedMonthlyAmount}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Default Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    name="defaults.taxRate"
                    placeholder="Enter default tax percent"
                    value={formik.values.defaults.taxRate}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Unit Label</Label>
                  <Input
                    name="defaults.unitLabel"
                    placeholder="Enter unit label (e.g. m3, kWh)"
                    value={formik.values.defaults.unitLabel}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup check className="mt-4">
                  <Input
                    id="isActive"
                    type="checkbox"
                    checked={Boolean(formik.values.isActive)}
                    onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                  />
                  <Label for="isActive" check>
                    Active
                  </Label>
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
              ) : selectedType ? (
                "Update Type"
              ) : (
                "Create Type"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <DeleteModal
        show={deleteModal}
        onDeleteClick={async () => {
          if (!selectedType?._id) return;
          await dispatch(onDeleteUtilityType({ id: selectedType._id }));
          setDeleteModal(false);
          setSelectedType(null);
          fetchTypes();
        }}
        onCloseClick={() => setDeleteModal(false)}
        confirmationText={
          selectedType
            ? `Are you sure you want to delete utility type "${selectedType.name}"?`
            : ""
        }
      />
      <ToastContainer />
    </div>
  );
};

export default UtilityUsages;
