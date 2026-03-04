import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback, Alert
} from "reactstrap";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Import FilePond for file uploads
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

//redux
import {
    getSurplusPackages as onGetSurplusPackagesData,
    createOrUpdateSurplusPackage as onCreateOrUpdateSurplusPackage,
    deleteSurplusPackage as onDeleteSurplusPackage,
    activateSurplusPackage as onActivateSurplusPackage,
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";
import useAuthUser from '../../../Components/Hooks/useAuthUser';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const SurplusPackages = () => {
    document.title = "Surplus Packages | apartment";

    const dispatch = useDispatch();

    const selectPackagesData = createSelector(
        (state) => state.ContentManagement,
        (packagesData) => packagesData.packagesData
    );

    const packagesData = useSelector(selectPackagesData);
    const [packagesList, setPackagesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [file, setFile] = useState(null);

    // Static business ID (replace with your actual static business ID)
    const userAuth = useAuthUser();
    const businessId = userAuth.businessId;
    // console.log("businessId", businessId)
    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        businessId: ''
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];

    // Yup Validation Schema
    const validationSchema = Yup.object({
        businessId: Yup.string().required("Business is required"),
        // packageImg: Yup.mixed()
        //     .test('file-or-url', 'Package image is required', function (value) {
        //         // Allow if it's a file or if it's a non-empty string (URL)
        //         if (this.parent.file || (typeof value === 'string' && value.trim() !== '')) {
        //             return true;
        //         }
        //         return false;
        //     }),
        title: Yup.string()
            .required("Title is required")
            .min(3, "Title must be at least 3 characters")
            .max(100, "Title must not exceed 100 characters"),
        description: Yup.string()
            .required("Description is required")
            .min(10, "Description must be at least 10 characters")
            .max(500, "Description must not exceed 500 characters"),
        originalPrice: Yup.number()
            .required("Original price is required")
            .min(0, "Original price must be greater than or equal to 0")
            .test('is-decimal', 'Original price must have up to 2 decimal places',
                value => !value || /^\d+(\.\d{1,2})?$/.test(value)),
        offerPrice: Yup.number()
            .required("Offer price is required")
            .min(0, "Offer price must be greater than or equal to 0")
            .test('is-decimal', 'Offer price must have up to 2 decimal places',
                value => !value || /^\d+(\.\d{1,2})?$/.test(value))
            .test('less-than-original', 'Offer price must be less than original price',
                function (value) {
                    const { originalPrice } = this.parent;
                    return !originalPrice || !value || value < originalPrice;
                }),
        quantityAvailable: Yup.number()
            .required("Quantity available is required")
            .min(1, "Quantity must be at least 1")
            .integer("Quantity must be a whole number"),
        pickupStart: Yup.string()
            .required("Pickup start time is required")
            .test('future-date', 'Pickup start must be in the future', function (value) {
                if (!value) return false;
                return new Date(value) > new Date();
            }),
        pickupEnd: Yup.string()
            .required("Pickup end time is required")
            .test('after-start', 'Pickup end must be after pickup start', function (value) {
                const { pickupStart } = this.parent;
                if (!pickupStart || !value) return false;
                return new Date(value) > new Date(pickupStart);
            }),
        pickupInstructions: Yup.string()
            .required("Pickup instructions are required")
            .min(10, "Pickup instructions must be at least 10 characters")
            .max(500, "Pickup instructions must not exceed 500 characters"),
        isActive: Yup.boolean()
    });

    // Fetch packages with filters
    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetSurplusPackagesData(businessId));
        } catch (error) {
            console.error("Error loading packages:", error);

        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Update data when changes
    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    useEffect(() => {
        setPackagesList(packagesData || []);
    }, [packagesData]);


    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [name]: selectedOption?.value || ""
        }));
    };

    // Filter packages based on filters
    const filteredPackages = packagesList.filter(pkg => {
        return (
            (filters.search === '' ||
                pkg.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? pkg.isActive : !pkg.isActive)) &&
            (filters.businessId === '' || pkg.businessId === filters.businessId)
        );
    });

    // Open modal for view details
    const handleView = (pkg) => {
        setSelectedPackage(pkg);
        setViewModal(true);
    };

    // Open modal for edit
    const handleEdit = (pkg) => {
        setSelectedPackage(pkg);
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedPackage(null);
        setIsEdit(false);
        setModal(true);
        setFile(null);
    };

    // Close modal and reset form
    const handleCloseModal = () => {
        setModal(false);
        setFile(null);
    };

    // Delete Package
    const onClickDelete = (pkg) => {
        setSelectedPackage(pkg);
        setDeleteModal(true);
    };

    const handleDeletePackage = () => {
        if (selectedPackage) {
            dispatch(onDeleteSurplusPackage(selectedPackage._id));
            setDeleteModal(false);
        }
    };

    // Activate Package
    const handleActivatePackage = (pkg) => {
        dispatch(onActivateSurplusPackage(pkg._id));
    };

    // formats JS Date for <input type="datetime-local">
    const formatForDateTimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        // adjust for timezone offset so it shows correctly in local time
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    }

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            businessId: businessId,
            packageImg: typeof selectedPackage?.packageImg === "string" ? selectedPackage.packageImg : "",
            title: selectedPackage?.title || "",
            description: selectedPackage?.description || "",
            originalPrice: selectedPackage?.originalPrice || "",
            offerPrice: selectedPackage?.offerPrice || "",
            quantityAvailable: selectedPackage?.quantityAvailable || "",
            pickupStart: selectedPackage?.pickupStart ? formatForDateTimeLocal(selectedPackage.pickupStart) : "",
            pickupEnd: selectedPackage?.pickupEnd ? formatForDateTimeLocal(selectedPackage.pickupEnd) : "",
            pickupInstructions: selectedPackage?.pickupInstructions || "",
            isActive: selectedPackage?.isActive ?? true
        },
        validationSchema: validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setSubmitting(true);
                const formData = new FormData();

                // Handle image file
                if (file) {
                    formData.append("packageImg", file);
                } else if (typeof values.packageImg === "string" && values.packageImg.trim() !== "") {
                    formData.append("packageImg", values.packageImg);
                }

                // Append the rest of the fields
                Object.keys(values).forEach((key) => {
                    if (key !== "packageImg") {
                        formData.append(key, values[key]);
                    }
                });

                if (isEdit) {
                    formData.append("_id", selectedPackage ? selectedPackage._id : "");
                    formData.append("updatedBy", userAuth.staffId ? userAuth.username : "");
                } else {
                    formData.append("createdBy", userAuth.staffId ? userAuth.username : "");
                }

                await dispatch(onCreateOrUpdateSurplusPackage(formData));
                setModal(false);
                setFile(null);
                resetForm();

            } catch (err) {
                console.error("Form submit error:", err);
            } finally {
                setSubmitting(false);
            }
        }
    });

    // Format date with time for display
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate discount percentage
    const calculateDiscount = (original, offer) => {
        if (!original || !offer) return 0;
        return Math.round(((original - offer) / original) * 100);
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,

        },
        {
            name: 'Image',
            cell: row => (
                <div className="d-flex align-items-center">
                    {row.packageImg ? (
                        <img
                            src={row.packageImg}
                            alt={row.title}
                            style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '2px solid #f8f9fa'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            border: '2px dashed #dee2e6'
                        }}>
                            <i className="ri-image-line" style={{ fontSize: '18px', color: '#6c757d' }}></i>
                        </div>
                    )}
                </div>
            ),

        },
        {
            name: 'Package Details',
            cell: row => (
                <div>
                    <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                        {row.title}
                    </div>
                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                        {row.description}
                    </small>
                </div>
            ),
            grow: 2, // allow it to grow a bit more
            wrap: true,
            // minWidth: '250px'

        },

        {
            name: 'Pricing',
            cell: row => (
                <div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-decoration-line-through text-muted small">
                            ${parseFloat(row.originalPrice).toFixed(2)}
                        </span>
                        <span className="text-success fw-bold fs-6">
                            ${parseFloat(row.offerPrice).toFixed(2)}
                        </span>
                    </div>
                    <Badge color="warning" className="mt-1">
                        {calculateDiscount(row.originalPrice, row.offerPrice)}% OFF
                    </Badge>
                </div>
            ),

        },
        {
            name: 'Qty',
            selector: row => row.quantityAvailable,

            center: true
        },
        {
            name: 'Pickup Window',
            cell: row => (
                <div className="small">
                    <div className="fw-medium">{formatDateTime(row.pickupStart)}</div>
                    <div className="text-muted">to {formatDateTime(row.pickupEnd)}</div>
                </div>
            ),

        },
        {
            name: 'Status',
            cell: row => (
                <Badge
                    color={row.isActive ? 'success' : 'danger'}
                    className="px-3 py-2"
                    style={{
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                    }}
                >
                    <i className={`ri-${row.isActive ? 'check' : 'close'}-circle-fill me-1`}></i>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),

            center: true
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        color="outline-info"
                        size="sm"
                        onClick={() => handleView(row)}
                        className="btn-icon"
                    >
                        <i className="ri-eye-line" />
                    </Button>
                    <Button
                        color="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(row)}
                        className="btn-icon"
                    >
                        <i className="ri-pencil-line" />
                    </Button>
                    {/* <Button
                        color={row.isActive ? "outline-warning" : "outline-success"}
                        size="sm"
                        onClick={() => handleActivatePackage(row)}
                        className="btn-icon"
                        title={row.isActive ? 'Deactivate' : 'Activate'}
                    >
                        <i className={`ri-${row.isActive ? 'pause' : 'play'}-circle-line`} />
                    </Button> */}
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => onClickDelete(row)}
                        className="btn-icon"
                    >
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),

        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Packages" pageTitle="Content" />

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Packages</p>
                                        <h4 className="mb-0">{packagesList.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-box-3-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Packages</p>
                                        <h4 className="mb-0">{packagesList.filter(pkg => pkg.isActive).length}</h4>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Low Stock</p>
                                        <h4 className="mb-0">{packagesList.filter(pkg => pkg.quantityAvailable < 5).length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                <i className="ri-alert-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Out of Stock</p>
                                        <h4 className="mb-0">{packagesList.filter(pkg => pkg.quantityAvailable === 0).length}</h4>
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
                </Row>

                {/* Filter Controls */}
                <Card className="mb-4">
                    <CardBody className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={6}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Packages</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by title or description..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Status</Label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(opt => opt.value === filters.status)}
                                        onChange={(opt) => handleSelectFilterChange('status', opt)}
                                        isClearable
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={2} >
                                <Button
                                    color="primary"
                                    className="w-100 mb-3"
                                    onClick={() => setFilters({
                                        search: '',
                                        status: '',
                                        businessId: ''
                                    })}
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
                            <i className="ri-box-3-line align-middle me-2"></i>
                            Surplus Packages List
                            <Badge color="primary" className="ms-2">{filteredPackages.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Package
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredPackages}
                                pagination
                                // highlightOnHover
                                responsive
                                // striped
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No packages found</h5>
                                        <p className="text-muted">Try adjusting your search criteria or add a new package.</p>
                                    </div>
                                }
                                customStyles={{
                                    headCells: {
                                        style: {
                                            // backgroundColor: '#f8f9fa',
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
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={handleCloseModal} size="xl" centered>
                <ModalHeader toggle={handleCloseModal} className="bg-light">
                    <i className={`ri-${isEdit ? 'pencil' : 'add'}-line me-2`}></i>
                    {isEdit ? 'Edit Surplus Package' : 'Create New Surplus Package'}
                </ModalHeader>
                <Form onSubmit={validation.handleSubmit}>
                    <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <Row>
                            <Col lg={6}>
                                <Card className="border">
                                    <CardHeader className="bg-light">
                                        <h6 className="mb-0">Package Information</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Package Image <span className="text-danger">*</span>
                                            </Label>
                                            <FilePond
                                                files={file ? [file] : []}
                                                onupdatefiles={(fileItems) => {
                                                    setFile(fileItems.length > 0 ? fileItems[0].file : null);
                                                }}
                                                allowMultiple={false}
                                                allowPaste={true}
                                                name="packageImg"
                                                labelIdle='<div class="text-center"><i class="ri-upload-cloud-2-line display-4 text-muted"></i><p class="mt-2">Drag & Drop your image or <span class="filepond--label-action">Browse</span></p></div>'
                                                acceptedFileTypes={['image/*']}
                                                maxFileSize="5MB"
                                                className="filepond-border"
                                            />
                                            {validation.touched.packageImg && validation.errors.packageImg && (
                                                <div className="text-danger small mt-1">{validation.errors.packageImg}</div>
                                            )}
                                            {validation.values.packageImg && !file && (
                                                <div className="mt-2">
                                                    <small className="text-muted">Current image:</small>
                                                    <div className="mt-1">
                                                        <img
                                                            src={validation.values.packageImg}
                                                            alt="Current"
                                                            className="img-thumbnail"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </FormGroup>

                                        <FormGroup>
                                            <Label className="form-label">
                                                Title <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                name="title"
                                                value={validation.values.title}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.title && !!validation.errors.title}
                                                placeholder="Enter package title"
                                                className="form-control-lg"
                                            />
                                            <FormFeedback>{validation.errors.title}</FormFeedback>
                                        </FormGroup>

                                        <FormGroup>
                                            <Label className="form-label">
                                                Description <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                name="description"
                                                rows="3"
                                                value={validation.values.description}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.description && !!validation.errors.description}
                                                placeholder="Describe the package contents and details"
                                                className="form-control-lg"
                                            />
                                            <FormFeedback>{validation.errors.description}</FormFeedback>
                                            <div className="text-end">
                                                <small className={`text-${validation.values.description.length > 500 ? 'danger' : 'muted'}`}>
                                                    {validation.values.description.length}/500
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col lg={6}>
                                <Card className="border">
                                    <CardHeader className="bg-light">
                                        <h6 className="mb-0">Pricing & Availability</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Original Price ($) <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        name="originalPrice"
                                                        min="0"
                                                        step="0.01"
                                                        value={validation.values.originalPrice}
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        invalid={validation.touched.originalPrice && !!validation.errors.originalPrice}
                                                        placeholder="0.00"
                                                        className="form-control-lg"
                                                    />
                                                    <FormFeedback>{validation.errors.originalPrice}</FormFeedback>
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Offer Price ($) <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        name="offerPrice"
                                                        min="0"
                                                        step="0.01"
                                                        value={validation.values.offerPrice}
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        invalid={validation.touched.offerPrice && !!validation.errors.offerPrice}
                                                        placeholder="0.00"
                                                        className="form-control-lg"
                                                    />
                                                    <FormFeedback>{validation.errors.offerPrice}</FormFeedback>
                                                    {validation.values.originalPrice && validation.values.offerPrice && (
                                                        <div className="mt-1">
                                                            <Badge color="success">
                                                                {calculateDiscount(
                                                                    parseFloat(validation.values.originalPrice),
                                                                    parseFloat(validation.values.offerPrice)
                                                                )}% OFF
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <FormGroup>
                                            <Label className="form-label">
                                                Quantity Available <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                name="quantityAvailable"
                                                min="0"
                                                value={validation.values.quantityAvailable}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.quantityAvailable && !!validation.errors.quantityAvailable}
                                                placeholder="Enter available quantity"
                                                className="form-control-lg"
                                            />
                                            <FormFeedback>{validation.errors.quantityAvailable}</FormFeedback>
                                        </FormGroup>
                                    </CardBody>
                                </Card>

                                <Card className="border mt-3">
                                    <CardHeader className="bg-light">
                                        <h6 className="mb-0">Pickup Details</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <Row>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Pickup Start <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        type="datetime-local"
                                                        name="pickupStart"
                                                        value={validation.values.pickupStart}
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        invalid={validation.touched.pickupStart && !!validation.errors.pickupStart}
                                                        className="form-control-lg"
                                                    />
                                                    <FormFeedback>{validation.errors.pickupStart}</FormFeedback>
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Pickup End <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        type="datetime-local"
                                                        name="pickupEnd"
                                                        value={validation.values.pickupEnd}
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        invalid={validation.touched.pickupEnd && !!validation.errors.pickupEnd}
                                                        className="form-control-lg"
                                                    />
                                                    <FormFeedback>{validation.errors.pickupEnd}</FormFeedback>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <FormGroup>
                                            <Label className="form-label">
                                                Pickup Instructions <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                name="pickupInstructions"
                                                rows="3"
                                                value={validation.values.pickupInstructions}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                invalid={validation.touched.pickupInstructions && !!validation.errors.pickupInstructions}
                                                placeholder="Provide detailed pickup instructions for customers..."
                                                className="form-control-lg"
                                            />
                                            <FormFeedback>{validation.errors.pickupInstructions}</FormFeedback>
                                            <div className="text-end">
                                                <small className={`text-${validation.values.pickupInstructions.length > 500 ? 'danger' : 'muted'}`}>
                                                    {validation.values.pickupInstructions.length}/500
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </CardBody>
                                </Card>

                                <FormGroup check className="mt-3">
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={validation.values.isActive}
                                        onChange={validation.handleChange}
                                        id="isActive"
                                    />
                                    <Label for="isActive" check className="fw-medium">
                                        <i className="ri-checkbox-circle-line me-1"></i>
                                        Activate this package immediately
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button color="light" onClick={handleCloseModal} className="me-2">
                            <i className="ri-close-line me-1"></i>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            disabled={validation.isSubmitting}
                            className="px-4"
                        >
                            {validation.isSubmitting ? (
                                <>
                                    <i className="ri-loader-4-line spin me-1"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="ri-save-line me-1"></i>
                                    {isEdit ? 'Update Package' : 'Create Package'}
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-eye-line me-2"></i>
                    Package Details
                </ModalHeader>
                <ModalBody>
                    {selectedPackage && (
                        <Row>
                            <Col md={4} className="mb-3">
                                {selectedPackage.packageImg ? (
                                    <img
                                        src={selectedPackage.packageImg}
                                        alt={selectedPackage.title}
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            border: '3px solid #f8f9fa'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        backgroundColor: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '12px',
                                        border: '3px dashed #dee2e6'
                                    }}>
                                        <i className="ri-image-line" style={{ fontSize: '48px', color: '#6c757d' }}></i>
                                    </div>
                                )}
                            </Col>
                            <Col md={8}>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h4 className="mb-0">{selectedPackage.title}</h4>
                                    <Badge color={selectedPackage.isActive ? 'success' : 'danger'} className="px-3 py-2">
                                        {selectedPackage.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <p className="text-muted mb-4">{selectedPackage.description}</p>

                                <Row className="gy-3">
                                    <Col sm={6}>
                                        <div className="border rounded p-3 bg-light">
                                            <small className="text-muted d-block">Original Price</small>
                                            <span className="text-decoration-line-through h5 text-muted">
                                                ${parseFloat(selectedPackage.originalPrice).toFixed(2)}
                                            </span>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="border rounded p-3 bg-success bg-opacity-10">
                                            <small className="text-muted d-block">Offer Price</small>
                                            <span className="h5 text-success fw-bold">
                                                ${parseFloat(selectedPackage.offerPrice).toFixed(2)}
                                            </span>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className="border rounded p-3 bg-info bg-opacity-10">
                                            <small className="text-muted d-block">Discount</small>
                                            <span className="h6 text-info fw-bold">
                                                {calculateDiscount(selectedPackage.originalPrice, selectedPackage.offerPrice)}% OFF
                                            </span>
                                        </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div className={`border rounded p-3 ${selectedPackage.quantityAvailable === 0 ? 'bg-danger bg-opacity-10' :
                                            selectedPackage.quantityAvailable < 5 ? 'bg-warning bg-opacity-10' : 'bg-light'
                                            }`}>
                                            <small className="text-muted d-block">Quantity Available</small>
                                            <span className={`h5 ${selectedPackage.quantityAvailable === 0 ? 'text-danger' :
                                                selectedPackage.quantityAvailable < 5 ? 'text-warning' : 'text-dark'
                                                } fw-bold`}>
                                                {selectedPackage.quantityAvailable}
                                            </span>
                                        </div>
                                    </Col>
                                </Row>

                                <hr className="my-4" />

                                <h6 className="mb-3">
                                    <i className="ri-time-line me-2"></i>
                                    Pickup Schedule
                                </h6>
                                <Row className="mb-4">
                                    <Col sm={6}>
                                        <strong>Start:</strong>
                                        <div className="text-muted">{formatDateTime(selectedPackage.pickupStart)}</div>
                                    </Col>
                                    <Col sm={6}>
                                        <strong>End:</strong>
                                        <div className="text-muted">{formatDateTime(selectedPackage.pickupEnd)}</div>
                                    </Col>
                                </Row>

                                {selectedPackage.pickupInstructions && (
                                    <>
                                        <h6 className="mb-3">
                                            <i className="ri-information-line me-2"></i>
                                            Pickup Instructions
                                        </h6>
                                        <div className="border rounded p-3 bg-light">
                                            {selectedPackage.pickupInstructions}
                                        </div>
                                    </>
                                )}

                                <hr className="my-4" />

                                <Row>
                                    {/* <Col sm={6}>
                                        <strong>Business:</strong>
                                        <div className="text-muted">{selectedPackage.businessId?.businessName || 'N/A'}</div>
                                    </Col> */}
                                    <Col sm={6}>
                                        <strong>Total Orders:</strong>
                                        <div className="text-muted">{selectedPackage.totalOrders || 0}</div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={() => setViewModal(false)}>
                        <i className="ri-close-line me-1"></i>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeletePackage}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedPackage ?
                        `Are you sure you want to delete "${selectedPackage.title}"? This action cannot be undone and all associated data will be permanently removed.`
                        : ""
                }
            />

            <ToastContainer />
        </div>
    );
};

export default SurplusPackages;
