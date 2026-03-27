import React, { useEffect, useMemo, useState } from "react";
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
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  UncontrolledTooltip,
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { FiEye, FiEdit2, FiPlus, FiTrash2, FiSave, FiX, FiChevronRight } from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { FinanceAPI, UtilityUsagesAPI } from "../../../helpers/backend_helper";
import { getLeases as onGetLeases } from "../../../slices/thunks";

const today = new Date();
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
}));
const yearOptions = Array.from({ length: 7 }, (_, i) => String(today.getFullYear() - 2 + i));

const getTenantName = (lease) =>
  `${lease?.tenantId?.personalInfo?.firstName || ""} ${lease?.tenantId?.personalInfo?.lastName || ""}`.trim() || "Unknown tenant";

const getTenantPhone = (lease) => lease?.tenantId?.contact?.primaryPhone || "No phone";

const getLeaseLabel = (lease) =>
  `${lease?.unitId?.unitNumber || "Unit"} - ${getTenantName(lease)}`;

const getUnitLabel = (lease) => lease?.unitId?.unitNumber || "Unit";
const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: "#e2e8f0",
  }),
};

const createDraftRow = (overrides = {}) => ({
  localId: overrides.localId || `${Date.now()}-${Math.random()}`,
  readingId: overrides.readingId || "",
  utilityTypeId: overrides.utilityTypeId || "",
  previousValue: overrides.previousValue ?? "",
  currentValue: overrides.currentValue ?? "",
  ratePerUnit: overrides.ratePerUnit ?? "",
  fixedAmount: overrides.fixedAmount ?? "",
  taxRate: overrides.taxRate ?? "0",
  previousDate: overrides.previousDate || new Date().toISOString().split("T")[0],
  currentDate: overrides.currentDate || new Date().toISOString().split("T")[0],
  notes: overrides.notes || "",
});

