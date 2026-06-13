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
  Table,
} from "reactstrap";

import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiDeleteBinLine, RiEyeLine, RiPencilLine } from "react-icons/ri";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import Loader from "../../Components/Common/Loader";
import ActionIconButton from "../../Components/Common/ActionIconButton";
import useAuthUser from "../../Components/Hooks/useAuthUser";
import {
  bulkCreateUnits as onBulkCreateUnits,
  createUnit as onCreateUnit,
  deleteUnit as onDeleteUnit,
  getBuildings as onGetBuildings,
  getUnits as onGetUnits,
  updateUnit as onUpdateUnit,
  updateUnitStatus as onUpdateUnitStatus,
} from "../../slices/thunks";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
  { value: "under_maintenance", label: "Under Maintenance" },
];

const typeOptions = [
  { value: "studio", label: "Studio" },
  { value: "1-bedroom", label: "1 Bedroom" },
  { value: "2-bedroom", label: "2 Bedroom" },
  { value: "3-bedroom", label: "3 Bedroom" },
  { value: "4-bedroom", label: "4 Bedroom" },
  { value: "commercial", label: "Commercial" },
];

const furnishedOptions = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi", label: "Semi Furnished" },
  { value: "fully", label: "Fully Furnished" },
];

const modalSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: "48px",
  }),
  valueContainer: (base) => ({
    ...base,
    minHeight: "48px",
    padding: "0 12px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    minHeight: "48px",
  }),
};

const csvHeaders = [
  "buildingCode",
  "floor",
  "type",
  "marketRent",
  "specifications.bedrooms",
  "specifications.bathrooms",
  "specifications.size",
  "specifications.furnished",
  "specifications.parkingSpaces",
  "features",
];

const parseCsvLine = (line) => {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
};

const numOrUndef = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

const buildPayload = (values) => {
  const payload = {
    buildingId: values.buildingId,
    code: values.code,
    floor: Number(values.floor),
    type: values.type,
    marketRent: Number(values.marketRent),
  };
  const specs = {};
  const bd = numOrUndef(values.specifications.bedrooms);
  const bt = numOrUndef(values.specifications.bathrooms);
  const ps = numOrUndef(values.specifications.parkingSpaces);
  if (bd !== undefined) specs.bedrooms = bd;
  if (bt !== undefined) specs.bathrooms = bt;
  if (values.specifications.size?.trim()) specs.size = values.specifications.size.trim();
  if (values.specifications.furnished) specs.furnished = values.specifications.furnished;
  if (ps !== undefined) specs.parkingSpaces = ps;
  if (Object.keys(specs).length) payload.specifications = specs;
  const features = values.featuresInput.split(",").map((x) => x.trim()).filter(Boolean);
  if (features.length) payload.features = features;
  return payload;
};

const mapCsvRow = (row) => {
  const payload = {
    buildingCode: (row.buildingCode || "").trim(),
    floor: Number(row.floor),
    type: (row.type || "").trim(),
    marketRent: Number(row.marketRent),
  };
  const specs = {};
  const bd = numOrUndef(row["specifications.bedrooms"]);
  const bt = numOrUndef(row["specifications.bathrooms"]);
  const ps = numOrUndef(row["specifications.parkingSpaces"]);
  if (bd !== undefined) specs.bedrooms = bd;
  if (bt !== undefined) specs.bathrooms = bt;
  if ((row["specifications.size"] || "").trim()) specs.size = row["specifications.size"].trim();
  if ((row["specifications.furnished"] || "").trim()) {
    specs.furnished = row["specifications.furnished"].trim();
  }
  if (ps !== undefined) specs.parkingSpaces = ps;
  if (Object.keys(specs).length) payload.specifications = specs;
  const features = (row.features || "").split("|").map((x) => x.trim()).filter(Boolean);
  if (features.length) payload.features = features;
  return payload;
};

const buildBulkPayload = (rows) => {
  const defaultBuildingCode = rows.find((row) => row.buildingCode)?.buildingCode || "";
  return {
    ...(defaultBuildingCode ? { buildingCode: defaultBuildingCode } : {}),
    units: rows.map((row) => {
      const { buildingCode, ...unit } = row;
      if (buildingCode && buildingCode !== defaultBuildingCode) {
        return { ...unit, buildingCode };
      }
      return unit;
    }),
  };
};

