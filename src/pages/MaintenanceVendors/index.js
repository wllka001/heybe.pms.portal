import React, { useEffect, useMemo, useState } from "react";
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
import { RiPencilLine } from "react-icons/ri";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import ActionIconButton from "../../Components/Common/ActionIconButton";
import { createVendor as onCreateVendor, getVendors as onGetVendors, updateVendor as onUpdateVendor } from "../../slices/thunks";

const categoryOptions = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklisted", label: "Blacklisted" },
];

const MaintenanceVendors = () => {
  document.title = "Vendors | Degaanly";
  const dispatch = useDispatch();

  const selector = createSelector((state) => state.Maintenance, (s) => ({
    vendors: s.vendors || [],
    loading: s.loading,
  }));
  const { vendors, loading } = useSelector(selector);

  const [modal, setModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    dispatch(onGetVendors());
  }, [dispatch]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: selectedVendor?.name || "",
      category: selectedVendor?.category || "general",
      specialties: Array.isArray(selectedVendor?.specialties)
        ? selectedVendor.specialties.join(", ")
        : "",
      status: selectedVendor?.status || "active",
      contact: {
        primaryPhone: selectedVendor?.contact?.primaryPhone || "",
        secondaryPhone: selectedVendor?.contact?.secondaryPhone || "",
        email: selectedVendor?.contact?.email || "",
        website: selectedVendor?.contact?.website || "",
      },
      primaryContact: {
        contactPerson: selectedVendor?.primaryContact?.contactPerson || "",
        contactPhone: selectedVendor?.primaryContact?.contactPhone || "",
        contactEmail: selectedVendor?.primaryContact?.contactEmail || "",
      },
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Vendor name is required"),
      category: Yup.string().required("Category is required"),
      contact: Yup.object({
        primaryPhone: Yup.string().required("Primary phone is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
      }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const payload = {
        name: values.name.trim(),
        category: values.category,
        specialties: values.specialties
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        status: values.status,
        contact: {
          primaryPhone: values.contact.primaryPhone.trim(),
          secondaryPhone: values.contact.secondaryPhone?.trim() || undefined,
          email: values.contact.email.trim(),
          website: values.contact.website?.trim() || undefined,
        },
        primaryContact: {
          contactPerson: values.primaryContact.contactPerson?.trim() || undefined,
          contactPhone: values.primaryContact.contactPhone?.trim() || undefined,
          contactEmail: values.primaryContact.contactEmail?.trim() || undefined,
        },
      };
      try {
        if (selectedVendor?._id) {
          await dispatch(onUpdateVendor({ id: selectedVendor._id, data: payload }));
        } else {
          await dispatch(onCreateVendor({ data: payload }));
        }
        setModal(false);
        setSelectedVendor(null);
        resetForm();
        dispatch(onGetVendors());
      } finally {
        setSubmitting(false);
      }
    },
  });

  const columns = useMemo(
    () => [

      {

        name: "#",
        cell: (row, index) => <span>{index + 1}</span>
      },

      {
        name: "Vendor",
        grow: 2,
        cell: (row) => (
          <div>
            <div className="fw-semibold">{row.name}</div>
            <small className="text-muted">{row.vendorCode}</small>
          </div>
        ),
      },
      {
        name: "Category",
        cell: (row) => <Badge color="primary" className="text-capitalize">{row.category}</Badge>,
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
        name: "Status",
        cell: (row) => (
          <Badge color={row.status === "active" ? "success" : row.status === "inactive" ? "secondary" : "danger"} className="text-capitalize">
            {row.status}
          </Badge>
        ),
      },
      {
        name: "Actions",
        cell: (row) => (
          <ActionIconButton
            id={`edit-vendor-${row._id}`}
            icon={<RiPencilLine size={16} />}
            tooltip="Edit Vendor"
            onClick={() => {
              setSelectedVendor(row);
              setModal(true);
            }}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Vendors" pageTitle="Maintenance" />
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0">
              <i className="ri-store-2-line me-2" />
              Vendors
              <Badge color="primary" className="ms-2">{vendors.length}</Badge>
            </h5>
            <Button
              color="primary"
              onClick={() => {
                setSelectedVendor(null);
                setModal(true);
              }}
            >
              <i className="ri-add-line me-1" />
              Vendor
            </Button>
          </CardHeader>
          <CardBody>
            {loading ? <Loader /> : <DataTable columns={columns} data={vendors} responsive />}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg" centered>
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          {selectedVendor ? "Edit Vendor" : "Create Vendor"}
        </ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label className="form-label">Name *</Label>
                  <Input
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.name && !!formik.errors.name}
                  />
                  <FormFeedback>{formik.errors.name}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Category *</Label>
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find((x) => x.value === formik.values.category)}
                    onChange={(opt) => formik.setFieldValue("category", opt?.value || "general")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Status</Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((x) => x.value === formik.values.status)}
                    onChange={(opt) => formik.setFieldValue("status", opt?.value || "active")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label className="form-label">Specialties (comma separated)</Label>
              <Input
                name="specialties"
                value={formik.values.specialties}
                onChange={formik.handleChange}
              />
            </FormGroup>
            <h6 className="mt-3 mb-2">Contact</h6>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Primary Phone *</Label>
                  <Input
                    name="contact.primaryPhone"
                    value={formik.values.contact.primaryPhone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.contact?.primaryPhone && !!formik.errors.contact?.primaryPhone}
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
              <Col md={6}>
                <FormGroup>
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
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Website</Label>
                  <Input
                    name="contact.website"
                    value={formik.values.contact.website}
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
              ) : selectedVendor ? (
                "Update Vendor"
              ) : (
                "Create Vendor"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default MaintenanceVendors;
