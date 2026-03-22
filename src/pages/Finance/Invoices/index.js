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
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { FinanceAPI } from "../../../helpers/backend_helper";
import {
  createInvoice as onCreateInvoice,
  generateMonthlyInvoices as onGenerateMonthlyInvoices,
  getInvoices as onGetInvoices,
  getLeases as onGetLeases,
} from "../../../slices/thunks";

const Invoices = () => {
  document.title = "Finance - Invoices | Apartment Management";
  const dispatch = useDispatch();

  const financeSelector = createSelector(
    (state) => state.Finance,
    (s) => ({
      invoices: s.invoices || [],
      pagination: s.invoicePagination || {},
      loading: s.loadingInvoices,
    }),
  );
  const leasesSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const { invoices, pagination, loading } = useSelector(financeSelector);
  const leases = useSelector(leasesSelector);

  const [currentPage, setCurrentPage] = useState(1);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [singleEntryModal, setSingleEntryModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(() => {
    dispatch(onGetInvoices({ params: { page: currentPage, limit: 10 } }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
  }, [dispatch]);

  const leaseMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => map.set(lease._id, lease));
    return map;
  }, [leases]);

  const leaseOptions = useMemo(
    () =>
      leases.map((lease) => ({
        value: lease._id,
        label: `${lease.leaseNumber} - ${lease.unitId?.unitNumber || "Unit"}`,
      })),
    [leases],
  );

  const now = new Date();
  const generatorFormik = useFormik({
    initialValues: {
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    },
    validationSchema: Yup.object({
      month: Yup.number().min(1).max(12).required(),
      year: Yup.number().min(2020).required(),
    }),
    onSubmit: async (values) => {
      setGenerateLoading(true);
      try {
        await dispatch(
          onGenerateMonthlyInvoices({
            data: {
              month: Number(values.month),
              year: Number(values.year),
            },
          }),
        );
        fetchInvoices();
      } finally {
        setGenerateLoading(false);
      }
    },
  });

  const singleInvoiceFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      leaseId: "",
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
      dueDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`,
      rentAmount: "",
      waterAmount: "",
      electricityAmount: "",
      gasAmount: "",
      trashAmount: "",
      securityAmount: "",
    },
    validationSchema: Yup.object({
      leaseId: Yup.string().required("Lease is required"),
      month: Yup.number().min(1).max(12).required("Month is required"),
      year: Yup.number().required("Year is required"),
      dueDate: Yup.string().required("Due date is required"),
      rentAmount: Yup.number().min(0).required("Rent amount is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const utilityRows = [
        { type: "water", amount: Number(values.waterAmount || 0) },
        { type: "electricity", amount: Number(values.electricityAmount || 0) },
        { type: "gas", amount: Number(values.gasAmount || 0) },
        { type: "garbage", amount: Number(values.trashAmount || 0) },
        { type: "security", amount: Number(values.securityAmount || 0) },
      ].filter((entry) => entry.amount > 0);

      try {
        await dispatch(
          onCreateInvoice({
            data: {
              leaseId: values.leaseId,
              month: Number(values.month),
              year: Number(values.year),
              dueDate: values.dueDate,
              rentAmount: Number(values.rentAmount),
              utilities: utilityRows,
            },
          }),
        );
        setSingleEntryModal(false);
        resetForm();
        fetchInvoices();
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
      name: "Invoice",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.invoiceNumber || "-"}</div>
          <small className="text-muted">
            {row.period?.year}-{String(row.period?.month || "").padStart(2, "0")}
          </small>
        </div>
      ),
    },
    {
      name: "Lease",
      grow: 2,
      cell: (row) => {
        const lease = leaseMap.get(row.leaseId);
        if (!lease) return "-";
        return `${lease.leaseNumber} (${lease.unitId?.unitNumber || "Unit"})`;
      },
    },
    {
      name: "Total",
      cell: (row) => `$${Number(row.summary?.totalAmount || 0).toLocaleString()}`,
    },
    {
      name: "Balance",
      cell: (row) => `$${Number(row.balance || 0).toLocaleString()}`,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={row.status === "paid" ? "success" : "warning"} className="text-capitalize">
          {row.status || "-"}
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
            onClick={async () => {
              const res = await FinanceAPI.getInvoice(row._id);
              if (res.success) {
                setSelectedInvoice(res.data);
                setViewModal(true);
              }
            }}
          >
            View
          </Button>
          <Button
            color="outline-primary"
            size="sm"
            onClick={async () => {
              const res = await FinanceAPI.invoicePdf(row._id);
              if (res.success && res.data?.downloadUrl) {
                window.open(res.data.downloadUrl, "_blank");
              }
            }}
          >
            PDF
          </Button>
          <Button
            color="outline-warning"
            size="sm"
            onClick={async () => {
              const res = await FinanceAPI.sendInvoiceReminder(row._id);
              if (res.success) {
                toast.success("Reminder sent successfully.");
              }
            }}
          >
            Remind
          </Button>
        </div>
      ),
    },
  ];

  const printInvoice = () => {
    if (!selectedInvoice) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const items = selectedInvoice?.items?.utilities || [];
    const rows = items
      .map(
        (item) =>
          `<tr><td>${item.description || item.type || "-"}</td><td>${Number(item.total || 0).toLocaleString()}</td></tr>`,
      )
      .join("");
    printWindow.document.write(`
      <html>
        <head><title>Invoice ${selectedInvoice.invoiceNumber}</title></head>
        <body>
          <h2>Invoice ${selectedInvoice.invoiceNumber}</h2>
          <p>Status: ${selectedInvoice.status}</p>
          <p>Period: ${selectedInvoice.period?.year}-${String(selectedInvoice.period?.month || "").padStart(2, "0")}</p>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
            <thead><tr><th>Item</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>Rent</td><td>${Number(selectedInvoice?.items?.rent?.amount || 0).toLocaleString()}</td></tr>
              ${rows}
              <tr><td><strong>Total</strong></td><td><strong>${Number(selectedInvoice?.summary?.totalAmount || 0).toLocaleString()}</strong></td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Invoices" pageTitle="Finance" />

        <Card className="mb-4">
          <CardBody>
            <Form onSubmit={generatorFormik.handleSubmit}>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Month</Label>
                    <Input
                      type="number"
                      name="month"
                      min="1"
                      max="12"
                      placeholder="Enter month (1-12)"
                      value={generatorFormik.values.month}
                      onChange={generatorFormik.handleChange}
                    />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Year</Label>
                    <Input
                      type="number"
                      name="year"
                      placeholder="Enter year (e.g. 2026)"
                      value={generatorFormik.values.year}
                      onChange={generatorFormik.handleChange}
                    />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <Button color="primary" className="w-100" type="submit" disabled={generateLoading}>
                    {generateLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Generating...
                      </>
                    ) : (
                      "Generate Monthly Invoices"
                    )}
                  </Button>
                </Col>
                <Col md={3}>
                  <Button color="success" className="w-100" onClick={() => setSingleEntryModal(true)}>
                    Single Entry Invoice
                  </Button>
                </Col>
              </Row>
            </Form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="bg-light">
            <h5 className="card-title mb-0">Invoice List</h5>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={columns}
              data={invoices}
              progressPending={loading}
              pagination
              paginationServer
              paginationTotalRows={pagination?.total || 0}
              paginationPerPage={pagination?.limit || 10}
              paginationDefaultPage={currentPage}
              onChangePage={(p) => setCurrentPage(p)}
              responsive
            />
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={singleEntryModal} toggle={() => setSingleEntryModal(false)} centered size="lg">
        <ModalHeader toggle={() => setSingleEntryModal(false)} className="bg-light">
          Single Entry Invoice
        </ModalHeader>
        <Form onSubmit={singleInvoiceFormik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Lease *</Label>
                  <Select
                    options={leaseOptions}
                    placeholder="Select active lease"
                    value={leaseOptions.find((x) => x.value === singleInvoiceFormik.values.leaseId) || null}
                    onChange={(opt) => singleInvoiceFormik.setFieldValue("leaseId", opt?.value || "")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label className="form-label">Month *</Label>
                  <Input
                    type="number"
                    name="month"
                    min="1"
                    max="12"
                    placeholder="1-12"
                    value={singleInvoiceFormik.values.month}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label className="form-label">Year *</Label>
                  <Input
                    type="number"
                    name="year"
                    placeholder="YYYY"
                    value={singleInvoiceFormik.values.year}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Due Date *</Label>
                  <Input
                    type="date"
                    name="dueDate"
                    value={singleInvoiceFormik.values.dueDate}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Rent Amount *</Label>
                  <Input
                    type="number"
                    name="rentAmount"
                    min="0"
                    placeholder="Enter rent amount"
                    value={singleInvoiceFormik.values.rentAmount}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Water Amount</Label>
                  <Input
                    type="number"
                    name="waterAmount"
                    min="0"
                    placeholder="Water charge"
                    value={singleInvoiceFormik.values.waterAmount}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Electricity Amount</Label>
                  <Input
                    type="number"
                    name="electricityAmount"
                    min="0"
                    placeholder="Electricity charge"
                    value={singleInvoiceFormik.values.electricityAmount}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Gas Amount</Label>
                  <Input
                    type="number"
                    name="gasAmount"
                    min="0"
                    placeholder="Gas charge"
                    value={singleInvoiceFormik.values.gasAmount}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Trash Amount</Label>
                  <Input
                    type="number"
                    name="trashAmount"
                    min="0"
                    placeholder="Trash/garbage charge"
                    value={singleInvoiceFormik.values.trashAmount}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Security Amount (Optional)</Label>
                  <Input
                    type="number"
                    name="securityAmount"
                    min="0"
                    placeholder="Optional security charge"
                    value={singleInvoiceFormik.values.securityAmount}
                    onChange={singleInvoiceFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light">
            <Button color="light" onClick={() => setSingleEntryModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={singleInvoiceFormik.isSubmitting}>
              {singleInvoiceFormik.isSubmitting ? "Saving..." : "Create Invoice"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} centered size="lg">
        <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
          Invoice Details
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Invoice Number</Label>
              <div className="fw-semibold">{selectedInvoice?.invoiceNumber || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Status</Label>
              <div className="fw-semibold text-capitalize">{selectedInvoice?.status || "-"}</div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Total</Label>
              <div className="fw-semibold">
                ${Number(selectedInvoice?.summary?.totalAmount || 0).toLocaleString()}
              </div>
            </Col>
            <Col md={6}>
              <Label className="form-label text-muted mb-1">Balance</Label>
              <div className="fw-semibold">${Number(selectedInvoice?.balance || 0).toLocaleString()}</div>
            </Col>
            <Col md={12}>
              <Label className="form-label text-muted mb-1">Utility Items</Label>
              <div>
                {(selectedInvoice?.items?.utilities || []).length ? (
                  (selectedInvoice?.items?.utilities || []).map((item, i) => (
                    <div key={i} className="small">
                      {item.description || item.type}: ${Number(item.total || 0).toLocaleString()}
                    </div>
                  ))
                ) : (
                  <div className="small text-muted">No utility items.</div>
                )}
              </div>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="primary" onClick={printInvoice}>
            Print Invoice
          </Button>
          <Button color="light" onClick={() => setViewModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default Invoices;
