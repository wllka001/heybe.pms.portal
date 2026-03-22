import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  FormGroup,
  Input,
  Label,
  Row,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { toast, ToastContainer } from "react-toastify";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { FinanceAPI, UtilityUsagesAPI } from "../../../helpers/backend_helper";
import { getLeases as onGetLeases } from "../../../slices/thunks";

const today = new Date().toISOString().split("T")[0];

const createEmptyForm = (type) => ({
  utilityTypeId: type?._id || "",
  previousValue: "",
  currentValue: "",
  ratePerUnit: String(type?.defaults?.ratePerUnit ?? ""),
  fixedAmount: String(type?.defaults?.fixedMonthlyAmount ?? ""),
  taxRate: String(type?.defaults?.taxRate ?? 0),
  previousDate: today,
  currentDate: today,
  notes: "",
});

const UtilityBills = () => {
  document.title = "Finance - Utility Bills | Apartment Management";

  const dispatch = useDispatch();
  const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const leases = useSelector(leaseSelector);

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [utilityTypes, setUtilityTypes] = useState([]);
  const [billingMonth, setBillingMonth] = useState(String(new Date().getMonth() + 1));
  const [billingYear, setBillingYear] = useState(String(new Date().getFullYear()));
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const [selectedUtilityTypeId, setSelectedUtilityTypeId] = useState("");
  const [form, setForm] = useState(createEmptyForm());

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
  }, [dispatch]);

  const fetchUtilityTypes = async () => {
    try {
      const res = await UtilityUsagesAPI.list({ page: 1, limit: 100, isActive: true });
      if (res.success) {
        const list = res.data?.data || [];
        setUtilityTypes(list);
        if (list.length > 0) {
          setSelectedUtilityTypeId((prev) => prev || list[0]._id);
        }
      }
    } catch (_e) {
      setUtilityTypes([]);
    }
  };

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await FinanceAPI.listReadings({
        page: 1,
        limit: 100,
        month: Number(billingMonth),
        year: Number(billingYear),
      });
      if (res.success) {
        setReadings(res.data?.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilityTypes();
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [billingMonth, billingYear]);

  const selectedLease = useMemo(
    () => leases.find((lease) => lease._id === selectedLeaseId) || null,
    [leases, selectedLeaseId],
  );

  const selectedUtilityType = useMemo(
    () => utilityTypes.find((type) => type._id === selectedUtilityTypeId) || null,
    [utilityTypes, selectedUtilityTypeId],
  );

  useEffect(() => {
    if (selectedUtilityType) {
      setForm(createEmptyForm(selectedUtilityType));
    }
  }, [selectedUtilityType]);

  const leaseMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => map.set(lease._id, lease));
    return map;
  }, [leases]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openLeaseRecorder = (leaseId) => {
    setSelectedLeaseId(leaseId);
  };

  const validateForm = () => {
    if (!selectedLease) {
      toast.error("Select a lease first.");
      return false;
    }

    if (!selectedUtilityType) {
      toast.error("Select a utility type.");
      return false;
    }

    const cfg = selectedUtilityType.inputConfig || {};

    if (cfg.hasPreviousValue && form.previousValue === "") {
      toast.error(`Previous value is required for ${selectedUtilityType.name}.`);
      return false;
    }
    if (cfg.hasCurrentValue && form.currentValue === "") {
      toast.error(`Current value is required for ${selectedUtilityType.name}.`);
      return false;
    }
    if (cfg.hasRatePerUnit && form.ratePerUnit === "") {
      toast.error(`Rate per unit is required for ${selectedUtilityType.name}.`);
      return false;
    }
    if (cfg.hasFixedMonthlyAmount && form.fixedAmount === "") {
      toast.error(`Fixed amount is required for ${selectedUtilityType.name}.`);
      return false;
    }
    if (cfg.hasPreviousDate && !form.previousDate) {
      toast.error(`Previous date is required for ${selectedUtilityType.name}.`);
      return false;
    }
    if (cfg.hasCurrentDate && !form.currentDate) {
      toast.error(`Current date is required for ${selectedUtilityType.name}.`);
      return false;
    }

    const duplicate = readings.find(
      (reading) =>
        String(typeof reading.leaseId === "object" ? reading.leaseId?._id || "" : reading.leaseId || "") ===
        String(selectedLeaseId) &&
        String(
          typeof reading.utilityTypeId === "object"
            ? reading.utilityTypeId?._id || ""
            : reading.utilityTypeId || "",
        ) === String(selectedUtilityType._id) &&
        Number(reading.billingPeriod?.month) === Number(billingMonth) &&
        Number(reading.billingPeriod?.year) === Number(billingYear),
    );

    if (duplicate) {
      toast.error(
        `${selectedUtilityType.name} is already recorded for this lease in ${billingYear}-${String(
          billingMonth,
        ).padStart(2, "0")}.`,
      );
      return false;
    }

    return true;
  };

  const saveReading = async () => {
    if (!validateForm()) return;

    const unitId = typeof selectedLease.unitId === "object" ? selectedLease.unitId?._id : selectedLease.unitId;
    const buildingId =
      typeof selectedLease.buildingId === "object"
        ? selectedLease.buildingId?._id
        : selectedLease.buildingId;
    const cfg = selectedUtilityType.inputConfig || {};

    const payload = {
      buildingId,
      unitId,
      leaseId: selectedLease._id,
      utilityTypeId: selectedUtilityType._id,
      previousValue: cfg.hasPreviousValue ? Number(form.previousValue) : undefined,
      currentValue: cfg.hasCurrentValue ? Number(form.currentValue) : undefined,
      previousDate: cfg.hasPreviousDate ? form.previousDate : undefined,
      currentDate: cfg.hasCurrentDate ? form.currentDate : undefined,
      ratePerUnit: cfg.hasRatePerUnit ? Number(form.ratePerUnit) : undefined,
      fixedAmount: cfg.hasFixedMonthlyAmount ? Number(form.fixedAmount) : undefined,
      taxRate: Number(form.taxRate || 0),
      billingMonth: Number(billingMonth),
      billingYear: Number(billingYear),
      notes: form.notes || undefined,
    };

    setSaving(true);
    try {
      const res = await FinanceAPI.createReading(payload);
      if (res.success) {
        toast.success("Utility record saved.");
        setForm(createEmptyForm(selectedUtilityType));
        fetchReadings();
      }
    } catch (_e) {
      // handled in helper
    } finally {
      setSaving(false);
    }
  };

  const leaseColumns = [
    {
      name: "Lease",
      grow: 2,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.leaseNumber || "-"}</div>
          <small className="text-muted">
            {row.buildingId?.name || "Building"} / {row.unitId?.unitNumber || "Unit"}
          </small>
        </div>
      ),
    },
    {
      name: "Tenant",
      grow: 2,
      cell: (row) =>
        row.tenantId?.personalInfo
          ? `${row.tenantId.personalInfo.firstName || ""} ${row.tenantId.personalInfo.lastName || ""}`.trim()
          : "-",
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={row._id === selectedLeaseId ? "primary" : "success"}>
          {row._id === selectedLeaseId ? "Selected" : row.status || "active"}
        </Badge>
      ),
    },
    {
      name: "Action",
      width: "180px",
      cell: (row) => (
        <Button color={row._id === selectedLeaseId ? "primary" : "outline-primary"} onClick={() => openLeaseRecorder(row._id)}>
          {row._id === selectedLeaseId ? "Recording" : "Record Utility"}
        </Button>
      ),
    },
  ];

  const readingColumns = [
    {
      name: "Lease",
      grow: 2,
      cell: (row) => {
        const lease = leaseMap.get(typeof row.leaseId === "object" ? row.leaseId?._id : row.leaseId);
        return lease ? `${lease.leaseNumber} (${lease.unitId?.unitNumber || "Unit"})` : "-";
      },
    },
    {
      name: "Type",
      cell: (row) => row.utilityTypeName || row.utilityType || "-",
    },
    {
      name: "Consumption",
      cell: (row) => Number(row.consumption || 0).toLocaleString(),
    },
    {
      name: "Amount",
      cell: (row) => `$${Number(row.totalAmount || 0).toLocaleString()}`,
    },
    {
      name: "Period",
      cell: (row) =>
        `${row.billingPeriod?.year || "-"}-${String(row.billingPeriod?.month || "").padStart(2, "0")}`,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge color={row.isBilled ? "success" : "warning"}>{row.isBilled ? "Billed" : "Unbilled"}</Badge>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Utility Bills" pageTitle="Finance" />

        <Card className="mb-4">
          <CardBody>
            <Row className="g-3">
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Billing Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Billing Year</Label>
                  <Input type="number" value={billingYear} onChange={(e) => setBillingYear(e.target.value)} />
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <Card className="mb-4">
          <CardHeader className="bg-light">
            <h5 className="card-title mb-0">Active Leases</h5>
          </CardHeader>
          <CardBody>
            <DataTable columns={leaseColumns} data={leases} responsive pagination />
          </CardBody>
        </Card>

        <Card className="mb-4">
          <CardHeader className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Record Utility</h5>
            {selectedLease ? (
              <Badge color="info">
                {selectedLease.leaseNumber} / {selectedLease.unitId?.unitNumber || "Unit"}
              </Badge>
            ) : null}
          </CardHeader>
          <CardBody>
            {!selectedLease ? (
              <div className="text-muted">Select any lease above, then click Record Utility.</div>
            ) : (
              <Row className="g-3">
                <Col md={6}>
                  <FormGroup>
                    <Label className="form-label">Utility Type</Label>
                    <Input
                      type="select"
                      value={selectedUtilityTypeId}
                      onChange={(e) => setSelectedUtilityTypeId(e.target.value)}
                    >
                      <option value="">Select utility type</option>
                      {utilityTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name} ({type.code})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label className="form-label">Tax %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.taxRate}
                      onChange={(e) => setField("taxRate", e.target.value)}
                    />
                  </FormGroup>
                </Col>

                {selectedUtilityType?.inputConfig?.hasPreviousValue && (
                  <Col md={4}>
                    <FormGroup>
                      <Label className="form-label">Previous Value</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.previousValue}
                        onChange={(e) => setField("previousValue", e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                )}
                {selectedUtilityType?.inputConfig?.hasCurrentValue && (
                  <Col md={4}>
                    <FormGroup>
                      <Label className="form-label">Current Value</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.currentValue}
                        onChange={(e) => setField("currentValue", e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                )}
                {selectedUtilityType?.inputConfig?.hasRatePerUnit && (
                  <Col md={4}>
                    <FormGroup>
                      <Label className="form-label">Rate Per Unit</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.ratePerUnit}
                        onChange={(e) => setField("ratePerUnit", e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                )}
                {selectedUtilityType?.inputConfig?.hasFixedMonthlyAmount && (
                  <Col md={4}>
                    <FormGroup>
                      <Label className="form-label">Fixed Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.fixedAmount}
                        onChange={(e) => setField("fixedAmount", e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                )}
                {selectedUtilityType?.inputConfig?.hasPreviousDate && (
                  <Col md={4}>
                    <FormGroup>
                      <Label className="form-label">Previous Date</Label>
                      <Input
                        type="date"
                        value={form.previousDate}
                        onChange={(e) => setField("previousDate", e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                )}
                {selectedUtilityType?.inputConfig?.hasCurrentDate && (
                  <Col md={4}>
                    <FormGroup>
                      <Label className="form-label">Current Date</Label>
                      <Input
                        type="date"
                        value={form.currentDate}
                        onChange={(e) => setField("currentDate", e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                )}
                <Col md={12}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Notes</Label>
                    <Input value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
                  </FormGroup>
                </Col>
                <Col xs={12}>
                  <div className="d-flex justify-content-end">
                    <Button color="primary" onClick={saveReading} disabled={saving || !selectedUtilityTypeId}>
                      {saving ? "Saving..." : "Save Utility Record"}
                    </Button>
                  </div>
                </Col>
              </Row>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="bg-light">
            <h5 className="card-title mb-0">Recorded Utility Bills</h5>
          </CardHeader>
          <CardBody>
            <DataTable columns={readingColumns} data={readings} progressPending={loading} responsive />
          </CardBody>
        </Card>
      </Container>
      <ToastContainer />
    </div>
  );
};

export default UtilityBills;
