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
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { FinanceAPI } from "../../../helpers/backend_helper";
import {
  createExpense as onCreateExpense,
  getBuildings as onGetBuildings,
  getExpenses as onGetExpenses,
} from "../../../slices/thunks";

const categoryOptions = [
  { value: "salary", label: "Employee Salary" },
  { value: "maintenance", label: "Maintenance Repairing" },
  { value: "utilities", label: "Utilities" },
  { value: "security", label: "Security" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "evc", label: "EVC" },
  { value: "merchant", label: "Merchant" },
  { value: "bank", label: "Bank" },
];

const generateExpenseNumber = () =>
  `EXP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const Expenses = () => {
  document.title = "Finance - Expenses | Apartment Management";
  const dispatch = useDispatch();

  const financeSelector = createSelector(
    (state) => state.Finance,
    (s) => ({
      expenses: s.expenses || [],
      pagination: s.expensePagination || {},
      loading: s.loadingExpenses,
    }),
  );
  const buildingsSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
  const { expenses, pagination, loading } = useSelector(financeSelector);
  const buildings = useSelector(buildingsSelector);

  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(false);

  const fetchExpenses = useCallback(() => {
    dispatch(onGetExpenses({ params: { page: currentPage, limit: 10 } }));
  }, [currentPage, dispatch]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    dispatch(onGetBuildings({ params: { page: 1, limit: 100 } }));
  }, [dispatch]);

  const buildingOptions = useMemo(
    () =>
      buildings.map((building) => ({
        value: building._id,
        label: `${building.name} (${building.code})`,
      })),
    [buildings],
  );

  const expenseFormik = useFormik({
    initialValues: {
      expenseNumber: generateExpenseNumber(),
      category: "salary",
      subCategory: "",
      description: "",
      amount: "",
      buildingId: "",
      payeeName: "",
      payeeContact: "",
      payeeEmail: "",
      expenseDate: new Date().toISOString().split("T")[0],
      paid: true,
      paymentMethod: "cash",
      transactionId: "",
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
      description: Yup.string().required("Description is required"),
      amount: Yup.number().min(0).required("Amount is required"),
      payeeName: Yup.string().required("Payee name is required"),
      expenseDate: Yup.string().required("Expense date is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await dispatch(
          onCreateExpense({
            data: {
              expenseNumber: values.expenseNumber,
              category: values.category,
              subCategory: values.subCategory || undefined,
              description: values.description,
              amount: Number(values.amount),
              buildingId: values.buildingId || undefined,
              payee: {
                name: values.payeeName,
                contact: values.payeeContact || undefined,
                email: values.payeeEmail || undefined,
              },
              expenseDate: values.expenseDate,
              payment: {
                method: values.paymentMethod,
                paid: Boolean(values.paid),
                paidDate: values.paid ? values.expenseDate : undefined,
                transactionId: values.transactionId || undefined,
              },
            },
          }),
        );
        setModal(false);
        resetForm({
          values: {
            expenseNumber: generateExpenseNumber(),
            category: "salary",
            subCategory: "",
            description: "",
            amount: "",
            buildingId: "",
            payeeName: "",
            payeeContact: "",
            payeeEmail: "",
            expenseDate: new Date().toISOString().split("T")[0],
            paid: true,
            paymentMethod: "cash",
            transactionId: "",
          },
        });
        fetchExpenses();
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
      name: "Expense",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.expenseNumber || "-"}</div>
          <small className="text-muted">{row.description || "-"}</small>
        </div>
      ),
    },
    {
      name: "Category",
      cell: (row) => <span className="text-capitalize">{row.category || "-"}</span>,
    },
    {
      name: "Amount",
      cell: (row) => `$${Number(row.amount || 0).toLocaleString()}`,
    },
    {
      name: "Date",
      cell: (row) => (row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : "-"),
    },
    {
      name: "Approval",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Badge color={row.approval?.status === "approved" ? "success" : "warning"}>
            {row.approval?.status || "pending"}
          </Badge>
          <Button
            size="sm"
            color="outline-success"
            onClick={async () => {
              const res = await FinanceAPI.approveExpense(row._id, { status: "approved" });
              if (res.success) {
                toast.success("Expense approved.");
                fetchExpenses();
              }
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            color="outline-danger"
            onClick={async () => {
              const res = await FinanceAPI.approveExpense(row._id, { status: "rejected" });
              if (res.success) {
                toast.success("Expense rejected.");
                fetchExpenses();
              }
            }}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Expenses" pageTitle="Finance" />
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0">Expense Entries</h5>
            <Button color="primary" onClick={() => setModal(true)}>
              Add Expense
            </Button>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={columns}
              data={expenses}
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

      <Modal isOpen={modal} toggle={() => setModal(false)} centered size="lg">
        <ModalHeader toggle={() => setModal(false)} className="bg-light">
          Add Expense Entry
        </ModalHeader>
        <Form onSubmit={expenseFormik.handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Expense Number</Label>
                  <Input
                    name="expenseNumber"
                    placeholder="Auto-generated expense number"
                    value={expenseFormik.values.expenseNumber}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Category *</Label>
                  <Select
                    options={categoryOptions}
                    placeholder="Select expense category"
                    value={categoryOptions.find((x) => x.value === expenseFormik.values.category) || null}
                    onChange={(opt) => expenseFormik.setFieldValue("category", opt?.value || "other")}
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Sub Category</Label>
                  <Input
                    name="subCategory"
                    placeholder="Enter sub category (optional)"
                    value={expenseFormik.values.subCategory}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Amount *</Label>
                  <Input
                    type="number"
                    min="0"
                    name="amount"
                    placeholder="Enter expense amount"
                    value={expenseFormik.values.amount}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label className="form-label">Description *</Label>
              <Input
                type="textarea"
                rows="3"
                name="description"
                placeholder="Describe the expense entry"
                value={expenseFormik.values.description}
                onChange={expenseFormik.handleChange}
              />
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Building</Label>
                  <Select
                    options={buildingOptions}
                    placeholder="Select building (optional)"
                    value={buildingOptions.find((x) => x.value === expenseFormik.values.buildingId) || null}
                    onChange={(opt) => expenseFormik.setFieldValue("buildingId", opt?.value || "")}
                    isClearable
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Expense Date *</Label>
                  <Input
                    type="date"
                    name="expenseDate"
                    value={expenseFormik.values.expenseDate}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Payee Name *</Label>
                  <Input
                    name="payeeName"
                    placeholder="Enter payee name"
                    value={expenseFormik.values.payeeName}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Payee Contact</Label>
                  <Input
                    name="payeeContact"
                    placeholder="Enter payee contact number"
                    value={expenseFormik.values.payeeContact}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label className="form-label">Payee Email</Label>
                  <Input
                    type="email"
                    name="payeeEmail"
                    placeholder="Enter payee email"
                    value={expenseFormik.values.payeeEmail}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label className="form-label">Payment Method</Label>
                  <Select
                    options={paymentMethodOptions}
                    placeholder="Select payment method"
                    value={
                      paymentMethodOptions.find(
                        (x) => x.value === expenseFormik.values.paymentMethod,
                      ) || null
                    }
                    onChange={(opt) =>
                      expenseFormik.setFieldValue("paymentMethod", opt?.value || "cash")
                    }
                    classNamePrefix="select"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Transaction ID</Label>
                  <Input
                    name="transactionId"
                    placeholder="Enter transaction ID (optional)"
                    value={expenseFormik.values.transactionId}
                    onChange={expenseFormik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light">
            <Button color="light" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={expenseFormik.isSubmitting}>
              {expenseFormik.isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default Expenses;
