import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "../../Components/Common/AppDataTable";
import Select from "../../Components/Common/AppSelect";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback,
    Table, Spinner,
    Nav, NavItem, NavLink
} from "reactstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RiDeleteBinLine, RiEyeLine, RiPencilLine } from "react-icons/ri";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import Loader from "../../Components/Common/Loader";
import ActionIconButton from "../../Components/Common/ActionIconButton";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import classnames from 'classnames';

//redux thunks
import {
    getBuildings as onGetBuildings,
    getBuilding as onGetBuilding,
    getBuildingStats as onGetBuildingStats,
    getBuildingUnits as onGetBuildingUnits,
    createBuilding as onCreateBuilding,
    updateBuilding as onUpdateBuilding,
    deleteBuilding as onDeleteBuilding
} from "../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";
import useAuthUser from '../../Components/Hooks/useAuthUser';

// Unit status badges
const unitStatusBadges = {
    vacant: { color: 'secondary', icon: 'ri-door-open-line' },
    occupied: { color: 'success', icon: 'ri-door-lock-line' },
    reserved: { color: 'warning', icon: 'ri-calendar-check-line' },
    under_maintenance: { color: 'danger', icon: 'ri-tools-line' }
};

const Buildings = () => {
    document.title = "Buildings | Apartment Management";

    const dispatch = useDispatch();
    const userAuth = useAuthUser();
    const organizationId = userAuth.businessId;

    // Redux Selectors
    const selectBuildingsData = createSelector(
        (state) => state.Buildings,
        (buildingsData) => ({
            buildings: buildingsData.buildings,
            pagination: buildingsData.pagination,
            loading: buildingsData.loading,
            building: buildingsData.building,
            buildingStats: buildingsData.buildingStats,
            buildingUnits: buildingsData.buildingUnits
        })
    );

    const { buildings, pagination, loading, building, buildingStats, buildingUnits } =
        useSelector(selectBuildingsData);

    // Local state
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('1');
    const statusOptions = [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    // Fetch buildings
    const fetchBuildings = useCallback(() => {
        const params = {
            page: currentPage,
            limit: 10,
            ...(searchTerm && { search: searchTerm }),
            ...(statusFilter !== 'all' && { status: statusFilter })
        };
        dispatch(onGetBuildings({ organizationId, params }));
    }, [dispatch, organizationId, currentPage, searchTerm, statusFilter]);

    useEffect(() => {
        fetchBuildings();
    }, [fetchBuildings]);

    // Handle view building details
    const handleViewBuilding = async (id) => {
        setSelectedBuilding(id);
        await Promise.all([
            dispatch(onGetBuilding({ organizationId, id })),
            dispatch(onGetBuildingStats({ organizationId, id })),
            dispatch(onGetBuildingUnits({ organizationId, id }))
        ]);
        setViewModal(true);
    };

    // Handle edit building
    const handleEditBuilding = (building) => {
        setSelectedBuilding(building);
        setModal(true);
    };

    // Handle delete building
    const handleDeleteBuilding = (building) => {
        setSelectedBuilding(building);
        setDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await dispatch(onDeleteBuilding({ organizationId, id: selectedBuilding._id }));
            setDeleteModal(false);
            setSelectedBuilding(null);
            fetchBuildings();
        } catch (error) {
            toast.error('Failed to delete building');
        }
    };

    // Handle create new building
    const handleCreateBuilding = () => {
        setSelectedBuilding(null);
        setActiveTab('1');
        setModal(true);
    };

    // Validation schema
    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Building name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters'),
        address: Yup.object({
            street: Yup.string()
                .required('Street address is required')
                .max(200, 'Street must not exceed 200 characters'),
            city: Yup.string()
                .required('City is required')
                .max(100, 'City must not exceed 100 characters'),
            district: Yup.string()
                .max(100, 'District must not exceed 100 characters'),
            region: Yup.string()
                .max(100, 'Region must not exceed 100 characters'),
            country: Yup.string()
                .default('Somalia'),
            postalCode: Yup.string()
                .max(20, 'Postal code must not exceed 20 characters')
        }),
        details: Yup.object({
            totalFloors: Yup.number()
                .transform((value, originalValue) => originalValue === '' ? undefined : value)
                .min(0, 'Total floors must be at least 0')
                .integer('Total floors must be a whole number'),
            totalUnits: Yup.number()
                .transform((value, originalValue) => originalValue === '' ? undefined : value)
                .min(0, 'Total units must be at least 0')
                .integer('Total units must be a whole number'),
            yearBuilt: Yup.number()
                .transform((value, originalValue) => originalValue === '' ? undefined : value)
                .min(1800, 'Year built must be after 1800')
                .max(new Date().getFullYear(), 'Year built cannot be in the future')
                .integer('Year built must be a whole number'),
            parkingSpaces: Yup.number()
                .transform((value, originalValue) => originalValue === '' ? undefined : value)
                .min(0, 'Parking spaces must be at least 0')
                .integer('Parking spaces must be a whole number')
        }),
        unitCodePrefix: Yup.string()
            .max(20, 'Unit code prefix must not exceed 20 characters'),
        unitCodeLength: Yup.number()
            .transform((value, originalValue) => originalValue === '' ? undefined : value)
            .min(1, 'Unit code length must be at least 1')
            .integer('Unit code length must be a whole number'),
        tenantCodePrefix: Yup.string()
            .max(20, 'Tenant code prefix must not exceed 20 characters'),
        tenantCodeLength: Yup.number()
            .transform((value, originalValue) => originalValue === '' ? undefined : value)
            .min(1, 'Tenant code length must be at least 1')
            .integer('Tenant code length must be a whole number'),
        amenities: Yup.array().of(Yup.string()),
        isActive: Yup.boolean()
    });

    // Formik for building form
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: selectedBuilding?.name || '',
            code: selectedBuilding?.code || '',
            address: {
                street: selectedBuilding?.address?.street || '',
                city: selectedBuilding?.address?.city || '',
                district: selectedBuilding?.address?.district || '',
                region: selectedBuilding?.address?.region || '',
                country: selectedBuilding?.address?.country || 'Somalia',
                postalCode: selectedBuilding?.address?.postalCode || '',
                // coordinates: {
                //     lat: selectedBuilding?.address?.coordinates?.lat || '',
                //     lng: selectedBuilding?.address?.coordinates?.lng || ''
                // }
            },
            details: {
                totalFloors: selectedBuilding?.details?.totalFloors || '',
                totalUnits: selectedBuilding?.details?.totalUnits || '',
                yearBuilt: selectedBuilding?.details?.yearBuilt || '',
                parkingSpaces: selectedBuilding?.details?.parkingSpaces || '',
                hasGenerator: selectedBuilding?.details?.hasGenerator || false,
                hasWaterTank: selectedBuilding?.details?.hasWaterTank || false,
                hasSecurity: selectedBuilding?.details?.hasSecurity || false
            },
            unitCodePrefix: selectedBuilding?.unitCodePrefix || '',
            unitCodeLength: selectedBuilding?.unitCodeLength ?? '',
            tenantCodePrefix: selectedBuilding?.tenantCodePrefix || '',
            tenantCodeLength: selectedBuilding?.tenantCodeLength ?? '',
            amenities: selectedBuilding?.amenities || [],
            isActive: selectedBuilding?.isActive ?? true
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            console.group('Form Submission Started');
            try {
                console.log('Submitting building data:', values);
                const payload = { ...values };
                delete payload.code;
                // if (!selectedBuilding?._id) {
                //     delete payload.code;
                // }

                if (selectedBuilding?._id) {
                    await dispatch(onUpdateBuilding({ organizationId, id: selectedBuilding._id, data: payload }));
                } else {
                    await dispatch(onCreateBuilding({ organizationId, data: payload }));

                }

                setModal(false);
                resetForm();
                setSelectedBuilding(null);
                fetchBuildings();
            } catch (error) {
                if (error.response?.status === 409) {
                    toast.error('Building configuration conflicts with an existing record');
                } else {
                    toast.error(error.response?.data?.message || 'Failed to save building');
                }
            } finally {
                setSubmitting(false);
            }
        }
    });

    // Format address
    const formatAddress = (address) => {
        if (!address) return 'N/A';
        const parts = [
            address.street,
            address.district,
            address.city,
            address.region,
            address.country
        ].filter(Boolean);
        return parts.join(', ');
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Handle status filter
    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    const columns = [
        {
            name: '#',
            cell: (row, index) => ((currentPage - 1) * (pagination?.limit || 10)) + index + 1,

        },
        {
            name: 'Building',
            cell: (row) => (
                <div className="d-flex align-items-center">
                    <div className="avatar-sm me-3">
                        <div className="avatar-title bg-light rounded">
                            <i className="ri-building-line text-primary"></i>
                        </div>
                    </div>
                    <div>
                        <div className="fw-semibold">{row.name}</div>
                        <small className="text-muted">
                            Added {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                        </small>
                    </div>
                </div>
            ),
            grow: 2
        },
        {
            name: 'Code',
            cell: (row) => <Badge color="primary">{row.code}</Badge>,

        },
        {
            name: 'Address',
            cell: (row) => (
                <div className="text-truncate" style={{ maxWidth: '250px' }}>
                    <i className="ri-map-pin-line me-1 text-muted"></i>
                    {formatAddress(row.address)}
                </div>
            ),
            grow: 2
        },
        {
            name: 'Units',
            selector: (row) => row.details?.totalUnits || 0,

        },
        {
            name: 'Floors',
            selector: (row) => row.details?.totalFloors || 0,

        },
        {
            name: 'Status',
            cell: (row) => (
                <Badge color={row.isActive ? 'success' : 'danger'} className="px-2 py-1">
                    <i className={`${row.isActive ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'} me-1`}></i>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),

        },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="d-flex gap-2">
                    <ActionIconButton
                        id={`view-building-${row._id}`}
                        icon={<RiEyeLine size={16} />}
                        tooltip="View Building"
                        onClick={() => handleViewBuilding(row._id)}
                    />
                    <ActionIconButton
                        id={`edit-building-${row._id}`}
                        icon={<RiPencilLine size={16} />}
                        tooltip="Edit Building"
                        onClick={() => handleEditBuilding(row)}
                    />
                    <ActionIconButton
                        id={`delete-building-${row._id}`}
                        icon={<RiDeleteBinLine size={16} />}
                        tooltip="Delete Building"
                        onClick={() => handleDeleteBuilding(row)}
                    />
                </div>
            ),

        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Buildings" pageTitle="Properties" />

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Buildings</p>
                                        <h4 className="mb-0">{pagination?.total || buildings.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-building-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Buildings</p>
                                        <h4 className="mb-0">{buildings.filter((item) => item.isActive).length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                <i className="ri-checkbox-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Inactive Buildings</p>
                                        <h4 className="mb-0">{buildings.filter((item) => !item.isActive).length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-2">
                                                <i className="ri-close-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Units In Page</p>
                                        <h4 className="mb-0">
                                            {buildings.reduce((acc, item) => acc + (item.details?.totalUnits || 0), 0)}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-door-open-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Filter Controls */}
                <Card className="mb-4">
                    <CardBody className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={6}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Buildings</Label>
                                    <Input
                                        type="text"
                                        placeholder="Search by name, code, or address..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Status</Label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find((opt) => opt.value === statusFilter)}
                                        onChange={(opt) => handleStatusFilter(opt?.value || 'all')}
                                        isClearable
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="primary"
                                    className="w-100 mb-3"
                                    onClick={handleResetFilters}
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Reset
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-building-line align-middle me-2"></i>
                            Buildings List
                            <Badge color="primary" className="ms-2">{pagination?.total || buildings.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreateBuilding} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Building
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={buildings}
                                pagination
                                paginationServer
                                paginationTotalRows={pagination?.total || 0}
                                paginationPerPage={pagination?.limit || 10}
                                paginationDefaultPage={currentPage}
                                onChangePage={(page) => setCurrentPage(page)}
                                responsive
                                emptyStateProps={{
                                    icon: "ri-building-line",
                                    title: "No Data Found",
                                    description: "No buildings match the current filters.",
                                    actionLabel: "Add Building",
                                    onAction: handleCreateBuilding,
                                }}
                                customStyles={{
                                    headCells: {
                                        style: {
                                            fontWeight: '600',
                                            fontSize: '0.875rem',
                                        },
                                    },
                                    cells: {
                                        style: {
                                            fontSize: '0.875rem',
                                            padding: '12px 8px',
                                        },
                                    },
                                }}
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Create/Edit Building Modal */}
                <Modal
                    isOpen={modal}
                    toggle={() => {
                        setModal(false);
                        setSelectedBuilding(null);
                        formik.resetForm();
                    }}
                    size="xl"
                    centered
                >
                    <ModalHeader toggle={() => setModal(false)} className="bg-light">
                        <i className={`ri-${selectedBuilding ? 'edit' : 'add'}-line me-2`}></i>
                        {selectedBuilding ? 'Edit Building' : 'Add New Building'}
                    </ModalHeader>
                    <Form onSubmit={formik.handleSubmit}>
                        <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Basic Information */}
                            <Card className="border mb-3">
                                <CardHeader className="bg-light py-3">
                                    <h6 className="mb-0">
                                        <i className="ri-information-line me-2 text-primary"></i>
                                        Basic Information
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <Row className="g-3 align-items-end">
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">
                                                    Building Name <span className="text-danger">*</span>
                                                </Label>
                                                <Input
                                                    name="name"
                                                    value={formik.values.name}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.name && !!formik.errors.name}
                                                    placeholder="e.g., Sunshine Apartments"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.name}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        {selectedBuilding ? (
                                            <Col md={6}>
                                                <FormGroup className="mb-0">
                                                    <Label className="form-label">
                                                        Building Code
                                                    </Label>
                                                    <Input
                                                        name="code"
                                                        value={formik.values.code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.code && !!formik.errors.code}
                                                        placeholder="e.g., BLD-001"
                                                        disabled
                                                        className="form-control-lg"
                                                    />
                                                    <FormFeedback>{formik.errors.code}</FormFeedback>
                                                </FormGroup>
                                            </Col>
                                        ) : null}
                                        <Col md={12}>
                                            <FormGroup check className="mb-0 pt-1">
                                                <Input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={formik.values.isActive}
                                                    onChange={formik.handleChange}
                                                    id="isActive"
                                                />
                                                <Label for="isActive" check>
                                                    Active Building
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            {/* Address Information */}
                            <Card className="border mb-3">
                                <CardHeader className="bg-light py-3">
                                    <h6 className="mb-0">
                                        <i className="ri-map-pin-line me-2 text-primary"></i>
                                        Address Information
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">
                                                    Street Address <span className="text-danger">*</span>
                                                </Label>
                                                <Input
                                                    name="address.street"
                                                    value={formik.values.address.street}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.address?.street && !!formik.errors.address?.street}
                                                    placeholder="Street address"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.address?.street}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">
                                                    City <span className="text-danger">*</span>
                                                </Label>
                                                <Input
                                                    name="address.city"
                                                    value={formik.values.address.city}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.address?.city && !!formik.errors.address?.city}
                                                    placeholder="City"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.address?.city}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">District</Label>
                                                <Input
                                                    name="address.district"
                                                    value={formik.values.address.district}
                                                    onChange={formik.handleChange}
                                                    placeholder="District"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Region</Label>
                                                <Input
                                                    name="address.region"
                                                    value={formik.values.address.region}
                                                    onChange={formik.handleChange}
                                                    placeholder="Region"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Country</Label>
                                                <Input
                                                    name="address.country"
                                                    value={formik.values.address.country}
                                                    onChange={formik.handleChange}
                                                    placeholder="Country"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Postal Code</Label>
                                                <Input
                                                    name="address.postalCode"
                                                    value={formik.values.address.postalCode}
                                                    onChange={formik.handleChange}
                                                    placeholder="Postal code"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            {/* Building Details */}
                            <Card className="border mb-3">
                                <CardHeader className="bg-light py-3">
                                    <h6 className="mb-0">
                                        <i className="ri-building-2-line me-2 text-primary"></i>
                                        Building Details
                                    </h6>
                                </CardHeader>
                                <CardBody>
                                    <div className="text-muted small fw-semibold text-uppercase mb-3">Capacity & Structure</div>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Total Floors</Label>
                                                <Input
                                                    type="number"
                                                    name="details.totalFloors"
                                                    value={formik.values.details.totalFloors}
                                                    onChange={formik.handleChange}
                                                    placeholder="e.g., 5"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Total Units</Label>
                                                <Input
                                                    type="number"
                                                    name="details.totalUnits"
                                                    value={formik.values.details.totalUnits}
                                                    onChange={formik.handleChange}
                                                    placeholder="e.g., 20"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Year Built</Label>
                                                <Input
                                                    type="number"
                                                    name="details.yearBuilt"
                                                    value={formik.values.details.yearBuilt}
                                                    onChange={formik.handleChange}
                                                    placeholder="e.g., 2020"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Parking Spaces</Label>
                                                <Input
                                                    type="number"
                                                    name="details.parkingSpaces"
                                                    value={formik.values.details.parkingSpaces}
                                                    onChange={formik.handleChange}
                                                    placeholder="e.g., 10"
                                                    className="form-control-lg"
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div className="text-muted small fw-semibold text-uppercase mt-4 mb-3">Auto Code Settings</div>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Unit Code Prefix</Label>
                                                <Input
                                                    name="unitCodePrefix"
                                                    value={formik.values.unitCodePrefix}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.unitCodePrefix && !!formik.errors.unitCodePrefix}
                                                    placeholder="e.g., U"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.unitCodePrefix}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Unit Code Length</Label>
                                                <Input
                                                    type="number"
                                                    name="unitCodeLength"
                                                    value={formik.values.unitCodeLength}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.unitCodeLength && !!formik.errors.unitCodeLength}
                                                    placeholder="e.g., 3"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.unitCodeLength}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Tenant Code Prefix</Label>
                                                <Input
                                                    name="tenantCodePrefix"
                                                    value={formik.values.tenantCodePrefix}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.tenantCodePrefix && !!formik.errors.tenantCodePrefix}
                                                    placeholder="e.g., T"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.tenantCodePrefix}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label">Tenant Code Length</Label>
                                                <Input
                                                    type="number"
                                                    name="tenantCodeLength"
                                                    value={formik.values.tenantCodeLength}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.tenantCodeLength && !!formik.errors.tenantCodeLength}
                                                    placeholder="e.g., 4"
                                                    className="form-control-lg"
                                                />
                                                <FormFeedback>{formik.errors.tenantCodeLength}</FormFeedback>
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div className="text-muted small fw-semibold text-uppercase mt-4 mb-3">Amenities</div>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup className="mb-0">
                                                <Label className="form-label d-block">Amenities</Label>
                                                <div className="d-flex gap-3 flex-wrap">
                                                    <FormGroup check inline>
                                                        <Input
                                                            type="checkbox"
                                                            name="details.hasGenerator"
                                                            checked={formik.values.details.hasGenerator}
                                                            onChange={formik.handleChange}
                                                            id="hasGenerator"
                                                        />
                                                        <Label for="hasGenerator" check>Generator</Label>
                                                    </FormGroup>
                                                    <FormGroup check inline>
                                                        <Input
                                                            type="checkbox"
                                                            name="details.hasWaterTank"
                                                            checked={formik.values.details.hasWaterTank}
                                                            onChange={formik.handleChange}
                                                            id="hasWaterTank"
                                                        />
                                                        <Label for="hasWaterTank" check>Water Tank</Label>
                                                    </FormGroup>
                                                    <FormGroup check inline>
                                                        <Input
                                                            type="checkbox"
                                                            name="details.hasSecurity"
                                                            checked={formik.values.details.hasSecurity}
                                                            onChange={formik.handleChange}
                                                            id="hasSecurity"
                                                        />
                                                        <Label for="hasSecurity" check>Security</Label>
                                                    </FormGroup>
                                                </div>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </ModalBody>
                        <ModalFooter className="bg-light">
                            <Button color="light" onClick={() => setModal(false)} className="me-2">
                                <i className="ri-close-line me-1"></i>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                type="submit"
                                disabled={formik.isSubmitting}
                                className="px-4"
                            >
                                {formik.isSubmitting ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-save-line me-1"></i>
                                        {selectedBuilding ? 'Update Building' : 'Create Building'}
                                    </>
                                )}
                            </Button>
                        </ModalFooter>
                    </Form>
                </Modal>

                {/* View Building Modal */}
                <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" centered>
                    <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                        <i className="ri-building-line me-2"></i>
                        Building Details
                    </ModalHeader>
                    <ModalBody>
                        {building && (
                            <>
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="avatar-xl mx-auto mb-3">
                                        <div className="avatar-title bg-light rounded-circle">
                                            <i className="ri-building-line" style={{ fontSize: '48px', color: 'var(--vz-secondary-color)' }} />
                                        </div>
                                    </div>
                                    <h4 className="mb-1">{building.name}</h4>
                                    <p className="text-muted mb-2">
                                        Code: <Badge color="primary">{building.code}</Badge>
                                    </p>
                                    <Badge
                                        color={building.isActive ? 'success' : 'danger'}
                                        className="px-3 py-2"
                                    >
                                        <i className={`${building.isActive ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'} me-1`}></i>
                                        {building.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                {/* Stats Cards */}
                                {buildingStats && (
                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <Card className="bg-light border-0">
                                                <CardBody className="text-center">
                                                    <h3 className="mb-1">{buildingStats.totalUnits}</h3>
                                                    <p className="text-muted mb-0">Total Units</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-success bg-opacity-10 border-0">
                                                <CardBody className="text-center">
                                                    <h3 className="mb-1 text-success">{buildingStats.occupiedUnits}</h3>
                                                    <p className="text-muted mb-0">Occupied</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-warning bg-opacity-10 border-0">
                                                <CardBody className="text-center">
                                                    <h3 className="mb-1 text-warning">{buildingStats.vacantUnits}</h3>
                                                    <p className="text-muted mb-0">Vacant</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-info bg-opacity-10 border-0">
                                                <CardBody className="text-center">
                                                    <h3 className="mb-1 text-info">{buildingStats.occupancyRate}%</h3>
                                                    <p className="text-muted mb-0">Occupancy</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                )}

                                {/* Details Tabs */}
                                <Nav tabs className="mb-3">
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '1' })}
                                            onClick={() => setActiveTab('1')}
                                        >
                                            <i className="ri-information-line me-1"></i>
                                            Details
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={classnames({ active: activeTab === '2' })}
                                            onClick={() => setActiveTab('2')}
                                        >
                                            <i className="ri-door-line me-1"></i>
                                            Units ({buildingUnits?.length || 0})
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                {/* Tab Content */}
                                <div className="tab-content">
                                    {/* Details Tab */}
                                    {activeTab === '1' && (
                                        <div>
                                            <Row>
                                                <Col md={6}>
                                                    <h6 className="fw-semibold mb-3">Address</h6>
                                                    <p className="mb-2">
                                                        <i className="ri-map-pin-line me-2 text-muted"></i>
                                                        {formatAddress(building.address)}
                                                    </p>
                                                </Col>
                                                <Col md={6}>
                                                    <h6 className="fw-semibold mb-3">Building Info</h6>
                                                    <p className="mb-2">
                                                        <i className="ri-stack-line me-2 text-muted"></i>
                                                        Floors: {building.details?.totalFloors || 'N/A'}
                                                    </p>
                                                    <p className="mb-2">
                                                        <i className="ri-car-line me-2 text-muted"></i>
                                                        Parking: {building.details?.parkingSpaces || 0} spaces
                                                    </p>
                                                    <p className="mb-2">
                                                        <i className="ri-calendar-line me-2 text-muted"></i>
                                                        Year Built: {building.details?.yearBuilt || 'N/A'}
                                                    </p>
                                                    <p className="mb-2">
                                                        <i className="ri-hashtag me-2 text-muted"></i>
                                                        Unit Code: {(building.unitCodePrefix || 'N/A')} / length {building.unitCodeLength || 'N/A'}
                                                    </p>
                                                    <p className="mb-2">
                                                        <i className="ri-user-settings-line me-2 text-muted"></i>
                                                        Tenant Code: {(building.tenantCodePrefix || 'N/A')} / length {building.tenantCodeLength || 'N/A'}
                                                    </p>
                                                </Col>
                                            </Row>
                                            <Row className="mt-3">
                                                <Col md={12}>
                                                    <h6 className="fw-semibold mb-3">Amenities</h6>
                                                    <div className="d-flex gap-2">
                                                        {building.details?.hasGenerator && (
                                                            <Badge color="primary" className="px-3 py-2">
                                                                <i className="ri-flashlight-line me-1"></i>
                                                                Generator
                                                            </Badge>
                                                        )}
                                                        {building.details?.hasWaterTank && (
                                                            <Badge color="primary" className="px-3 py-2">
                                                                <i className="ri-water-flash-line me-1"></i>
                                                                Water Tank
                                                            </Badge>
                                                        )}
                                                        {building.details?.hasSecurity && (
                                                            <Badge color="primary" className="px-3 py-2">
                                                                <i className="ri-shield-check-line me-1"></i>
                                                                Security
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}

                                    {/* Units Tab */}
                                    {activeTab === '2' && (
                                        <div className="table-responsive">
                                            <Table className="table-nowrap">
                                                <thead>
                                                    <tr>
                                                        <th>Unit #</th>
                                                        <th>Floor</th>
                                                        <th>Type</th>
                                                        <th>Status</th>
                                                        <th>Rent</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {buildingUnits && buildingUnits.length > 0 ? (
                                                        buildingUnits.map((unit) => (
                                                            <tr key={unit._id}>
                                                                <td>
                                                                    <span className="fw-medium">{unit.unitNumber}</span>
                                                                </td>
                                                                <td>Floor {unit.floor}</td>
                                                                <td>{unit.type}</td>
                                                                <td>
                                                                    <Badge
                                                                        color={unitStatusBadges[unit.status]?.color || 'secondary'}
                                                                        className="px-2 py-1"
                                                                    >
                                                                        <i className={`${unitStatusBadges[unit.status]?.icon} me-1`}></i>
                                                                        {unit.status.replace('_', ' ')}
                                                                    </Badge>
                                                                </td>
                                                                <td>${unit.rentAmount?.toLocaleString()}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="text-center py-4">
                                                                <p className="text-muted mb-0">No units found in this building</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button color="light" onClick={() => setViewModal(false)}>
                            <i className="ri-close-line me-1"></i>
                            Close
                        </Button>
                        <Button
                            color="primary"
                            onClick={() => {
                                setViewModal(false);
                                handleEditBuilding(building);
                            }}
                        >
                            <i className="ri-edit-line me-1"></i>
                            Edit Building
                        </Button>
                    </ModalFooter>
                </Modal>

                <DeleteModal
                    show={deleteModal}
                    onDeleteClick={confirmDelete}
                    onCloseClick={() => setDeleteModal(false)}
                    confirmationText={
                        selectedBuilding
                            ? `Are you sure you want to delete "${selectedBuilding.name}"? This action cannot be undone and all associated data will be permanently removed.`
                            : ""
                    }
                />

                <ToastContainer />
            </Container>
        </div>
    );
};

export default Buildings;