// Utility Card Component for View Mode
const UtilityDetailCard = ({ utility, type, onClose }) => {
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="border rounded-3 p-4 mb-3 bg-white shadow-sm">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h5 className="mb-1">{type?.name || utility.utilityTypeName}</h5>
          <Badge color="light" className="text-muted">
            {type?.code || utility.utilityType}
          </Badge>
        </div>
        {/* <Button color="light" size="sm" onClick={onClose} className="rounded-circle p-2">
          <FiX size={18} />
        </Button> */}
      </div>

      <Row className="g-4">
        <Col md={6}>
          <div className="bg-light rounded-3 p-3">
            <h6 className="text-muted mb-3">Readings</h6>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Previous:</span>
              <span className="fw-semibold">{utility.readings?.previous?.value ?? "N/A"}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Current:</span>
              <span className="fw-semibold">{utility.readings?.current?.value ?? "N/A"}</span>
            </div>
            {utility.consumption !== undefined && (
              <div className="d-flex justify-content-between pt-2 mt-2 border-top">
                <span className="text-muted">Consumption:</span>
                <span className="fw-bold text-primary">{utility.consumption} units</span>
              </div>
            )}
          </div>
        </Col>

        <Col md={6}>
          <div className="bg-light rounded-3 p-3">
            <h6 className="text-muted mb-3">Amount Details</h6>
            {utility.ratePerUnit > 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Rate per Unit:</span>
                <span>{formatCurrency(utility.ratePerUnit)}</span>
              </div>
            )}
            {utility.fixedAmount > 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Fixed Amount:</span>
                <span>{formatCurrency(utility.fixedAmount)}</span>
              </div>
            )}
            {utility.taxAmount > 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tax ({utility.taxRate}%):</span>
                <span>{formatCurrency(utility.taxAmount)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between pt-2 mt-2 border-top">
              <span className="text-muted fw-semibold">Total Amount:</span>
              <span className="fw-bold text-success">{formatCurrency(utility.totalAmount)}</span>
            </div>
          </div>
        </Col>

        {utility.readings?.current?.date && (
          <Col md={12}>
            <div className="bg-light rounded-3 p-3">
              <h6 className="text-muted mb-3">Additional Information</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Reading Date:</span>
                <span>{formatDate(utility.readings.current.date)}</span>
              </div>
              {utility.readings.current.readingBy && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Reading By:</span>
                  <span>{utility.readings.current.readingBy}</span>
                </div>
              )}
              {utility.readings.current.notes && (
                <div className="mt-2 pt-2 border-top">
                  <span className="text-muted d-block mb-1">Notes:</span>
                  <p className="mb-0 text-dark">{utility.readings.current.notes}</p>
                </div>
              )}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

const UtilityBills = () => {
  document.title = "Finance - Utility Bills | Apartment Management";

  const dispatch = useDispatch();
  const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
  const leases = useSelector(leaseSelector);

  const [readings, setReadings] = useState([]);
  const [utilityTypes, setUtilityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [billingMonth, setBillingMonth] = useState(String(today.getMonth() + 1));
  const [billingYear, setBillingYear] = useState(String(today.getFullYear()));
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const [draftRows, setDraftRows] = useState([createDraftRow()]);
  const [selectedUtilityGroup, setSelectedUtilityGroup] = useState(null);

  useEffect(() => {
    dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
  }, [dispatch]);

  useEffect(() => {
    const loadUtilityTypes = async () => {
      try {
        const res = await UtilityUsagesAPI.list({ page: 1, limit: 100, isActive: true });
        if (res.success) {
          setUtilityTypes(res.data?.data || []);
        }
      } catch (_error) {
        setUtilityTypes([]);
      }
    };

    loadUtilityTypes();
  }, []);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await FinanceAPI.listReadings({
        page: 1,
        limit: 300,
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
    fetchReadings();
  }, [billingMonth, billingYear]);

  const leaseMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => map.set(lease._id, lease));
    return map;
  }, [leases]);

  const utilityTypeMap = useMemo(() => {
    const map = new Map();
    utilityTypes.forEach((type) => map.set(String(type._id), type));
    return map;
  }, [utilityTypes]);

  const selectedLease = useMemo(() => leaseMap.get(selectedLeaseId) || null, [leaseMap, selectedLeaseId]);
  const yearSelectOptions = useMemo(() => yearOptions.map((item) => ({ value: item, label: item })), []);
  const leaseOptions = useMemo(
    () =>
      leases.map((lease) => ({
        value: lease._id,
        label: getLeaseLabel(lease),
      })),
    [leases],
  );

  const groupedRows = useMemo(() => {
    const groups = new Map();

    readings.forEach((reading) => {
      const leaseId = String(typeof reading.leaseId === "object" ? reading.leaseId?._id : reading.leaseId);
      const existing = groups.get(leaseId) || {
        leaseId,
        readings: [],
      };
      existing.readings.push(reading);
      groups.set(leaseId, existing);
    });

    return Array.from(groups.values()).map((group) => {
      const lease = leaseMap.get(group.leaseId);
      const utilityNames = group.readings.map((reading) => reading.utilityTypeName || reading.utilityType || "-");
      const totalAmount = group.readings.reduce((sum, reading) => sum + Number(reading.totalAmount || 0), 0);
      const billedCount = group.readings.filter((reading) => reading.isBilled).length;

      return {
        ...group,
        lease,
        leaseLabel: lease ? getLeaseLabel(lease) : "-",
        unitNumber: lease ? getUnitLabel(lease) : "-",
        utilityNames,
        utilityCount: group.readings.length,
        totalAmount,
        billedCount,
      };
    });
  }, [leaseMap, readings]);

  const recordedUtilityTypeIdsForLease = useMemo(() => {
    if (!selectedLeaseId) return [];
    return readings
      .filter((reading) => {
        const leaseId = String(typeof reading.leaseId === "object" ? reading.leaseId?._id : reading.leaseId);
        return leaseId === String(selectedLeaseId);
      })
      .map((reading) => String(typeof reading.utilityTypeId === "object" ? reading.utilityTypeId?._id : reading.utilityTypeId));
  }, [readings, selectedLeaseId]);

  const getConfiguredRow = (row, type) => ({
    ...row,
    utilityTypeId: type?._id || row.utilityTypeId,
    ratePerUnit:
      row.ratePerUnit !== "" && row.ratePerUnit !== undefined
        ? row.ratePerUnit
        : String(type?.defaults?.ratePerUnit ?? ""),
    fixedAmount:
      row.fixedAmount !== "" && row.fixedAmount !== undefined
        ? row.fixedAmount
        : String(type?.defaults?.fixedMonthlyAmount ?? ""),
    taxRate:
      row.taxRate !== "" && row.taxRate !== undefined ? row.taxRate : String(type?.defaults?.taxRate ?? 0),
  });

  const getAvailableUtilityTypes = (currentRowId) => {
    const selectedInDraft = draftRows
      .filter((row) => row.localId !== currentRowId)
      .map((row) => String(row.utilityTypeId))
      .filter(Boolean);

    const selectedInCurrentDraft = draftRows.map((row) => String(row.utilityTypeId)).filter(Boolean);

    return utilityTypes.filter((type) => {
      if (selectedInDraft.includes(String(type._id))) return false;
      if (modalMode === "create" && recordedUtilityTypeIdsForLease.includes(String(type._id))) return false;
      if (modalMode === "edit" && recordedUtilityTypeIdsForLease.includes(String(type._id)) && !selectedInCurrentDraft.includes(String(type._id))) {
        return false;
      }
      return true;
    });
  };

  const resetModal = () => {
    setSelectedLeaseId("");
    setDraftRows([createDraftRow()]);
    setModalMode("create");
  };

  const openCreateModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const openEditModal = (group) => {
    setModalMode("edit");
    setSelectedLeaseId(group.leaseId);
    setDraftRows(
      group.readings.map((reading) => {
        const utilityTypeId =
          typeof reading.utilityTypeId === "object" ? reading.utilityTypeId?._id : reading.utilityTypeId;
        const type = utilityTypeMap.get(String(utilityTypeId));
        return getConfiguredRow(
          createDraftRow({
            localId: reading._id,
            readingId: reading._id,
            utilityTypeId: utilityTypeId || "",
            previousValue: reading.readings?.previous?.value ?? "",
            currentValue: reading.readings?.current?.value ?? "",
            ratePerUnit: String(reading.ratePerUnit ?? ""),
            fixedAmount: String(reading.fixedAmount ?? ""),
            taxRate: String(reading.taxRate ?? 0),
            previousDate: reading.readings?.previous?.date?.split?.("T")?.[0] || new Date().toISOString().split("T")[0],
            currentDate: reading.readings?.current?.date?.split?.("T")?.[0] || new Date().toISOString().split("T")[0],
            notes: reading.readings?.current?.notes || "",
          }),
          type,
        );
      }),
    );
    setModalOpen(true);
  };

  const openViewModal = (group) => {
    setSelectedUtilityGroup(group);
    setViewModalOpen(true);
  };

  const updateDraftRow = (localId, field, value) => {
    setDraftRows((prev) =>
      prev.map((row) => {
        if (row.localId !== localId) return row;
        if (field === "utilityTypeId") {
          const type = utilityTypeMap.get(String(value));
          return getConfiguredRow({ ...row, utilityTypeId: value }, type);
        }
        return { ...row, [field]: value };
      }),
    );
  };

  const addDraftRow = () => {
    if (!selectedLeaseId) {
      toast.error("Select a lease first.");
      return;
    }

    const availableTypes = getAvailableUtilityTypes();
    if (!availableTypes.length) {
      toast.error("No remaining utility types for this lease in this period.");
      return;
    }

    setDraftRows((prev) => [...prev, createDraftRow()]);
  };

  const removeDraftRow = (localId) => {
    setDraftRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.localId !== localId)));
  };

  const validateRow = (row, type, rowLabel) => {
    if (!type) {
      toast.error(`${rowLabel}: utility type is required.`);
      return false;
    }
    const cfg = type.inputConfig || {};
    if (cfg.hasPreviousValue && row.previousValue === "") return toast.error(`${rowLabel}: previous value is required.`), false;
    if (cfg.hasCurrentValue && row.currentValue === "") return toast.error(`${rowLabel}: current value is required.`), false;
    if (cfg.hasPreviousDate && !row.previousDate) return toast.error(`${rowLabel}: previous date is required.`), false;
    if (cfg.hasCurrentDate && !row.currentDate) return toast.error(`${rowLabel}: current date is required.`), false;
    if (cfg.hasRatePerUnit && row.ratePerUnit === "") return toast.error(`${rowLabel}: rate per unit is required.`), false;
    if (cfg.hasFixedMonthlyAmount && row.fixedAmount === "") return toast.error(`${rowLabel}: fixed amount is required.`), false;
    return true;
  };

  const buildPayload = (lease, row, type) => ({
    buildingId: typeof lease.buildingId === "object" ? lease.buildingId?._id : lease.buildingId,
    unitId: typeof lease.unitId === "object" ? lease.unitId?._id : lease.unitId,
    leaseId: lease._id,
    utilityTypeId: row.utilityTypeId,
    previousValue: type?.inputConfig?.hasPreviousValue ? Number(row.previousValue) : undefined,
    currentValue: type?.inputConfig?.hasCurrentValue ? Number(row.currentValue) : undefined,
    previousDate: type?.inputConfig?.hasPreviousDate ? row.previousDate : undefined,
    currentDate: type?.inputConfig?.hasCurrentDate ? row.currentDate : undefined,
    ratePerUnit: type?.inputConfig?.hasRatePerUnit ? Number(row.ratePerUnit) : undefined,
    fixedAmount: type?.inputConfig?.hasFixedMonthlyAmount ? Number(row.fixedAmount) : undefined,
    taxRate: Number(row.taxRate || 0),
    billingMonth: Number(billingMonth),
    billingYear: Number(billingYear),
    notes: row.notes || undefined,
  });

  const saveReadings = async () => {
    const lease = leaseMap.get(selectedLeaseId);
    if (!lease) {
      toast.error("Lease is required.");
      return;
    }

    const selectedTypeIds = draftRows.map((row) => String(row.utilityTypeId)).filter(Boolean);
    if (!selectedTypeIds.length) {
      toast.error("At least one utility type is required.");
      return;
    }
    if (new Set(selectedTypeIds).size !== selectedTypeIds.length) {
      toast.error("Each utility type can only appear once in the bulk editor.");
      return;
    }

    const createPayload = [];
    const updatePayload = [];

    for (let index = 0; index < draftRows.length; index += 1) {
      const row = draftRows[index];
      const type = utilityTypeMap.get(String(row.utilityTypeId));
      if (!validateRow(row, type, `Row ${index + 1}`)) return;
      const payload = buildPayload(lease, row, type);
      if (row.readingId) {
        updatePayload.push({ id: row.readingId, payload });
      } else {
        createPayload.push(payload);
      }
    }

    setSaving(true);
    try {
      if (updatePayload.length) {
        await Promise.all(updatePayload.map((item) => FinanceAPI.updateReading(item.id, item.payload)));
      }
      if (createPayload.length) {
        await FinanceAPI.createReadingsBulk({ readings: createPayload });
      }

      toast.success(modalMode === "edit" ? "Lease utility bundle updated." : "Utility bills recorded.");
      setModalOpen(false);
      resetModal();
      fetchReadings();
    } finally {
      setSaving(false);
    }
  };

  const renderUtilityFields = (row, index) => {
    const type = utilityTypeMap.get(String(row.utilityTypeId));
    const rateLocked = type?.defaults?.ratePerUnit !== undefined && type?.defaults?.ratePerUnit !== null;
    const fixedLocked =
      type?.defaults?.fixedMonthlyAmount !== undefined && type?.defaults?.fixedMonthlyAmount !== null;

    const availableTypes = getAvailableUtilityTypes(row.localId);
    const rowTypeIncluded =
      type && !availableTypes.find((item) => String(item._id) === String(type._id)) ? [type, ...availableTypes] : availableTypes;
    const utilityTypeOptions = rowTypeIncluded.map((item) => ({
      value: item._id,
      label: `${item.name} (${item.code})`,
    }));

    return (
      <div className="border rounded-3 p-3 mb-3 bg-white" key={row.localId}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">
            <FiChevronRight className="me-2 text-primary" />
            Utility {index + 1}
          </h6>
          <Button color="light" size="sm" onClick={() => removeDraftRow(row.localId)} className="text-danger">
            <FiTrash2 size={14} className="me-1" /> Remove
          </Button>
        </div>
        <Row className="g-3">
          <Col md={3}>
            <FormGroup>
              <Label className="form-label text-muted small mb-1">Utility Type</Label>
              <Select
                options={utilityTypeOptions}
                value={utilityTypeOptions.find((item) => item.value === row.utilityTypeId) || null}
                onChange={(option) => updateDraftRow(row.localId, "utilityTypeId", option?.value || "")}
                placeholder="Select utility type"
                classNamePrefix="select"
                styles={selectStyles}
              />
            </FormGroup>
          </Col>
          <Col md={3} style={{ display: "none" }}>
            <FormGroup>
              <Label className="form-label text-muted small mb-1">Tax %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={row.taxRate}
                onChange={(e) => updateDraftRow(row.localId, "taxRate", e.target.value)}
                className="form-control"
              />
            </FormGroup>
          </Col>

          {type?.inputConfig?.hasPreviousValue && (
            <Col md={3}>
              <FormGroup>
                <Label className="form-label text-muted small mb-1">Previous Value</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.previousValue}
                  onChange={(e) => updateDraftRow(row.localId, "previousValue", e.target.value)}
                  className="form-control"
                />
              </FormGroup>
            </Col>
          )}
          {type?.inputConfig?.hasCurrentValue && (
            <Col md={3}>
              <FormGroup>
                <Label className="form-label text-muted small mb-1">Current Value</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.currentValue}
                  onChange={(e) => updateDraftRow(row.localId, "currentValue", e.target.value)}
                  className="form-control"
                />
              </FormGroup>
            </Col>
          )}
          {type?.inputConfig?.hasRatePerUnit && (
            <Col md={3}>
              <FormGroup>
                <Label className="form-label text-muted small mb-1">Rate Per Unit</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.ratePerUnit}
                  readOnly={rateLocked}
                  disabled={rateLocked}
                  onChange={(e) => updateDraftRow(row.localId, "ratePerUnit", e.target.value)}
                  className="form-control"
                />
              </FormGroup>
            </Col>
          )}
          {type?.inputConfig?.hasFixedMonthlyAmount && (
            <Col md={3}>
              <FormGroup>
                <Label className="form-label text-muted small mb-1">Fixed Amount</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.fixedAmount}
                  readOnly={fixedLocked}
                  disabled={fixedLocked}
                  onChange={(e) => updateDraftRow(row.localId, "fixedAmount", e.target.value)}
                  className="form-control"
                />
              </FormGroup>
            </Col>
          )}
          {type?.inputConfig?.hasPreviousDate && (
            <Col md={3}>
              <FormGroup>
                <Label className="form-label text-muted small mb-1">Previous Date</Label>
                <Input
                  type="date"
                  value={row.previousDate}
                  onChange={(e) => updateDraftRow(row.localId, "previousDate", e.target.value)}
                  className="form-control"
                />
              </FormGroup>
            </Col>
          )}
          {type?.inputConfig?.hasCurrentDate && (
            <Col md={3}>
              <FormGroup>
                <Label className="form-label text-muted small mb-1">Current Date</Label>
                <Input
                  type="date"
                  value={row.currentDate}
                  onChange={(e) => updateDraftRow(row.localId, "currentDate", e.target.value)}
                  className="form-control"
                />
              </FormGroup>
            </Col>
          )}
          <Col md={6}>
            <FormGroup className="mb-0">
              <Label className="form-label text-muted small mb-1">Notes</Label>
              <Input
                type="textarea"
                rows="1"
                value={row.notes}
                onChange={(e) => updateDraftRow(row.localId, "notes", e.target.value)}
                className="form-control"
              />
            </FormGroup>
          </Col>
        </Row>
      </div>
    );
  };

  const remainingUtilityCount = selectedLeaseId
    ? utilityTypes.length - new Set(draftRows.map((row) => row.utilityTypeId).filter(Boolean)).size
    : utilityTypes.length;

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
    },
    {
      name: "Unit",
      selector: (row) => row.unitNumber,
      sortable: true,
      cell: (row) => <span className="fw-semibold">{row.unitNumber}</span>,
    },
    {
      name: "Tenant",
      selector: (row) => row.leaseLabel,
      sortable: true,
      grow: 2,
    },
    {
      name: "Utilities",
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.utilityNames.slice(0, 2).map((name, idx) => (
            <Badge key={idx} color="light" className="text-dark">
              {name}
            </Badge>
          ))}
          {row.utilityCount > 2 && (
            <Badge color="light" className="text-muted">
              +{row.utilityCount - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      name: "Total",
      selector: (row) => row.totalAmount,
      sortable: true,
      cell: (row) => <span className="fw-bold text-success">${Number(row.totalAmount || 0).toLocaleString()}</span>,
    },
    {
      name: "Status",
      cell: (row) => (
        <Badge
          color={row.billedCount === row.utilityCount ? "success" : row.billedCount > 0 ? "info" : "warning"}
          className="px-3 py-1"
        >
          {row.billedCount === row.utilityCount ? "Billed" : row.billedCount > 0 ? "Partial" : "Recorded"}
        </Badge>
      ),
    },
    {
      name: "Actions",
      width: "100px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            color="light"
            onClick={() => openViewModal(row)}
            id={`view-${row.leaseId}`}
            className="rounded-circle p-2"
          >
            <FiEye size={16} />
          </Button>
          <UncontrolledTooltip target={`view-${row.leaseId}`}>View Details</UncontrolledTooltip>

          <Button
            size="sm"
            color="light"
            onClick={() => openEditModal(row)}
            id={`edit-${row.leaseId}`}
            className="rounded-circle p-2"
          >
            <FiEdit2 size={16} />
          </Button>
          <UncontrolledTooltip target={`edit-${row.leaseId}`}>Edit</UncontrolledTooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Utility Bills" pageTitle="Finance" />

        {/* Header Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="align-items-end">
              <Col md={8}>
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                    <FiPlus size={24} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1">Utility Billing</h4>
                    <p className="text-muted mb-0">Record and manage utility readings for your properties</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <Button
                  color="primary"
                  onClick={openCreateModal}
                  className="w-100 py-2"
                >
                  <FiPlus className="me-2" size={18} />
                  Record New Bill
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Filters Card */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Billing Month</Label>
                <Select
                  options={monthOptions}
                  value={monthOptions.find((month) => month.value === billingMonth) || null}
                  onChange={(option) => setBillingMonth(option?.value || String(today.getMonth() + 1))}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
              <Col md={6}>
                <Label className="form-label text-muted small mb-1">Billing Year</Label>
                <Select
                  options={yearSelectOptions}
                  value={yearSelectOptions.find((year) => year.value === billingYear) || null}
                  onChange={(option) => setBillingYear(option?.value || String(today.getFullYear()))}
                  classNamePrefix="select"
                  styles={selectStyles}
                />
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Data Table Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-white border-0 pt-4 px-4">
            <h5 className="card-title mb-0">Recorded Utility Bills</h5>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              data={groupedRows}
              progressPending={loading}
              responsive
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              pointerOnHover
              className="border-0"
              customStyles={{
                headRow: {
                  style: {
                    backgroundColor: '#f8f9fa',
                    borderTop: 'none',
                  },
                },
                rows: {
                  style: {
                    minHeight: '72px',
                  },
                },
              }}
            />
          </CardBody>
        </Card>
      </Container>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="xl" centered className="modal-dialog-scrollable">
        <ModalHeader toggle={() => setModalOpen(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">{modalMode === "edit" ? "Edit Utility Bundle" : "Record Utility Bills"}</h5>
            <small className="text-muted">
              {modalMode === "edit" ? "Update readings for existing utilities" : "Add new utility readings for a lease"}
            </small>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Label className="form-label text-muted small mb-1">Billing Period</Label>
              <div className="bg-light rounded-3 p-2 px-3">
                <span className="fw-semibold">
                  {monthOptions.find(m => m.value === billingMonth)?.label} {billingYear}
                </span>
              </div>
            </Col>
            <Col md={8}>
              <Label className="form-label text-muted small mb-1">Lease</Label>
              <Select
                options={leaseOptions}
                value={leaseOptions.find((lease) => lease.value === selectedLeaseId) || null}
                onChange={(option) => setSelectedLeaseId(option?.value || "")}
                placeholder="Select lease"
                isDisabled={modalMode === "edit"}
                classNamePrefix="select"
                styles={selectStyles}
              />
            </Col>
          </Row>

          {selectedLease && (
            <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-4">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-25 rounded-circle p-2 me-3">
                  <FiChevronRight size={20} className="text-primary" />
                </div>
                <div>
                  <div className="fw-semibold">{getLeaseLabel(selectedLease)}</div>
                  <small className="text-muted">
                    {modalMode === "edit"
                      ? "Edit the readings below for this lease"
                      : `Remaining utility types: ${Math.max(remainingUtilityCount, 0)}`}
                  </small>
                </div>
              </div>
            </div>
          )}

          {draftRows.map((row, index) => renderUtilityFields(row, index))}

          {selectedLeaseId && (
            <Button
              color="light"
              onClick={addDraftRow}
              className="mt-2"
            >
              <FiPlus className="me-2" size={16} />
              Add Utility Type
            </Button>
          )}
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <Button color="light" onClick={() => setModalOpen(false)}>
            <FiX className="me-1" size={16} /> Cancel
          </Button>
          <Button color="primary" onClick={saveReadings} disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <>
                <FiSave className="me-1" size={16} />
                {modalMode === "edit" ? "Update Bundle" : "Save All"}
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(false)} size="xl" centered>
        <ModalHeader toggle={() => setViewModalOpen(false)} className="bg-light border-0">
          <div>
            <h5 className="mb-0">Utility Details</h5>
            <small className="text-muted">
              {selectedUtilityGroup?.unitNumber} - {selectedUtilityGroup?.leaseLabel}
            </small>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          {selectedUtilityGroup?.readings.map((utility, index) => {
            const type = utilityTypeMap.get(String(
              typeof utility.utilityTypeId === "object" ? utility.utilityTypeId?._id : utility.utilityTypeId
            ));
            return (
              <UtilityDetailCard
                key={utility._id || index}
                utility={utility}
                type={type}
              // onClose={() => { }}
              />
            );
          })}
        </ModalBody>
        <ModalFooter className="bg-light border-0">
          <Button color="light" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UtilityBills;
// import React, { useEffect, useMemo, useState } from "react";
// import DataTable from "react-data-table-component";
// import {
//   Badge,
//   Button,
//   Card,
//   CardBody,
//   CardHeader,
//   Col,
//   Container,
//   FormGroup,
//   Input,
//   Label,
//   Modal,
//   ModalBody,
//   ModalFooter,
//   ModalHeader,
//   Row,
// } from "reactstrap";
// import { createSelector } from "reselect";
// import { useDispatch, useSelector } from "react-redux";
// import { toast, ToastContainer } from "react-toastify";
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import { FinanceAPI, UtilityUsagesAPI } from "../../../helpers/backend_helper";
// import { getLeases as onGetLeases } from "../../../slices/thunks";

// const today = new Date();
// const monthOptions = Array.from({ length: 12 }, (_, i) => ({
//   value: String(i + 1),
//   label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
// }));
// const yearOptions = Array.from({ length: 7 }, (_, i) => String(today.getFullYear() - 2 + i));

// const getTenantName = (lease) =>
//   `${lease?.tenantId?.personalInfo?.firstName || ""} ${lease?.tenantId?.personalInfo?.lastName || ""}`.trim() || "Unknown tenant";

// const getTenantPhone = (lease) => lease?.tenantId?.contact?.primaryPhone || "No phone";

// const getLeaseLabel = (lease) =>
//   `${lease?.unitId?.unitNumber || "Unit"} - ${getTenantName(lease)} (${getTenantPhone(lease)})`;

// const createDraftRow = (overrides = {}) => ({
//   localId: overrides.localId || `${Date.now()}-${Math.random()}`,
//   readingId: overrides.readingId || "",
//   utilityTypeId: overrides.utilityTypeId || "",
//   previousValue: overrides.previousValue ?? "",
//   currentValue: overrides.currentValue ?? "",
//   ratePerUnit: overrides.ratePerUnit ?? "",
//   fixedAmount: overrides.fixedAmount ?? "",
//   taxRate: overrides.taxRate ?? "0",
//   previousDate: overrides.previousDate || new Date().toISOString().split("T")[0],
//   currentDate: overrides.currentDate || new Date().toISOString().split("T")[0],
//   notes: overrides.notes || "",
// });

// const UtilityBills = () => {
//   document.title = "Finance - Utility Bills | Apartment Management";

//   const dispatch = useDispatch();
//   const leaseSelector = createSelector((state) => state.Leases, (s) => s.leases || []);
//   const leases = useSelector(leaseSelector);

//   const [readings, setReadings] = useState([]);
//   const [utilityTypes, setUtilityTypes] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState("create");
//   const [billingMonth, setBillingMonth] = useState(String(today.getMonth() + 1));
//   const [billingYear, setBillingYear] = useState(String(today.getFullYear()));
//   const [selectedLeaseId, setSelectedLeaseId] = useState("");
//   const [draftRows, setDraftRows] = useState([createDraftRow()]);

//   useEffect(() => {
//     dispatch(onGetLeases({ params: { page: 1, limit: 100, status: "active" } }));
//   }, [dispatch]);

//   useEffect(() => {
//     const loadUtilityTypes = async () => {
//       try {
//         const res = await UtilityUsagesAPI.list({ page: 1, limit: 100, isActive: true });
//         if (res.success) {
//           setUtilityTypes(res.data?.data || []);
//         }
//       } catch (_error) {
//         setUtilityTypes([]);
//       }
//     };

//     loadUtilityTypes();
//   }, []);

//   const fetchReadings = async () => {
//     setLoading(true);
//     try {
//       const res = await FinanceAPI.listReadings({
//         page: 1,
//         limit: 300,
//         month: Number(billingMonth),
//         year: Number(billingYear),
//       });
//       if (res.success) {
//         setReadings(res.data?.data || []);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchReadings();
//   }, [billingMonth, billingYear]);

//   const leaseMap = useMemo(() => {
//     const map = new Map();
//     leases.forEach((lease) => map.set(lease._id, lease));
//     return map;
//   }, [leases]);

//   const utilityTypeMap = useMemo(() => {
//     const map = new Map();
//     utilityTypes.forEach((type) => map.set(String(type._id), type));
//     return map;
//   }, [utilityTypes]);

//   const selectedLease = useMemo(() => leaseMap.get(selectedLeaseId) || null, [leaseMap, selectedLeaseId]);

//   const groupedRows = useMemo(() => {
//     const groups = new Map();

//     readings.forEach((reading) => {
//       const leaseId = String(typeof reading.leaseId === "object" ? reading.leaseId?._id : reading.leaseId);
//       const existing = groups.get(leaseId) || {
//         leaseId,
//         readings: [],
//       };
//       existing.readings.push(reading);
//       groups.set(leaseId, existing);
//     });

//     return Array.from(groups.values()).map((group) => {
//       const lease = leaseMap.get(group.leaseId);
//       const utilityNames = group.readings.map((reading) => reading.utilityTypeName || reading.utilityType || "-");
//       const totalAmount = group.readings.reduce((sum, reading) => sum + Number(reading.totalAmount || 0), 0);
//       const billedCount = group.readings.filter((reading) => reading.isBilled).length;

//       return {
//         ...group,
//         lease,
//         leaseLabel: lease ? getLeaseLabel(lease) : "-",
//         utilityNames,
//         utilityCount: group.readings.length,
//         totalAmount,
//         billedCount,
//       };
//     });
//   }, [leaseMap, readings]);

//   const recordedUtilityTypeIdsForLease = useMemo(() => {
//     if (!selectedLeaseId) return [];
//     return readings
//       .filter((reading) => {
//         const leaseId = String(typeof reading.leaseId === "object" ? reading.leaseId?._id : reading.leaseId);
//         return leaseId === String(selectedLeaseId);
//       })
//       .map((reading) => String(typeof reading.utilityTypeId === "object" ? reading.utilityTypeId?._id : reading.utilityTypeId));
//   }, [readings, selectedLeaseId]);

//   const getConfiguredRow = (row, type) => ({
//     ...row,
//     utilityTypeId: type?._id || row.utilityTypeId,
//     ratePerUnit:
//       row.ratePerUnit !== "" && row.ratePerUnit !== undefined
//         ? row.ratePerUnit
//         : String(type?.defaults?.ratePerUnit ?? ""),
//     fixedAmount:
//       row.fixedAmount !== "" && row.fixedAmount !== undefined
//         ? row.fixedAmount
//         : String(type?.defaults?.fixedMonthlyAmount ?? ""),
//     taxRate:
//       row.taxRate !== "" && row.taxRate !== undefined ? row.taxRate : String(type?.defaults?.taxRate ?? 0),
//   });

//   const getAvailableUtilityTypes = (currentRowId) => {
//     const selectedInDraft = draftRows
//       .filter((row) => row.localId !== currentRowId)
//       .map((row) => String(row.utilityTypeId))
//       .filter(Boolean);

//     const selectedInCurrentDraft = draftRows.map((row) => String(row.utilityTypeId)).filter(Boolean);

//     return utilityTypes.filter((type) => {
//       if (selectedInDraft.includes(String(type._id))) return false;
//       if (modalMode === "create" && recordedUtilityTypeIdsForLease.includes(String(type._id))) return false;
//       if (modalMode === "edit" && recordedUtilityTypeIdsForLease.includes(String(type._id)) && !selectedInCurrentDraft.includes(String(type._id))) {
//         return false;
//       }
//       return true;
//     });
//   };

//   const resetModal = () => {
//     setSelectedLeaseId("");
//     setDraftRows([createDraftRow()]);
//     setModalMode("create");
//   };

//   const openCreateModal = () => {
//     resetModal();
//     setModalOpen(true);
//   };

//   const openEditModal = (group) => {
//     setModalMode("edit");
//     setSelectedLeaseId(group.leaseId);
//     setDraftRows(
//       group.readings.map((reading) => {
//         const utilityTypeId =
//           typeof reading.utilityTypeId === "object" ? reading.utilityTypeId?._id : reading.utilityTypeId;
//         const type = utilityTypeMap.get(String(utilityTypeId));
//         return getConfiguredRow(
//           createDraftRow({
//             localId: reading._id,
//             readingId: reading._id,
//             utilityTypeId: utilityTypeId || "",
//             previousValue: reading.readings?.previous?.value ?? "",
//             currentValue: reading.readings?.current?.value ?? "",
//             ratePerUnit: String(reading.ratePerUnit ?? ""),
//             fixedAmount: String(reading.fixedAmount ?? ""),
//             taxRate: String(reading.taxRate ?? 0),
//             previousDate: reading.readings?.previous?.date?.split?.("T")?.[0] || new Date().toISOString().split("T")[0],
//             currentDate: reading.readings?.current?.date?.split?.("T")?.[0] || new Date().toISOString().split("T")[0],
//             notes: reading.readings?.current?.notes || "",
//           }),
//           type,
//         );
//       }),
//     );
//     setModalOpen(true);
//   };

//   const updateDraftRow = (localId, field, value) => {
//     setDraftRows((prev) =>
//       prev.map((row) => {
//         if (row.localId !== localId) return row;
//         if (field === "utilityTypeId") {
//           const type = utilityTypeMap.get(String(value));
//           return getConfiguredRow({ ...row, utilityTypeId: value }, type);
//         }
//         return { ...row, [field]: value };
//       }),
//     );
//   };

//   const addDraftRow = () => {
//     if (!selectedLeaseId) {
//       toast.error("Select a lease first.");
//       return;
//     }

//     const availableTypes = getAvailableUtilityTypes();
//     if (!availableTypes.length) {
//       toast.error("No remaining utility types for this lease in this period.");
//       return;
//     }

//     setDraftRows((prev) => [...prev, createDraftRow()]);
//   };

//   const removeDraftRow = (localId) => {
//     setDraftRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.localId !== localId)));
//   };

//   const validateRow = (row, type, rowLabel) => {
//     if (!type) {
//       toast.error(`${rowLabel}: utility type is required.`);
//       return false;
//     }
//     const cfg = type.inputConfig || {};
//     if (cfg.hasPreviousValue && row.previousValue === "") return toast.error(`${rowLabel}: previous value is required.`), false;
//     if (cfg.hasCurrentValue && row.currentValue === "") return toast.error(`${rowLabel}: current value is required.`), false;
//     if (cfg.hasPreviousDate && !row.previousDate) return toast.error(`${rowLabel}: previous date is required.`), false;
//     if (cfg.hasCurrentDate && !row.currentDate) return toast.error(`${rowLabel}: current date is required.`), false;
//     if (cfg.hasRatePerUnit && row.ratePerUnit === "") return toast.error(`${rowLabel}: rate per unit is required.`), false;
//     if (cfg.hasFixedMonthlyAmount && row.fixedAmount === "") return toast.error(`${rowLabel}: fixed amount is required.`), false;
//     return true;
//   };

//   const buildPayload = (lease, row, type) => ({
//     buildingId: typeof lease.buildingId === "object" ? lease.buildingId?._id : lease.buildingId,
//     unitId: typeof lease.unitId === "object" ? lease.unitId?._id : lease.unitId,
//     leaseId: lease._id,
//     utilityTypeId: row.utilityTypeId,
//     previousValue: type?.inputConfig?.hasPreviousValue ? Number(row.previousValue) : undefined,
//     currentValue: type?.inputConfig?.hasCurrentValue ? Number(row.currentValue) : undefined,
//     previousDate: type?.inputConfig?.hasPreviousDate ? row.previousDate : undefined,
//     currentDate: type?.inputConfig?.hasCurrentDate ? row.currentDate : undefined,
//     ratePerUnit: type?.inputConfig?.hasRatePerUnit ? Number(row.ratePerUnit) : undefined,
//     fixedAmount: type?.inputConfig?.hasFixedMonthlyAmount ? Number(row.fixedAmount) : undefined,
//     taxRate: Number(row.taxRate || 0),
//     billingMonth: Number(billingMonth),
//     billingYear: Number(billingYear),
//     notes: row.notes || undefined,
//   });

//   const saveReadings = async () => {
//     const lease = leaseMap.get(selectedLeaseId);
//     if (!lease) {
//       toast.error("Lease is required.");
//       return;
//     }

//     const selectedTypeIds = draftRows.map((row) => String(row.utilityTypeId)).filter(Boolean);
//     if (!selectedTypeIds.length) {
//       toast.error("At least one utility type is required.");
//       return;
//     }
//     if (new Set(selectedTypeIds).size !== selectedTypeIds.length) {
//       toast.error("Each utility type can only appear once in the bulk editor.");
//       return;
//     }

//     const createPayload = [];
//     const updatePayload = [];

//     for (let index = 0; index < draftRows.length; index += 1) {
//       const row = draftRows[index];
//       const type = utilityTypeMap.get(String(row.utilityTypeId));
//       if (!validateRow(row, type, `Row ${index + 1}`)) return;
//       const payload = buildPayload(lease, row, type);
//       if (row.readingId) {
//         updatePayload.push({ id: row.readingId, payload });
//       } else {
//         createPayload.push(payload);
//       }
//     }

//     setSaving(true);
//     try {
//       if (updatePayload.length) {
//         await Promise.all(updatePayload.map((item) => FinanceAPI.updateReading(item.id, item.payload)));
//       }
//       if (createPayload.length) {
//         await FinanceAPI.createReadingsBulk({ readings: createPayload });
//       }

//       toast.success(modalMode === "edit" ? "Lease utility bundle updated." : "Utility bills recorded.");
//       setModalOpen(false);
//       resetModal();
//       fetchReadings();
//     } finally {
//       setSaving(false);
//     }
//   };

//   const renderUtilityFields = (row, index) => {
//     const type = utilityTypeMap.get(String(row.utilityTypeId));
//     const rateLocked = type?.defaults?.ratePerUnit !== undefined && type?.defaults?.ratePerUnit !== null;
//     const fixedLocked =
//       type?.defaults?.fixedMonthlyAmount !== undefined && type?.defaults?.fixedMonthlyAmount !== null;

//     const availableTypes = getAvailableUtilityTypes(row.localId);
//     const rowTypeIncluded =
//       type && !availableTypes.find((item) => String(item._id) === String(type._id)) ? [type, ...availableTypes] : availableTypes;

//     return (
//       <div className="border rounded p-3 mb-3" key={row.localId}>
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h6 className="mb-0">Utility {index + 1}</h6>
//           <Button color="outline-danger" size="sm" onClick={() => removeDraftRow(row.localId)}>
//             Remove
//           </Button>
//         </div>
//         <Row className="g-3">
//           <Col md={6}>
//             <FormGroup>
//               <Label className="form-label">Utility Type</Label>
//               <Input type="select" value={row.utilityTypeId} onChange={(e) => updateDraftRow(row.localId, "utilityTypeId", e.target.value)}>
//                 <option value="">Select utility type</option>
//                 {rowTypeIncluded.map((item) => (
//                   <option key={item._id} value={item._id}>
//                     {item.name} ({item.code})
//                   </option>
//                 ))}
//               </Input>
//             </FormGroup>
//           </Col>
//           <Col md={6}>
//             <FormGroup>
//               <Label className="form-label">Tax %</Label>
//               <Input type="number" min="0" max="100" value={row.taxRate} onChange={(e) => updateDraftRow(row.localId, "taxRate", e.target.value)} />
//             </FormGroup>
//           </Col>

//           {type?.inputConfig?.hasPreviousValue && (
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Previous Value</Label>
//                 <Input type="number" min="0" value={row.previousValue} onChange={(e) => updateDraftRow(row.localId, "previousValue", e.target.value)} />
//               </FormGroup>
//             </Col>
//           )}
//           {type?.inputConfig?.hasCurrentValue && (
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Current Value</Label>
//                 <Input type="number" min="0" value={row.currentValue} onChange={(e) => updateDraftRow(row.localId, "currentValue", e.target.value)} />
//               </FormGroup>
//             </Col>
//           )}
//           {type?.inputConfig?.hasRatePerUnit && (
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Rate Per Unit</Label>
//                 <Input type="number" min="0" value={row.ratePerUnit} readOnly={rateLocked} disabled={rateLocked} onChange={(e) => updateDraftRow(row.localId, "ratePerUnit", e.target.value)} />
//               </FormGroup>
//             </Col>
//           )}
//           {type?.inputConfig?.hasFixedMonthlyAmount && (
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Fixed Amount</Label>
//                 <Input type="number" min="0" value={row.fixedAmount} readOnly={fixedLocked} disabled={fixedLocked} onChange={(e) => updateDraftRow(row.localId, "fixedAmount", e.target.value)} />
//               </FormGroup>
//             </Col>
//           )}
//           {type?.inputConfig?.hasPreviousDate && (
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Previous Date</Label>
//                 <Input type="date" value={row.previousDate} onChange={(e) => updateDraftRow(row.localId, "previousDate", e.target.value)} />
//               </FormGroup>
//             </Col>
//           )}
//           {type?.inputConfig?.hasCurrentDate && (
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Current Date</Label>
//                 <Input type="date" value={row.currentDate} onChange={(e) => updateDraftRow(row.localId, "currentDate", e.target.value)} />
//               </FormGroup>
//             </Col>
//           )}
//           <Col md={12}>
//             <FormGroup className="mb-0">
//               <Label className="form-label">Notes</Label>
//               <Input type="textarea" rows="2" value={row.notes} onChange={(e) => updateDraftRow(row.localId, "notes", e.target.value)} />
//             </FormGroup>
//           </Col>
//         </Row>
//       </div>
//     );
//   };

//   const remainingUtilityCount = selectedLeaseId
//     ? utilityTypes.length - new Set(draftRows.map((row) => row.utilityTypeId).filter(Boolean)).size
//     : utilityTypes.length;

//   const columns = [
//     {
//       name: "Lease",
//       grow: 2.2,
//       cell: (row) => row.leaseLabel,
//     },
//     {
//       name: "Utility Types",
//       grow: 2,
//       cell: (row) => row.utilityNames.join(", "),
//     },
//     {
//       name: "Count",
//       cell: (row) => <Badge color="light" className="text-dark">{row.utilityCount}</Badge>,
//     },
//     {
//       name: "Total Amount",
//       cell: (row) => `$${Number(row.totalAmount || 0).toLocaleString()}`,
//     },
//     {
//       name: "Status",
//       cell: (row) => (
//         <Badge color={row.billedCount === row.utilityCount ? "success" : row.billedCount > 0 ? "info" : "warning"}>
//           {row.billedCount === row.utilityCount ? "Billed" : row.billedCount > 0 ? "Mixed" : "Recorded"}
//         </Badge>
//       ),
//     },
//     {
//       name: "Action",
//       width: "130px",
//       cell: (row) => (
//         <Button size="sm" color="outline-primary" onClick={() => openEditModal(row)}>
//           Edit
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Utility Bills" pageTitle="Finance" />

//         <Card className="mb-4">
//           <CardBody>
//             <Row className="g-3 align-items-end">
//               <Col md={4}>
//                 <FormGroup className="mb-0">
//                   <Label className="form-label">Billing Month</Label>
//                   <Input type="select" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)}>
//                     {monthOptions.map((month) => (
//                       <option key={month.value} value={month.value}>
//                         {month.label}
//                       </option>
//                     ))}
//                   </Input>
//                 </FormGroup>
//               </Col>
//               <Col md={4}>
//                 <FormGroup className="mb-0">
//                   <Label className="form-label">Billing Year</Label>
//                   <Input type="select" value={billingYear} onChange={(e) => setBillingYear(e.target.value)}>
//                     {yearOptions.map((year) => (
//                       <option key={year} value={year}>
//                         {year}
//                       </option>
//                     ))}
//                   </Input>
//                 </FormGroup>
//               </Col>
//               <Col md={4}>
//                 <Button color="primary" className="w-100 mb-3" onClick={openCreateModal}>
//                   Record New Utility Bill
//                 </Button>
//               </Col>
//             </Row>
//           </CardBody>
//         </Card>

//         <Card>
//           <CardHeader className="bg-light">
//             <h5 className="card-title mb-0">Recorded Utility Bills</h5>
//           </CardHeader>
//           <CardBody>
//             <DataTable columns={columns} data={groupedRows} progressPending={loading} responsive pagination />
//           </CardBody>
//         </Card>
//       </Container>

//       <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="xl" centered>
//         <ModalHeader toggle={() => setModalOpen(false)} className="bg-light">
//           {modalMode === "edit" ? "Edit Lease Utility Bundle" : "Bulk Utility Bill Entry"}
//         </ModalHeader>
//         <ModalBody>
//           <Row className="g-3 mb-3">
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Billing Month</Label>
//                 <Input type="select" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)}>
//                   {monthOptions.map((month) => (
//                     <option key={month.value} value={month.value}>
//                       {month.label}
//                     </option>
//                   ))}
//                 </Input>
//               </FormGroup>
//             </Col>
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Billing Year</Label>
//                 <Input type="select" value={billingYear} onChange={(e) => setBillingYear(e.target.value)}>
//                   {yearOptions.map((year) => (
//                     <option key={year} value={year}>
//                       {year}
//                     </option>
//                   ))}
//                 </Input>
//               </FormGroup>
//             </Col>
//             <Col md={4}>
//               <FormGroup>
//                 <Label className="form-label">Lease</Label>
//                 <Input type="select" value={selectedLeaseId} onChange={(e) => setSelectedLeaseId(e.target.value)} disabled={modalMode === "edit"}>
//                   <option value="">Select lease</option>
//                   {leases.map((lease) => (
//                     <option key={lease._id} value={lease._id}>
//                       {getLeaseLabel(lease)}
//                     </option>
//                   ))}
//                 </Input>
//               </FormGroup>
//             </Col>
//           </Row>

//           {selectedLease ? (
//             <div className="border rounded p-3 mb-3 bg-light-subtle">
//               <div className="fw-semibold">{getLeaseLabel(selectedLease)}</div>
//               <small className="text-muted">
//                 {modalMode === "edit"
//                   ? "All recorded utility types for this lease and period have been refilled below."
//                   : `Remaining utility types for this lease in this period: ${Math.max(remainingUtilityCount, 0)}`}
//               </small>
//             </div>
//           ) : null}

//           {draftRows.map((row, index) => renderUtilityFields(row, index))}

//           <Button color="light" onClick={addDraftRow} disabled={!selectedLeaseId}>
//             Add Another Utility Type
//           </Button>
//         </ModalBody>
//         <ModalFooter className="bg-light">
//           <Button color="light" onClick={() => setModalOpen(false)}>
//             Cancel
//           </Button>
//           <Button color="primary" onClick={saveReadings} disabled={saving}>
//             {saving ? "Saving..." : modalMode === "edit" ? "Update Utility Bundle" : "Save All Utility Bills"}
//           </Button>
//         </ModalFooter>
//       </Modal>
//       <ToastContainer />
//     </div>
//   );
// };

// export default UtilityBills;