const Units = () => {
  document.title = "Units | Degaanly";
  const dispatch = useDispatch();
  const userAuth = useAuthUser();
  const organizationId = userAuth.businessId;

  const unitsSelector = createSelector(
    (state) => state.Units,
    (s) => ({ units: s.units, pagination: s.pagination, loading: s.loading }),
  );
  const buildingsSelector = createSelector((state) => state.Buildings, (s) => s.buildings || []);
  const { units, pagination, loading } = useSelector(unitsSelector);
  const buildings = useSelector(buildingsSelector);

  const [modal, setModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [buildingId, setBuildingId] = useState("");
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkPayload, setBulkPayload] = useState(null);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkConfirmModal, setBulkConfirmModal] = useState(false);

  const fetchUnits = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(search && { search }),
      ...(status !== "all" && { status }),
      ...(buildingId && { buildingId }),
    };
    dispatch(onGetUnits({ organizationId, params }));
  }, [dispatch, organizationId, currentPage, search, status, buildingId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    dispatch(onGetBuildings({ organizationId, params: { page: 1, limit: 100 } }));
  }, [dispatch, organizationId]);

  const buildingOptions = useMemo(
    () =>
      (buildings || []).map((b) => ({
        value: b._id,
        label: `${b.name} (${b.code})`,
      })),
    [buildings],
  );

  const getBuildingName = (building) => {
    if (!building) return "N/A";
    if (typeof building === "object") return building.name || building.code || building._id || "N/A";
    return buildings.find((x) => x._id === building)?.name || building;
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      buildingId: typeof selectedUnit?.buildingId === "object" ? selectedUnit?.buildingId?._id || "" : selectedUnit?.buildingId || "",
      code: selectedUnit?.code || "",
      floor: selectedUnit?.floor ?? "",
      type: selectedUnit?.type || "",
      marketRent: selectedUnit?.marketRent ?? "",
      specifications: {
        bedrooms: selectedUnit?.specifications?.bedrooms ?? "",
        bathrooms: selectedUnit?.specifications?.bathrooms ?? "",
        size: selectedUnit?.specifications?.size || "",
        furnished: selectedUnit?.specifications?.furnished || "",
        parkingSpaces: selectedUnit?.specifications?.parkingSpaces ?? "",
      },
      featuresInput: Array.isArray(selectedUnit?.features) ? selectedUnit.features.join(", ") : "",
    },
    validationSchema: Yup.object({
      buildingId: Yup.string().required("Building is required"),
      // unitNumber: Yup.string().required("Unit number is required"),
      floor: Yup.number().transform((v, o) => (o === "" ? undefined : v)).required("Floor is required").min(0),
      type: Yup.string().required("Type is required"),
      marketRent: Yup.number().transform((v, o) => (o === "" ? undefined : v)).required("Market rent is required").min(0),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = buildPayload(values);
        if (selectedUnit?._id) {
          await dispatch(onUpdateUnit({ id: selectedUnit._id, data: payload }));
        } else {
          await dispatch(onCreateUnit({ data: payload }));
        }
        setModal(false);
        setSelectedUnit(null);
        resetForm();
        fetchUnits();
      } catch (error) {
        toast.error(error?.message || "Failed to save unit");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setBuildingId("");
    setCurrentPage(1);
  };

  const handleDownloadTemplate = () => {
    const sampleRows = [
      "BLD0001,1,2-bedroom,500,2,2,95 sqm,semi,1,balcony|store|city view",
      ",2,1-bedroom,350,1,1,60 sqm,unfurnished,0,corner unit",
      "BLD0002,0,commercial,1200,,1,140 sqm,unfurnished,2,road facing|private entrance",
    ];
    const csv = [csvHeaders.join(","), ...sampleRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "units_bulk_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || "");
      const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error("File has no data rows.");
        setBulkRows([]);
        return;
      }
      const headers = parseCsvLine(lines[0]);
      const required = ["buildingCode", "floor", "type", "marketRent"];
      const missing = required.filter((h) => !headers.includes(h));
      if (missing.length) {
        toast.error(`Missing columns: ${missing.join(", ")}`);
        setBulkRows([]);
        setBulkPayload(null);
        return;
      }
      const parsed = [];
      for (let i = 1; i < lines.length; i += 1) {
        const values = parseCsvLine(lines[i]);
        const raw = {};
        headers.forEach((h, idx) => {
          raw[h] = values[idx] ?? "";
        });
        const payload = mapCsvRow(raw);
        if (!payload.type) continue;
        if (Number.isNaN(payload.floor) || Number.isNaN(payload.marketRent)) continue;
        parsed.push(payload);
      }
      const hasAnyBuildingCode = parsed.some((row) => row.buildingCode);
      if (!parsed.length || !hasAnyBuildingCode) {
        setBulkRows([]);
        setBulkPayload(null);
        toast.error("No valid rows found. Include at least one buildingCode.");
        return;
      }
      setBulkRows(parsed);
      setBulkPayload(buildBulkPayload(parsed));
    };
    reader.readAsText(file);
  };

  const saveBulk = async () => {
    if (!bulkRows.length || !bulkPayload) {
      toast.error("No valid rows to save.");
      return;
    }
    try {
      setBulkSaving(true);
      await dispatch(onBulkCreateUnits({ data: bulkPayload }));
      setBulkModal(false);
      setBulkConfirmModal(false);
      setBulkRows([]);
      setBulkPayload(null);
      setBulkFileName("");
      fetchUnits();
    } catch (error) {
      toast.error(error?.message || "Bulk create failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const removeUnit = async () => {
    if (!selectedUnit?._id) return;
    try {
      await dispatch(onDeleteUnit({ id: selectedUnit._id }));
      setDeleteModal(false);
      setSelectedUnit(null);
      fetchUnits();
    } catch (error) {
      toast.error(error?.message || "Failed to delete unit");
    }
  };

  const handleStatusUpdate = async (unitId, nextStatus) => {
    if (!unitId || !nextStatus) return;
    try {
      await dispatch(onUpdateUnitStatus({ id: unitId, status: nextStatus }));
      fetchUnits();
    } catch (error) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const columns = [
    { name: "#", cell: (r, i) => ((currentPage - 1) * (pagination?.limit || 10)) + i + 1, width: "70px" },
    {
      name: "Unit Code & Building",
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.code}</div>
          <small className="text-muted">{getBuildingName(row.buildingId)}</small>
        </div>
      ),
      grow: 2,
    },
    { name: "Floor", selector: (row) => row.floor },
    { name: "Type", cell: (row) => <Badge color="secondary">{row.type}</Badge> },
    { name: "Rent", cell: (row) => <span>${Number(row.marketRent || 0).toLocaleString()}</span> },
    {
      name: "Status",
      cell: (row) => (
        <Select
          options={statusOptions.filter((opt) => opt.value !== "all")}
          value={statusOptions.find((x) => x.value === row.status) || null}
          onChange={(opt) => handleStatusUpdate(row._id, opt?.value)}
          isClearable={false}
          className="react-select"
          classNamePrefix="select"
          menuPortalTarget={document.body}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <ActionIconButton
            id={`view-unit-${row._id}`}
            icon={<RiEyeLine size={16} />}
            tooltip="View Unit"
            onClick={() => {
              setSelectedUnit(row);
              setViewModal(true);
            }}
          />
          <ActionIconButton
            id={`edit-unit-${row._id}`}
            icon={<RiPencilLine size={16} />}
            tooltip="Edit Unit"
            onClick={() => {
              setSelectedUnit(row);
              setModal(true);
            }}
          />
          <ActionIconButton
            id={`delete-unit-${row._id}`}
            icon={<RiDeleteBinLine size={16} />}
            tooltip="Delete Unit"
            onClick={() => {
              setSelectedUnit(row);
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
        <BreadCrumb title="Units" pageTitle="Properties" />
        <Card className="mb-4">
          <CardBody className="p-3">
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Search Units</Label>
                  <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search by unit number..." />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Status</Label>
                  <Select options={statusOptions} value={statusOptions.find((x) => x.value === status) || null} onChange={(opt) => { setStatus(opt?.value || "all"); setCurrentPage(1); }} isClearable className="react-select" classNamePrefix="select" />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Building</Label>
                  <Select options={[{ value: "", label: "All Buildings" }, ...buildingOptions]} value={[{ value: "", label: "All Buildings" }, ...buildingOptions].find((x) => x.value === buildingId) || null} onChange={(opt) => { setBuildingId(opt?.value || ""); setCurrentPage(1); }} isClearable className="react-select" classNamePrefix="select" />
                </FormGroup>
              </Col>
              <Col md={2}>
                <Button color="primary" className="w-100 mb-3" onClick={handleResetFilters}><i className="ri-refresh-line me-1"></i>Reset</Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center bg-light">
            <h5 className="card-title mb-0 flex-grow-1"><i className="ri-home-5-line align-middle me-2"></i>Units List<Badge color="primary" className="ms-2">{pagination?.total || units.length}</Badge></h5>
            <div className="d-flex gap-2">
              {/* <Button color="info" onClick={() => setBulkModal(true)} className="shadow-sm"><i className="ri-file-upload-line me-1"></i>Bulk Upload</Button> */}
              <Button color="primary" onClick={() => { setSelectedUnit(null); setModal(true); }} className="shadow-sm"><i className="ri-add-line me-1"></i>Unit</Button>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? <Loader /> : <DataTable columns={columns} data={units} pagination paginationServer paginationTotalRows={pagination?.total || 0} paginationPerPage={pagination?.limit || 10} paginationDefaultPage={currentPage} onChangePage={(p) => setCurrentPage(p)} responsive />}
          </CardBody>
        </Card>
      </Container>
      <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" centered>
        <ModalHeader toggle={() => setModal(false)} className="bg-light">{selectedUnit ? "Edit Unit" : "Create Unit"}</ModalHeader>
        <Form onSubmit={formik.handleSubmit}>
          <ModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row className="g-3 align-items-start">
              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Building <span className="text-danger">*</span></Label>
                  <Select
                    options={buildingOptions}
                    value={buildingOptions.find((x) => x.value === formik.values.buildingId) || null}
                    onChange={(opt) => formik.setFieldValue("buildingId", opt?.value || "")}
                    className="react-select"
                    classNamePrefix="select"
                    styles={modalSelectStyles}
                  />
                  {formik.touched.buildingId && formik.errors.buildingId ? <div className="text-danger small mt-1">{formik.errors.buildingId}</div> : null}
                </FormGroup>
              </Col>
              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Bedrooms</Label>
                  <Input type="number" name="specifications.bedrooms" value={formik.values.specifications.bedrooms} onChange={formik.handleChange} className="form-control-lg" />
                </FormGroup>
              </Col>
              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Bathrooms</Label>
                  <Input type="number" name="specifications.bathrooms" value={formik.values.specifications.bathrooms} onChange={formik.handleChange} className="form-control-lg" />
                </FormGroup>
              </Col>

              <Col lg={4} style={{ display: "none" }}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Unit Number <span className="text-danger">*</span></Label>
                  <Input name="unitNumber" value={formik.values.unitNumber} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.unitNumber && !!formik.errors.unitNumber} className="form-control-lg" />
                  <FormFeedback>{formik.errors.unitNumber}</FormFeedback>
                </FormGroup>
              </Col>
              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Size</Label>
                  <Input name="specifications.size" value={formik.values.specifications.size} onChange={formik.handleChange} className="form-control-lg" />
                </FormGroup>
              </Col>
              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Furnished</Label>
                  <Select
                    options={furnishedOptions}
                    value={furnishedOptions.find((x) => x.value === formik.values.specifications.furnished) || null}
                    onChange={(opt) => formik.setFieldValue("specifications.furnished", opt?.value || "")}
                    isClearable
                    className="react-select"
                    classNamePrefix="select"
                    styles={modalSelectStyles}
                  />
                </FormGroup>
              </Col>

              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Floor <span className="text-danger">*</span></Label>
                  <Input type="number" name="floor" value={formik.values.floor} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.floor && !!formik.errors.floor} className="form-control-lg" />
                  <FormFeedback>{formik.errors.floor}</FormFeedback>
                </FormGroup>
              </Col>
              {buildings.find((b) => b._id === formik.values.buildingId)?.unitCodeGenerationMode === 'MANUAL' && (
                <Col lg={3} md={6}>
                  <FormGroup className="mb-0">
                    <Label className="form-label">Unit Code <span className="text-danger">*</span></Label>
                    <Input name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.code && !!formik.errors.code} className="form-control-lg" />
                    <FormFeedback>{formik.errors.code}</FormFeedback>
                  </FormGroup>
                </Col>
              )}
              <Col lg={3} md={6}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Type <span className="text-danger">*</span></Label>
                  <Select
                    options={typeOptions}
                    value={typeOptions.find((x) => x.value === formik.values.type) || null}
                    onChange={(opt) => formik.setFieldValue("type", opt?.value || "")}
                    className="react-select"
                    classNamePrefix="select"
                    styles={modalSelectStyles}
                  />
                  {formik.touched.type && formik.errors.type ? <div className="text-danger small mt-1">{formik.errors.type}</div> : null}
                </FormGroup>
              </Col>
              <Col lg={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Parking Spaces</Label>
                  <Input type="number" name="specifications.parkingSpaces" value={formik.values.specifications.parkingSpaces} onChange={formik.handleChange} className="form-control-lg" />
                </FormGroup>
              </Col>

              <Col lg={3}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Market Rent <span className="text-danger">*</span></Label>
                  <Input type="number" name="marketRent" value={formik.values.marketRent} onChange={formik.handleChange} onBlur={formik.handleBlur} invalid={formik.touched.marketRent && !!formik.errors.marketRent} className="form-control-lg" />
                  <FormFeedback>{formik.errors.marketRent}</FormFeedback>
                </FormGroup>
              </Col>
              <Col lg={9}>
                <FormGroup className="mb-0">
                  <Label className="form-label">Features (comma separated)</Label>
                  <Input name="featuresInput" value={formik.values.featuresInput} onChange={formik.handleChange} className="form-control-lg" />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter className="bg-light">
            <Button color="light" className="me-2" onClick={() => setModal(false)}><i className="ri-close-line me-1"></i>Cancel</Button>
            <Button color="primary" type="submit" disabled={formik.isSubmitting} className="px-4">{formik.isSubmitting ? <><Spinner size="sm" className="me-2" />Saving...</> : <><i className="ri-save-line me-1"></i>{selectedUnit ? "Update Unit" : "Create Unit"}</>}</Button>
          </ModalFooter>
        </Form>
      </Modal>
      <Modal isOpen={bulkModal} toggle={() => { setBulkModal(false); setBulkConfirmModal(false); }} size="xl" centered>
        <ModalHeader toggle={() => setBulkModal(false)} className="bg-light"><i className="ri-file-upload-line me-2"></i>Bulk Create Units</ModalHeader>
        <ModalBody>
          <Row className="mb-3">
            <Col md={8}><p className="mb-1 fw-medium">Download the template, fill it in Excel, save as CSV, then upload to preview the bulk payload.</p><p className="text-muted mb-0">Use `buildingCode` on the first row as the default code. Add another `buildingCode` on a later row only when that unit belongs to a different building.</p></Col>
            <Col md={4} className="text-md-end mt-2 mt-md-0"><Button color="primary" onClick={handleDownloadTemplate}><i className="ri-file-download-line me-1"></i>Download Template</Button></Col>
          </Row>
          <FormGroup className="mb-3"><Label className="form-label">Upload CSV</Label><Input type="file" accept=".csv,text/csv,application/vnd.ms-excel" onChange={handleBulkFile} />{bulkFileName ? <small className="text-muted d-block mt-1">{bulkFileName}</small> : null}</FormGroup>
          {bulkPayload ? (
            <Card className="border mb-3">
              <CardHeader className="bg-light">
                <div className="fw-semibold">Payload Preview</div>
              </CardHeader>
              <CardBody className="py-3">
                <Row className="g-3">
                  <Col md={4}>
                    <div className="text-muted small text-uppercase fw-semibold">Default Building Code</div>
                    <div>{bulkPayload.buildingCode || "Per-row only"}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small text-uppercase fw-semibold">Units In Batch</div>
                    <div>{bulkPayload.units?.length || 0}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small text-uppercase fw-semibold">Overrides</div>
                    <div>{bulkRows.filter((row) => row.buildingCode && row.buildingCode !== bulkPayload.buildingCode).length}</div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          ) : null}
          <div className="table-responsive">
            <Table className="table-nowrap align-middle">
              <thead className="table-light"><tr><th>#</th><th>buildingCode</th><th>floor</th><th>type</th><th>marketRent</th><th>specifications</th><th>features</th></tr></thead>
              <tbody>{bulkRows.length ? bulkRows.map((row, i) => <tr key={`${row.buildingCode || "default"}-${row.floor}-${row.type}-${i}`}><td>{i + 1}</td><td>{row.buildingCode || bulkPayload?.buildingCode || "-"}</td><td>{row.floor}</td><td>{row.type}</td><td>{row.marketRent}</td><td>{[`bed: ${row.specifications?.bedrooms ?? "-"}`, `bath: ${row.specifications?.bathrooms ?? "-"}`, `size: ${row.specifications?.size || "-"}`, `furnished: ${row.specifications?.furnished || "-"}`, `parking: ${row.specifications?.parkingSpaces ?? "-"}`].join(" | ")}</td><td>{row.features?.join(", ") || "-"}</td></tr>) : <tr><td colSpan="7" className="text-center py-4 text-muted">No preview rows yet.</td></tr>}</tbody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" className="me-2" onClick={() => setBulkModal(false)}>Cancel</Button>
          <Button color="success" onClick={() => setBulkConfirmModal(true)} disabled={!bulkRows.length || !bulkPayload || bulkSaving}>{bulkSaving ? <><Spinner size="sm" className="me-2" />Saving...</> : "Continue to Confirmation"}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={bulkConfirmModal} toggle={() => setBulkConfirmModal(false)} centered>
        <ModalHeader toggle={() => setBulkConfirmModal(false)} className="bg-light">Confirm Bulk Unit Creation</ModalHeader>
        <ModalBody>
          <p className="mb-3">Review the batch before creating units.</p>
          <div className="border rounded p-3 bg-light-subtle">
            <div className="mb-2"><span className="fw-semibold">Default building code:</span> {bulkPayload?.buildingCode || "Per-row only"}</div>
            <div className="mb-2"><span className="fw-semibold">Units to create:</span> {bulkPayload?.units?.length || 0}</div>
            <div><span className="fw-semibold">Rows with building override:</span> {bulkRows.filter((row) => row.buildingCode && row.buildingCode !== bulkPayload?.buildingCode).length}</div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="light" onClick={() => setBulkConfirmModal(false)}>Back</Button>
          <Button color="success" onClick={saveBulk} disabled={!bulkPayload || bulkSaving}>
            {bulkSaving ? <><Spinner size="sm" className="me-2" />Creating...</> : "Confirm Bulk Create"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={viewModal}
        toggle={() => setViewModal(false)}
        centered
        size="xl"
      >
        <ModalHeader
          toggle={() => setViewModal(false)}
          className="border-0 pb-0"
        >
          <h5 className="modal-title fw-bold">Unit Details</h5>
        </ModalHeader>

        <ModalBody className="pt-0">
          {selectedUnit ? (
            <Row className="g-4">
              {/* LEFT COLUMN */}
              <Col md={7}>
                <div className="bg-light p-3 rounded-3">
                  {/* Unit Code */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <i className="ri-door-open-line fs-4 text-secondary" />
                    <div>
                      <span className="text-muted small text-uppercase">
                        Unit Code
                      </span>
                      <div className="fw-bold fs-5">
                        {selectedUnit.code ||
                          selectedUnit.unitNumber ||
                          "-"}
                      </div>
                    </div>
                  </div>

                  {/* Building & Floor */}
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    <div className="d-flex align-items-center gap-2 flex-fill">
                      <i className="ri-building-line fs-5 text-secondary" />
                      <div>
                        <span className="text-muted small d-block">
                          Building
                        </span>
                        <span className="fw-semibold">
                          {selectedUnit.buildingId?.name || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-fill">
                      <i className="ri-stairs-line fs-5 text-secondary" />
                      <div>
                        <span className="text-muted small d-block">
                          Floor
                        </span>
                        <span className="fw-semibold">
                          {selectedUnit.floor ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Type & Status */}
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    <div className="d-flex align-items-center gap-2 flex-fill">
                      <i className="ri-home-4-line fs-5 text-secondary" />
                      <div>
                        <span className="text-muted small d-block">
                          Type
                        </span>
                        <span className="fw-semibold text-capitalize">
                          {selectedUnit.type || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-fill">
                      <i className="ri-checkbox-circle-line fs-5 text-secondary" />
                      <div>
                        <span className="text-muted small d-block">
                          Status
                        </span>
                        <Badge
                          color={
                            selectedUnit.status === "occupied"
                              ? "danger"
                              : selectedUnit.status === "vacant"
                                ? "success"
                                : "warning"
                          }
                          className="text-capitalize"
                        >
                          {selectedUnit.status || "-"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <hr className="my-2" />

                  {/* Rent & Features */}
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    <div className="d-flex align-items-center gap-2 flex-fill">
                      <i className="ri-money-dollar-circle-line fs-5 text-secondary" />
                      <div>
                        <span className="text-muted small d-block">
                          Market Rent
                        </span>
                        <span className="fw-semibold">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(selectedUnit.marketRent || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-fill">
                      <i className="ri-list-check-2 fs-5 text-secondary" />
                      <div>
                        <span className="text-muted small d-block">
                          Features
                        </span>
                        <span className="fw-semibold">
                          {selectedUnit.features?.length
                            ? selectedUnit.features.join(", ")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr className="my-2" />

                  {/* Specifications */}
                  <div>
                    <span className="text-muted small text-uppercase mb-2 d-block">
                      Specifications
                    </span>

                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-white text-dark border p-2">
                        <i className="ri-bed-line me-1" />
                        {selectedUnit.specifications?.bedrooms ?? "-"} Beds
                      </span>

                      <span className="badge bg-white text-dark border p-2">
                        <i className="ri-shower-line me-1" />
                        {selectedUnit.specifications?.bathrooms ?? "-"} Baths
                      </span>

                      <span className="badge bg-white text-dark border p-2">
                        <i className="ri-ruler-line me-1" />
                        {selectedUnit.specifications?.size || "-"}
                      </span>

                      <span className="badge bg-white text-dark border p-2">
                        <i className="ri-armchair-line me-1" />
                        {selectedUnit.specifications?.furnished || "-"}
                      </span>

                      <span className="badge bg-white text-dark border p-2">
                        <i className="ri-parking-box-line me-1" />
                        {selectedUnit.specifications?.parkingSpaces ?? "-"} Parking
                      </span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* RIGHT COLUMN – DYNAMIC BUILDING VIEW */}
              <Col md={5}>
                <div className="card h-100 border-0 shadow-sm">
                  {selectedUnit.buildingId ? (
                    <div className="card-body d-flex flex-column p-3">
                      {/* Header with building name */}
                      <div className="d-flex align-items-center gap-2 border-bottom pb-3 mb-3">
                        <i className="bi bi-building fs-4 text-primary"></i>
                        <h6 className="fw-semibold mb-0">{selectedUnit.buildingId.name}</h6>
                      </div>

                      {/* Scrollable floor list */}
                      <div
                        className="d-flex flex-column-reverse gap-2 mb-3 overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        {[...Array(selectedUnit.buildingId.details?.totalFloors || 0)].map(
                          (_, index) => {
                            const floorNumber = index + 1;
                            const isCurrent = floorNumber === selectedUnit.floor;

                            return (
                              <div
                                key={floorNumber}
                                className={`d-flex justify-content-between align-items-center p-2 rounded-3 border ${isCurrent
                                  ? "bg-primary border-primary text-white"
                                  : "bg-light border-0"
                                  }`}
                              >
                                <span className="fw-medium">Floor {floorNumber}</span>
                                {isCurrent && (
                                  <span className="badge bg-white text-primary rounded-pill">
                                    <i className="bi bi-check-circle-fill me-1 small"></i>
                                    Selected Unit
                                  </span>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* Footer stats */}
                      <div className="d-flex justify-content-between mt-auto pt-2 border-top">
                        <div className="d-flex align-items-center gap-2 small text-secondary">
                          <i className="bi bi-layers text-primary"></i>
                          <span>Floors: {selectedUnit.buildingId.details?.totalFloors || 0}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 small text-secondary">
                          <i className="bi bi-door-closed text-primary"></i>
                          <span>Units: {selectedUnit.buildingId.details?.totalUnits || 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-body d-flex flex-column align-items-center justify-content-center text-secondary p-4">
                      <i className="bi bi-building-slash fs-1 mb-2"></i>
                      <span>No Building Data</span>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          ) : (
            <div className="text-center py-4">
              No unit selected
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-0 pt-0">
          <Button
            color="secondary"
            onClick={() => setViewModal(false)}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
      <DeleteModal show={deleteModal} onDeleteClick={removeUnit} onCloseClick={() => setDeleteModal(false)} confirmationText={selectedUnit ? `Are you sure you want to delete unit "${selectedUnit.unitNumber}"?` : ""} />
      <ToastContainer />
    </div>
  );
};

export default Units;
