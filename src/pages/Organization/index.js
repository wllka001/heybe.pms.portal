import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardHeader, CardBody,
  Col, Container, Row,
  Form, Input, Label, FormGroup,
  Modal, ModalBody, ModalFooter, ModalHeader,
  Button, Badge, FormFeedback, Alert, Nav, NavItem, NavLink,
  TabContent, TabPane, Progress
} from "reactstrap";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Loader from "../../Components/Common/Loader";
import { BuildingsAPI, TenantsAPI } from "../../helpers/backend_helper";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import classnames from 'classnames';

// Import FilePond for file uploads
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

//redux
import {
  getOrganization as onGetOrganization,
  createOrUpdateOrganization as onCreateOrUpdateOrganization,
} from "../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";
import useAuthUser from '../../Components/Hooks/useAuthUser';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

// Theme palette from shared SCSS variables
const colors = {
  primary: 'var(--vz-primary)',
  primaryRgb: 'var(--vz-primary-rgb)',
  secondary: 'var(--vz-secondary)',
  tertiary: 'var(--vz-tertiary)',
  success: 'var(--vz-success)',
  danger: 'var(--vz-danger)',
  warning: 'var(--vz-warning)',
  light: 'var(--vz-light)',
  dark: 'var(--vz-heading-color)',
  border: 'var(--vz-border-color)',
  text: 'var(--vz-body-color)',
  textLight: 'var(--vz-secondary-color)',
  background: 'var(--vz-body-bg)',
  surface: 'var(--vz-secondary-bg)',
  subtle: 'var(--vz-light-bg-subtle)',
  primarySubtle: 'rgba(var(--vz-primary-rgb), 0.08)',
  secondarySubtle: 'rgba(var(--vz-secondary-rgb), 0.08)'
};

// Styled components using CSS-in-JS
const styles = {
  card: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: 'var(--vz-box-shadow-lg)',
    overflow: 'hidden'
  },
  cardHeader: {
    background: 'linear-gradient(135deg, var(--vz-primary) 0%, var(--vz-secondary) 100%)',
    padding: '24px 28px',
    border: 'none'
  },
  cardTitle: {
    color: 'var(--vz-white)',
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.01em'
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: '0.95rem',
    marginTop: '8px',
    fontWeight: 400
  },
  statsCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '20px',
    boxShadow: 'var(--vz-box-shadow-sm)',
    border: `1px solid ${colors.border}`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--vz-box-shadow-lg)'
    }
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: colors.primary,
    lineHeight: 1.2,
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: colors.textLight,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoCard: {
    background: colors.surface,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.border}`,
    marginBottom: '20px'
  },
  infoLabel: {
    fontSize: '0.8rem',
    color: colors.textLight,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  infoValue: {
    fontSize: '1rem',
    color: colors.dark,
    fontWeight: 500,
    marginBottom: 0
  },
  badge: {
    padding: '8px 16px',
    borderRadius: '30px',
    fontWeight: 500,
    fontSize: '0.85rem'
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    border: '4px solid var(--vz-secondary-bg)',
    boxShadow: 'var(--vz-box-shadow-lg)',
    objectFit: 'cover',
    background: colors.surface
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    background: 'linear-gradient(135deg, var(--vz-primary) 0%, var(--vz-secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--vz-white)',
    fontSize: '3rem',
    fontWeight: 600,
    boxShadow: 'var(--vz-box-shadow-lg)'
  },
  nav: {
    borderBottom: `2px solid ${colors.border}`,
    marginBottom: '24px'
  },
  navLink: {
    padding: '12px 20px',
    color: colors.textLight,
    fontWeight: 500,
    fontSize: '0.95rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    ':after': {
      content: '""',
      position: 'absolute',
      bottom: '-2px',
      left: 0,
      right: 0,
      height: '2px',
      background: colors.primary,
      transform: 'scaleX(0)',
      transition: 'transform 0.2s ease'
    },
    ':hover': {
      color: colors.primary,
      background: 'transparent'
    }
  },
  navLinkActive: {
    color: colors.primary,
    fontWeight: 600,
    ':after': {
      transform: 'scaleX(1)'
    }
  },
  progressBar: {
    height: '8px',
    borderRadius: '4px',
    background: colors.subtle,
    marginTop: '12px'
  },
  progressFill: {
    background: 'linear-gradient(90deg, var(--vz-primary) 0%, var(--vz-secondary) 100%)',
    borderRadius: '4px',
    height: '100%',
    transition: 'width 0.3s ease'
  },
  modal: {
    borderRadius: '24px',
    overflow: 'hidden'
  },
  modalHeader: {
    background: colors.background,
    borderBottom: `2px solid ${colors.border}`,
    padding: '24px 28px'
  },
  modalTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: colors.dark
  },
  modalBody: {
    padding: '28px',
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  modalFooter: {
    background: colors.background,
    borderTop: `2px solid ${colors.border}`,
    padding: '20px 28px'
  },
  input: {
    borderRadius: '12px',
    border: `2px solid ${colors.border}`,
    padding: '10px 16px',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px rgba(${colors.primaryRgb}, 0.15)`,
      outline: 'none'
    }
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: colors.dark,
    marginBottom: '8px',
    letterSpacing: '0.3px'
  },
  button: {
    borderRadius: '12px',
    padding: '12px 24px',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    border: 'none'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, var(--vz-primary) 0%, var(--vz-secondary) 100%)',
    color: 'var(--vz-white)',
    boxShadow: '0 4px 15px rgba(var(--vz-primary-rgb), 0.25)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(var(--vz-primary-rgb), 0.35)'
    }
  },
  secondaryButton: {
    background: colors.surface,
    color: colors.text,
    border: `2px solid ${colors.border}`,
    ':hover': {
      background: colors.subtle,
      borderColor: colors.textLight
    }
  }
};

const Organization = () => {
  document.title = "Organization Profile | Apartment";

  const dispatch = useDispatch();
  const userAuth = useAuthUser();
  const businessId = userAuth.businessId;

  // Redux Selector
  const selectOrganizationData = createSelector(
    (state) => state.Organization,
    (organizationData) => organizationData.organizationData
  );

  const organizationData = useSelector(selectOrganizationData);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [logoFile, setLogoFile] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [entityCounts, setEntityCounts] = useState({ properties: 0, tenants: 0 });


  // Fetch organization data
  const fetchOrganization = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(onGetOrganization(businessId));
    } catch (error) {
      console.error("Error loading organization:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, businessId]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  useEffect(() => {
    const fetchEntityCounts = async () => {
      try {
        const [buildingsRes, tenantsRes] = await Promise.all([
          BuildingsAPI.list({ page: 1, limit: 1 }),
          TenantsAPI.list({ page: 1, limit: 1 }),
        ]);

        setEntityCounts({
          properties: buildingsRes?.data?.meta?.total || 0,
          tenants: tenantsRes?.data?.meta?.total || 0,
        });
      } catch (_error) {
        setEntityCounts({ properties: 0, tenants: 0 });
      }
    };

    fetchEntityCounts();
  }, []);

  useEffect(() => {
    if (organizationData && organizationData.length > 0) {
      setOrganization(organizationData[0]);
    }
  }, [organizationData]);

  // Calculate profile completion
  useEffect(() => {
    if (organization) {
      let completed = 0;
      const total = 10;

      if (organization.name) completed++;
      if (organization.registrationNumber) completed++;
      if (organization.taxNumber) completed++;
      if (organization.address?.street) completed++;
      if (organization.address?.city) completed++;
      if (organization.contact?.primaryEmail) completed++;
      if (organization.contact?.primaryPhone) completed++;
      if (organization.settings?.baseCurrency) completed++;
      if (organization.settings?.vatRate !== undefined) completed++;
      if (organization.settings?.rentDueDay) completed++;

      setCompletionPercentage(Math.round((completed / total) * 100));
    }
  }, [organization]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not updated yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Yup Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Organization name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    registrationNumber: Yup.string()
      .max(50, "Registration number must not exceed 50 characters"),
    taxNumber: Yup.string()
      .max(50, "Tax number must not exceed 50 characters"),

    // Address fields
    'address.street': Yup.string()
      .required("Street address is required")
      .max(200, "Street must not exceed 200 characters"),
    'address.district': Yup.string()
      .required("District is required")
      .max(100, "District must not exceed 100 characters"),
    'address.city': Yup.string()
      .required("City is required")
      .max(100, "City must not exceed 100 characters"),
    'address.region': Yup.string()
      .max(100, "Region must not exceed 100 characters"),
    'address.country': Yup.string()
      .required("Country is required")
      .default('Somalia'),

    // Contact fields
    'contact.primaryEmail': Yup.string()
      .required("Primary email is required")
      .email("Invalid email format")
      .max(100, "Email must not exceed 100 characters"),
    'contact.primaryPhone': Yup.string()
      .required("Primary phone is required")
      .max(20, "Phone must not exceed 20 characters"),
    'contact.secondaryEmail': Yup.string()
      .email("Invalid email format")
      .max(100, "Email must not exceed 100 characters"),
    'contact.secondaryPhone': Yup.string()
      .max(20, "Phone must not exceed 20 characters"),
    'contact.website': Yup.string()
      .url("Invalid URL format")
      .max(200, "URL must not exceed 200 characters"),

    'settings.vatRate': Yup.number()
      .min(0, "VAT rate must be at least 0")
      .max(100, "VAT rate must not exceed 100")
      .required("VAT rate is required"),

    'settings.invoiceDueDays': Yup.number()
      .min(1, "Invoice due days must be at least 1")
      .integer("Invoice due days must be a whole number")
      .required("Invoice due days is required"),
    'settings.rentDueDay': Yup.number()
      .min(1, "Rent due day must be at least 1")
      .max(31, "Rent due day must not exceed 31")
      .integer("Rent due day must be a whole number")
      .required("Rent due day is required"),
    'settings.depositReceiptToggle': Yup.boolean(),

    isActive: Yup.boolean()
  });

  // Form validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: organization?.name || "",
      registrationNumber: organization?.registrationNumber || "",
      taxNumber: organization?.taxNumber || "",
      logo: organization?.logo || "",

      // Address
      'address.street': organization?.address?.street || "",
      'address.district': organization?.address?.district || "",
      'address.city': organization?.address?.city || "",
      'address.region': organization?.address?.region || "",
      'address.country': organization?.address?.country || "Somalia",

      // Contact
      'contact.primaryEmail': organization?.contact?.primaryEmail || "",
      'contact.primaryPhone': organization?.contact?.primaryPhone || "",
      'contact.secondaryEmail': organization?.contact?.secondaryEmail || "",
      'contact.secondaryPhone': organization?.contact?.secondaryPhone || "",
      'contact.website': organization?.contact?.website || "",

      'settings.vatRate': organization?.settings?.vatRate || 0,
      'settings.invoiceDueDays': organization?.settings?.invoiceDueDays || 5,
      'settings.rentDueDay': organization?.settings?.rentDueDay || 1,
      'settings.depositReceiptToggle': organization?.settings?.depositReceiptToggle ?? true,

      isActive: organization?.isActive ?? true
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setSubmitting(true);
        const formData = new FormData();

        if (logoFile) {
          formData.append("logo", logoFile);
        } else if (organization?.logo) {
          formData.append("logo", organization.logo);
        }

        const payload = {
          name: values.name,
          registrationNumber: values.registrationNumber,
          taxNumber: values.taxNumber,
          address: {
            street: values['address.street'],
            district: values['address.district'],
            city: values['address.city'],
            region: values['address.region'],
            country: values['address.country']
          },
          contact: {
            primaryEmail: values['contact.primaryEmail'],
            primaryPhone: values['contact.primaryPhone'],
            secondaryEmail: values['contact.secondaryEmail'],
            secondaryPhone: values['contact.secondaryPhone'],
            website: values['contact.website']
          },
          settings: {
            vatRate: parseFloat(values['settings.vatRate']),
            invoiceDueDays: parseInt(values['settings.invoiceDueDays']),
            rentDueDay: parseInt(values['settings.rentDueDay']),
            depositReceiptToggle: Boolean(values['settings.depositReceiptToggle'])
          },
          isActive: values.isActive
        };

        Object.keys(payload).forEach(key => {
          if (key === 'address' || key === 'contact' || key === 'settings') {
            formData.append(key, JSON.stringify(payload[key]));
          } else {
            formData.append(key, payload[key]);
          }
        });

        if (organization?._id) {
          formData.append("_id", organization._id);
        }

        await dispatch(onCreateOrUpdateOrganization(formData));
        setModal(false);
        setLogoFile(null);
        resetForm();
        fetchOrganization();

      } catch (err) {
        console.error("Form submit error:", err);
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Stats data
  const stats = [
    { label: 'Profile Completion', value: `${completionPercentage}%`, icon: 'ri-pie-chart-2-line' },
    { label: 'Properties', value: entityCounts.properties || organization?.propertiesCount || 0, icon: 'ri-building-2-line' },
    { label: 'Tenants', value: entityCounts.tenants || organization?.tenantsCount || 0, icon: 'ri-team-line' },
    { label: 'Active Since', value: organization?.createdAt ? new Date(organization.createdAt).getFullYear() : 'N/A', icon: 'ri-calendar-line' }
  ];

  return (
    <div className="page-content" style={{ background: colors.background, minHeight: '100vh' }}>
      <Container fluid>
        <BreadCrumb title="Organization Profile" pageTitle="Settings" />

        {/* Main Content */}
        <Card style={styles.card}>
          {/* Header with gradient */}
          <CardHeader style={styles.cardHeader}>
            <Row className="align-items-center">
              <Col>
                <h5 style={styles.cardTitle}>
                  <i className="ri-building-2-line me-2"></i>
                  Organization Profile
                </h5>
                {organization && (
                  <div style={styles.cardSubtitle}>
                    <i className="ri-time-line me-1"></i>
                    Last updated: {formatDate(organization.updatedAt)}
                  </div>
                )}
              </Col>
              <Col xs="auto">
                <Button
                  color="primary"
                  onClick={() => setModal(true)}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: '#fff'
                  }}
                  className="shadow-sm"
                >
                  <i className="ri-edit-box-line me-1 align-middle"></i>
                  Edit Profile
                </Button>
              </Col>
            </Row>
          </CardHeader>

          <CardBody style={{ padding: '32px' }}>
            {loading ? (
              <Loader />
            ) : !organization ? (
              <div className="text-center py-5">
                <div style={styles.avatarPlaceholder} className="mx-auto mb-4">
                  <i className="ri-building-line"></i>
                </div>
                <h4 style={{ color: colors.dark, fontWeight: 600 }}>No Organization Found</h4>
                <p style={{ color: colors.textLight, maxWidth: '400px', margin: '0 auto 24px' }}>
                  Get started by creating your organization profile. This will help you manage your properties and tenants effectively.
                </p>
                <Button
                  color="primary"
                  onClick={() => setModal(true)}
                  style={{ ...styles.button, ...styles.primaryButton, padding: '12px 32px' }}
                >
                  <i className="ri-add-line me-1"></i>
                  Create Organization
                </Button>
              </div>
            ) : (
              <>
                {/* Organization Header */}
                <Row className="align-items-center mb-5">
                  <Col lg={8} className="d-flex align-items-center">
                    <div className="position-relative me-4">
                      {organization.logo ? (
                        <img
                          src={organization.logo}
                          alt={organization.name}
                          style={styles.avatar}
                        />
                      ) : (
                        <div style={styles.avatarPlaceholder}>
                          {organization.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className="position-absolute bottom-0 end-0"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: organization.isActive ? colors.success : colors.danger,
                          borderRadius: '16px',
                          border: '3px solid #fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      >
                        <i className={organization.isActive ? 'ri-check-line' : 'ri-close-line'}></i>
                      </div>
                    </div>
                    <div>
                      <h2 style={{ color: colors.dark, fontWeight: 700, marginBottom: '8px' }}>
                        {organization.name}
                      </h2>
                      <div className="d-flex gap-3">
                        {organization.registrationNumber && (
                          <Badge color="success" style={styles.badge}>
                            <i className="ri-file-copy-line me-1"></i>
                            Reg: {organization.registrationNumber}
                          </Badge>
                        )}
                        {organization.taxNumber && (
                          <Badge color="primary" style={styles.badge}>
                            <i className="ri-percent-line me-1"></i>
                            Tax: {organization.taxNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col lg={4}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${completionPercentage}%` }} />
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span style={{ color: colors.textLight, fontSize: '0.9rem' }}>Profile Strength</span>
                      <span style={{ color: colors.primary, fontWeight: 600 }}>{completionPercentage}% Complete</span>
                    </div>
                  </Col>
                </Row>

                {/* Stats Cards */}
                <Row className="mb-5">
                  {stats.map((stat, index) => (
                    <Col lg={3} key={index}>
                      <div
                        style={{
                          ...styles.statsCard,
                          transform: hoveredStat === index ? 'translateY(-4px)' : 'none',
                          boxShadow: hoveredStat === index ? '0 12px 40px rgba(0,0,0,0.08)' : styles.statsCard.boxShadow
                        }}
                        onMouseEnter={() => setHoveredStat(index)}
                        onMouseLeave={() => setHoveredStat(null)}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              background: `${colors.primary}10`,
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '16px'
                            }}
                          >
                            <i className={stat.icon} style={{ color: colors.primary, fontSize: '24px' }}></i>
                          </div>
                          <div>
                            <div style={styles.statValue}>{stat.value}</div>
                            <div style={styles.statLabel}>{stat.label}</div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Tabs Navigation */}
                <Nav tabs style={styles.nav}>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === '1' })}
                      onClick={() => setActiveTab('1')}
                      style={{
                        ...styles.navLink,
                        ...(activeTab === '1' ? styles.navLinkActive : {})
                      }}
                    >
                      <i className="ri-map-pin-line me-2"></i>
                      Address
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === '2' })}
                      onClick={() => setActiveTab('2')}
                      style={{
                        ...styles.navLink,
                        ...(activeTab === '2' ? styles.navLinkActive : {})
                      }}
                    >
                      <i className="ri-customer-service-2-line me-2"></i>
                      Contact
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeTab === '3' })}
                      onClick={() => setActiveTab('3')}
                      style={{
                        ...styles.navLink,
                        ...(activeTab === '3' ? styles.navLinkActive : {})
                      }}
                    >
                      <i className="ri-settings-4-line me-2"></i>
                      Settings
                    </NavLink>
                  </NavItem>
                </Nav>

                {/* Tab Content */}
                <TabContent activeTab={activeTab}>
                  {/* Address Tab */}
                  <TabPane tabId="1">
                    <div style={styles.infoCard}>
                      <div className="d-flex align-items-center mb-4">
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: `${colors.primary}10`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}
                        >
                          <i className="ri-map-pin-line" style={{ color: colors.primary, fontSize: '20px' }}></i>
                        </div>
                        <h5 style={{ margin: 0, color: colors.dark, fontWeight: 600 }}>Address Information</h5>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Street Address</div>
                          <p style={styles.infoValue}>{organization.address?.street || 'Not specified'}</p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>District</div>
                          <p style={styles.infoValue}>{organization.address?.district || 'Not specified'}</p>
                        </Col>
                        <Col md={4}>
                          <div style={styles.infoLabel}>City</div>
                          <p style={styles.infoValue}>{organization.address?.city || 'Not specified'}</p>
                        </Col>
                        <Col md={4}>
                          <div style={styles.infoLabel}>Region</div>
                          <p style={styles.infoValue}>{organization.address?.region || 'Not specified'}</p>
                        </Col>
                        <Col md={4}>
                          <div style={styles.infoLabel}>Country</div>
                          <p style={styles.infoValue}>{organization.address?.country || 'Not specified'}</p>
                        </Col>
                      </Row>
                    </div>
                  </TabPane>

                  {/* Contact Tab */}
                  <TabPane tabId="2">
                    <div style={styles.infoCard}>
                      <div className="d-flex align-items-center mb-4">
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: `${colors.primary}10`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}
                        >
                          <i className="ri-customer-service-2-line" style={{ color: colors.primary, fontSize: '20px' }}></i>
                        </div>
                        <h5 style={{ margin: 0, color: colors.dark, fontWeight: 600 }}>Contact Information</h5>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Primary Email</div>
                          <p style={styles.infoValue}>
                            <i className="ri-mail-line me-2" style={{ color: colors.primary }}></i>
                            {organization.contact?.primaryEmail || 'Not specified'}
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Primary Phone</div>
                          <p style={styles.infoValue}>
                            <i className="ri-phone-line me-2" style={{ color: colors.primary }}></i>
                            {organization.contact?.primaryPhone || 'Not specified'}
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Secondary Email</div>
                          <p style={styles.infoValue}>
                            <i className="ri-mail-line me-2" style={{ color: colors.textLight }}></i>
                            {organization.contact?.secondaryEmail || 'Not specified'}
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Secondary Phone</div>
                          <p style={styles.infoValue}>
                            <i className="ri-phone-line me-2" style={{ color: colors.textLight }}></i>
                            {organization.contact?.secondaryPhone || 'Not specified'}
                          </p>
                        </Col>
                        <Col md={12}>
                          <div style={styles.infoLabel}>Website</div>
                          <p style={styles.infoValue}>
                            {organization.contact?.website ? (
                              <a
                                href={organization.contact.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: colors.primary, textDecoration: 'none' }}
                              >
                                <i className="ri-global-line me-2"></i>
                                {organization.contact.website}
                              </a>
                            ) : 'Not specified'}
                          </p>
                        </Col>
                      </Row>
                    </div>
                  </TabPane>

                  {/* Settings Tab */}
                  <TabPane tabId="3">
                    <div style={styles.infoCard}>
                      <div className="d-flex align-items-center mb-4">
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: `${colors.primary}10`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                          }}
                        >
                          <i className="ri-settings-4-line" style={{ color: colors.primary, fontSize: '20px' }}></i>
                        </div>
                        <h5 style={{ margin: 0, color: colors.dark, fontWeight: 600 }}>System Settings</h5>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Base Currency</div>
                          <p style={styles.infoValue}>
                            <i className="ri-money-dollar-circle-line me-2" style={{ color: colors.primary }}></i>
                            {organization.settings?.baseCurrency || 'USD'}
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>VAT Rate</div>
                          <p style={styles.infoValue}>
                            <i className="ri-percent-line me-2" style={{ color: colors.primary }}></i>
                            {organization.settings?.vatRate || 0}%
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Invoice Due Days</div>
                          <p style={styles.infoValue}>
                            <i className="ri-file-list-3-line me-2" style={{ color: colors.primary }}></i>
                            {organization.settings?.invoiceDueDays || 0} days
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Rent Due Day</div>
                          <p style={styles.infoValue}>
                            <i className="ri-calendar-line me-2" style={{ color: colors.primary }}></i>
                            Day {organization.settings?.rentDueDay || 1}
                          </p>
                        </Col>
                        <Col md={6}>
                          <div style={styles.infoLabel}>Deposit Receipts</div>
                          <p style={styles.infoValue}>
                            <i className="ri-receipt-line me-2" style={{ color: colors.primary }}></i>
                            {organization.settings?.depositReceiptToggle !== false ? 'Enabled' : 'Disabled'}
                          </p>
                        </Col>
                      </Row>
                    </div>
                  </TabPane>
                </TabContent>
              </>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={modal}
        toggle={() => setModal(false)}
        size="xl"
        centered
        modalClassName="professional-modal"
      >
        <div style={styles.modal}>
          <ModalHeader
            toggle={() => setModal(false)}
            style={styles.modalHeader}
          >
            <h5 style={styles.modalTitle}>
              <i className={`ri-${organization ? 'edit-box' : 'add'}-line me-2`} style={{ color: colors.primary }}></i>
              {organization ? 'Edit Organization Profile' : 'Create Organization Profile'}
            </h5>
          </ModalHeader>

          <Form onSubmit={validation.handleSubmit}>
            <div style={styles.modalBody}>
              <Row>
                <Col lg={12}>
                  {/* Logo Upload */}
                  <div style={{ ...styles.infoCard, marginBottom: '24px' }}>
                    <h6 style={{ color: colors.dark, fontWeight: 600, marginBottom: '20px' }}>
                      <i className="ri-image-line me-2" style={{ color: colors.primary }}></i>
                      Organization Logo
                    </h6>
                    <FormGroup>
                      <FilePond
                        files={logoFile ? [logoFile] : []}
                        onupdatefiles={(fileItems) => {
                          setLogoFile(fileItems.length > 0 ? fileItems[0].file : null);
                        }}
                        allowMultiple={false}
                        allowPaste={true}
                        name="logo"
                        labelIdle='<div class="text-center"><i class="ri-upload-cloud-2-line" style="font-size: 48px; color: var(--vz-primary);"></i><p class="mt-2" style="color: var(--vz-body-color);">Drag & Drop your logo or <span class="filepond--label-action" style="color: var(--vz-primary); font-weight: 600;">Browse</span></p></div>'
                        acceptedFileTypes={['image/*']}
                        maxFileSize="5MB"
                        stylePanel={{
                          backgroundColor: colors.light,
                          borderRadius: '12px'
                        }}
                      />
                      {organization?.logo && !logoFile && (
                        <div className="mt-3">
                          <small style={{ color: colors.textLight }}>Current logo:</small>
                          <div className="mt-2">
                            <img
                              src={organization.logo}
                              alt="Current logo"
                              style={{
                                maxHeight: '80px',
                                borderRadius: '8px',
                                border: `2px solid ${colors.border}`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </FormGroup>
                  </div>

                  {/* Basic Information */}
                  <div style={{ ...styles.infoCard, marginBottom: '24px' }}>
                    <h6 style={{ color: colors.dark, fontWeight: 600, marginBottom: '20px' }}>
                      <i className="ri-information-line me-2" style={{ color: colors.primary }}></i>
                      Basic Information
                    </h6>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Organization Name <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="name"
                            value={validation.values.name}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.name && !!validation.errors.name}
                            placeholder="Enter organization name"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors.name}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup>
                          <Label style={styles.label}>Registration Number</Label>
                          <Input
                            name="registrationNumber"
                            value={validation.values.registrationNumber}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.registrationNumber && !!validation.errors.registrationNumber}
                            placeholder="Reg. number"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors.registrationNumber}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup>
                          <Label style={styles.label}>Tax Number</Label>
                          <Input
                            name="taxNumber"
                            value={validation.values.taxNumber}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.taxNumber && !!validation.errors.taxNumber}
                            placeholder="Tax number"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors.taxNumber}</FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup check className="mt-2">
                      <Input
                        type="checkbox"
                        name="isActive"
                        checked={validation.values.isActive}
                        onChange={validation.handleChange}
                        id="isActive"
                        style={{ cursor: 'pointer' }}
                      />
                      <Label for="isActive" check style={{ color: colors.text, fontWeight: 500 }}>
                        <i className="ri-checkbox-circle-line me-1" style={{ color: colors.success }}></i>
                        Active Organization
                      </Label>
                    </FormGroup>
                  </div>

                  {/* Address Information */}
                  <div style={{ ...styles.infoCard, marginBottom: '24px' }}>
                    <h6 style={{ color: colors.dark, fontWeight: 600, marginBottom: '20px' }}>
                      <i className="ri-map-pin-line me-2" style={{ color: colors.primary }}></i>
                      Address Information
                    </h6>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Street <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="address.street"
                            value={validation.values['address.street']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['address.street'] && !!validation.errors['address.street']}
                            placeholder="Street address"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['address.street']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>
                            District <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="address.district"
                            value={validation.values['address.district']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['address.district'] && !!validation.errors['address.district']}
                            placeholder="District"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['address.district']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label style={styles.label}>
                            City <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="address.city"
                            disabled={true}
                            value={validation.values['address.city']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['address.city'] && !!validation.errors['address.city']}
                            placeholder="City"
                            style={{ ...styles.input, background: colors.subtle }}
                          />
                          <FormFeedback>{validation.errors['address.city']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Region <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="address.region"
                            disabled={true}
                            value={validation.values['address.region']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['address.region'] && !!validation.errors['address.region']}
                            placeholder="Region"
                            style={{ ...styles.input, background: colors.subtle }}
                          />
                          <FormFeedback>{validation.errors['address.region']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Country <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="address.country"
                            value={validation.values['address.country']}
                            onChange={validation.handleChange}
                            disabled={true}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['address.country'] && !!validation.errors['address.country']}
                            placeholder="Country"
                            style={{ ...styles.input, background: colors.subtle }}
                          />
                          <FormFeedback>{validation.errors['address.country']}</FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>

                  {/* Contact Information */}
                  <div style={{ ...styles.infoCard, marginBottom: '24px' }}>
                    <h6 style={{ color: colors.dark, fontWeight: 600, marginBottom: '20px' }}>
                      <i className="ri-customer-service-2-line me-2" style={{ color: colors.primary }}></i>
                      Contact Information
                    </h6>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Primary Email <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="email"
                            name="contact.primaryEmail"
                            value={validation.values['contact.primaryEmail']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['contact.primaryEmail'] && !!validation.errors['contact.primaryEmail']}
                            placeholder="primary@example.com"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['contact.primaryEmail']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Primary Phone <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="contact.primaryPhone"
                            value={validation.values['contact.primaryPhone']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['contact.primaryPhone'] && !!validation.errors['contact.primaryPhone']}
                            placeholder="+252 XX XXX XXXX"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['contact.primaryPhone']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>Secondary Email</Label>
                          <Input
                            type="email"
                            name="contact.secondaryEmail"
                            value={validation.values['contact.secondaryEmail']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['contact.secondaryEmail'] && !!validation.errors['contact.secondaryEmail']}
                            placeholder="secondary@example.com"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['contact.secondaryEmail']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label style={styles.label}>Secondary Phone</Label>
                          <Input
                            name="contact.secondaryPhone"
                            value={validation.values['contact.secondaryPhone']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['contact.secondaryPhone'] && !!validation.errors['contact.secondaryPhone']}
                            placeholder="Alternative phone"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['contact.secondaryPhone']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={12}>
                        <FormGroup>
                          <Label style={styles.label}>Website</Label>
                          <Input
                            name="contact.website"
                            value={validation.values['contact.website']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['contact.website'] && !!validation.errors['contact.website']}
                            placeholder="https://example.com"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['contact.website']}</FormFeedback>
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>

                  {/* System Settings */}
                  <div style={styles.infoCard}>
                    <h6 style={{ color: colors.dark, fontWeight: 600, marginBottom: '20px' }}>
                      <i className="ri-settings-4-line me-2" style={{ color: colors.primary }}></i>
                      System Settings
                    </h6>
                    <Row>
                      <Col md={4}>
                        <FormGroup>
                          <Label style={styles.label}>
                            VAT Rate (%) <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="settings.vatRate"
                            value={validation.values['settings.vatRate']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['settings.vatRate'] && !!validation.errors['settings.vatRate']}
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['settings.vatRate']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Invoice Due Days <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="settings.invoiceDueDays"
                            value={validation.values['settings.invoiceDueDays']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['settings.invoiceDueDays'] && !!validation.errors['settings.invoiceDueDays']}
                            min="1"
                            placeholder="5"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['settings.invoiceDueDays']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        <FormGroup>
                          <Label style={styles.label}>
                            Rent Due Day <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="settings.rentDueDay"
                            value={validation.values['settings.rentDueDay']}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched['settings.rentDueDay'] && !!validation.errors['settings.rentDueDay']}
                            min="1"
                            max="31"
                            placeholder="1"
                            style={styles.input}
                          />
                          <FormFeedback>{validation.errors['settings.rentDueDay']}</FormFeedback>
                        </FormGroup>
                      </Col>
                      {/* <Col md={4}>
                        <FormGroup check style={{ marginTop: '38px' }}>
                          <Input
                            type="checkbox"
                            name="settings.depositReceiptToggle"
                            checked={validation.values['settings.depositReceiptToggle']}
                            onChange={validation.handleChange}
                            id="depositReceiptToggle"
                            style={{ cursor: 'pointer' }}
                          />
                          <Label for="depositReceiptToggle" check style={{ color: colors.dark, fontWeight: 500, cursor: 'pointer' }}>
                            Enable Deposit Receipts
                          </Label>
                        </FormGroup>
                      </Col> */}
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>

            <div style={styles.modalFooter}>
              <Button
                color="light"
                onClick={() => setModal(false)}
                className="me-2"
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                <i className="ri-close-line me-1"></i>
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                disabled={validation.isSubmitting}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                {validation.isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line spin me-1"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line me-1"></i>
                    {organization ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Organization;
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Card, CardHeader, CardBody,
//   Col, Container, Row,
//   Form, Input, Label, FormGroup,
//   Modal, ModalBody, ModalFooter, ModalHeader,
//   Button, Badge, FormFeedback, Alert, Nav, NavItem, NavLink,
//   TabContent, TabPane
// } from "reactstrap";
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import BreadCrumb from "../../Components/Common/BreadCrumb";
// import Loader from "../../Components/Common/Loader";
// import { useDispatch, useSelector } from 'react-redux';
// import { createSelector } from 'reselect';
// import classnames from 'classnames';

// // Import FilePond for file uploads
// import { FilePond, registerPlugin } from 'react-filepond';
// import 'filepond/dist/filepond.min.css';
// import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
// import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
// import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// //redux
// import {
//   getOrganization as onGetOrganization,
//   createOrUpdateOrganization as onCreateOrUpdateOrganization,
// } from "../../slices/thunks";

// // Formik
// import * as Yup from "yup";
// import { useFormik } from "formik";
// import useAuthUser from '../../Components/Hooks/useAuthUser';

// // Register the plugins
// registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

// const Organization = () => {
//   document.title = "Organization | Apartment";

//   const dispatch = useDispatch();
//   const userAuth = useAuthUser();
//   const businessId = userAuth.businessId;

//   // Redux Selector
//   const selectOrganizationData = createSelector(
//     (state) => state.Organization,
//     (organizationData) => organizationData.organizationData
//   );

//   const organizationData = useSelector(selectOrganizationData);
//   const [organization, setOrganization] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [modal, setModal] = useState(false);
//   const [viewModal, setViewModal] = useState(false);
//   const [activeTab, setActiveTab] = useState('1');
//   const [logoFile, setLogoFile] = useState(null);
//   const [completionPercentage, setCompletionPercentage] = useState(0);

//   // Currency options
//   const currencyOptions = ['USD', 'EUR', 'GBP', 'SOS'];

//   // Late fee type options
//   const lateFeeTypeOptions = [
//     { value: 'fixed', label: 'Fixed Amount' },
//     { value: 'percentage', label: 'Percentage' }
//   ];

//   // Fetch organization data
//   const fetchOrganization = useCallback(async () => {
//     setLoading(true);
//     try {
//       await dispatch(onGetOrganization(businessId));
//     } catch (error) {
//       console.error("Error loading organization:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [dispatch, businessId]);

//   useEffect(() => {
//     fetchOrganization();
//   }, [fetchOrganization]);

//   useEffect(() => {
//     console.log("Organization data updated:", organizationData);
//     if (organizationData && organizationData.length > 0) {
//       setOrganization(organizationData[0]); // Single organization
//     }
//   }, [organizationData]);

//   // Calculate profile completion
//   useEffect(() => {
//     if (organization) {
//       let completed = 0;
//       const total = 10; // Total required fields

//       if (organization.name) completed++;
//       if (organization.registrationNumber) completed++;
//       if (organization.taxNumber) completed++;
//       if (organization.address?.street) completed++;
//       if (organization.address?.city) completed++;
//       if (organization.contact?.primaryEmail) completed++;
//       if (organization.contact?.primaryPhone) completed++;
//       if (organization.settings?.baseCurrency) completed++;
//       if (organization.settings?.vatRate !== undefined) completed++;
//       if (organization.settings?.rentDueDay) completed++;

//       setCompletionPercentage(Math.round((completed / total) * 100));
//     }
//   }, [organization]);

//   // Format date for display
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   // Yup Validation Schema - based on your schema fields
//   const validationSchema = Yup.object({
//     name: Yup.string()
//       .required("Organization name is required")
//       .min(2, "Name must be at least 2 characters")
//       .max(100, "Name must not exceed 100 characters"),
//     registrationNumber: Yup.string()
//       .max(50, "Registration number must not exceed 50 characters"),
//     taxNumber: Yup.string()
//       .max(50, "Tax number must not exceed 50 characters"),

//     // Address fields
//     'address.street': Yup.string()
//       .required("Street address is required")
//       .max(200, "Street must not exceed 200 characters"),
//     'address.district': Yup.string()
//       .required("District is required")
//       .max(100, "District must not exceed 100 characters"),
//     'address.city': Yup.string()
//       .required("City is required")
//       .max(100, "City must not exceed 100 characters"),
//     'address.region': Yup.string()
//       .max(100, "Region must not exceed 100 characters"),
//     'address.country': Yup.string()
//       .required("Country is required")
//       .default('Somalia'),


//     // Contact fields
//     'contact.primaryEmail': Yup.string()
//       .required("Primary email is required")
//       .email("Invalid email format")
//       .max(100, "Email must not exceed 100 characters"),
//     'contact.primaryPhone': Yup.string()
//       .required("Primary phone is required")
//       .max(20, "Phone must not exceed 20 characters"),
//     'contact.secondaryEmail': Yup.string()
//       .email("Invalid email format")
//       .max(100, "Email must not exceed 100 characters"),
//     'contact.secondaryPhone': Yup.string()
//       .max(20, "Phone must not exceed 20 characters"),
//     'contact.website': Yup.string()
//       .url("Invalid URL format")
//       .max(200, "URL must not exceed 200 characters"),


//     'settings.vatRate': Yup.number()
//       .min(0, "VAT rate must be at least 0")
//       .max(100, "VAT rate must not exceed 100")
//       .required("VAT rate is required"),

//     'settings.invoiceDueDays': Yup.number()
//       .min(1, "Invoice due days must be at least 1")
//       .integer("Invoice due days must be a whole number")
//       .required("Invoice due days is required"),
//     'settings.rentDueDay': Yup.number()
//       .min(1, "Rent due day must be at least 1")
//       .max(31, "Rent due day must not exceed 31")
//       .integer("Rent due day must be a whole number")
//       .required("Rent due day is required"),

//     isActive: Yup.boolean()
//   });

//   // Form validation
//   const validation = useFormik({
//     enableReinitialize: true,
//     initialValues: {
//       name: organization?.name || "",
//       registrationNumber: organization?.registrationNumber || "",
//       taxNumber: organization?.taxNumber || "",
//       logo: organization?.logo || "",

//       // Address
//       'address.street': organization?.address?.street || "",
//       'address.district': organization?.address?.district || "",
//       'address.city': organization?.address?.city || "",
//       'address.region': organization?.address?.region || "",
//       'address.country': organization?.address?.country || "Somalia",

//       // Contact
//       'contact.primaryEmail': organization?.contact?.primaryEmail || "",
//       'contact.primaryPhone': organization?.contact?.primaryPhone || "",
//       'contact.secondaryEmail': organization?.contact?.secondaryEmail || "",
//       'contact.secondaryPhone': organization?.contact?.secondaryPhone || "",
//       'contact.website': organization?.contact?.website || "",


//       'settings.vatRate': organization?.settings?.vatRate || 0,

//       'settings.invoiceDueDays': organization?.settings?.invoiceDueDays || 5,
//       'settings.rentDueDay': organization?.settings?.rentDueDay || 1,

//       isActive: organization?.isActive ?? true
//     },
//     validationSchema: validationSchema,
//     onSubmit: async (values, { setSubmitting, resetForm }) => {
//       try {
//         setSubmitting(true);
//         const formData = new FormData();

//         // Handle logo file
//         if (logoFile) {
//           formData.append("logo", logoFile);
//         } else if (organization?.logo) {
//           formData.append("logo", organization.logo);
//         }

//         // Structure the data according to schema
//         const payload = {
//           name: values.name,
//           registrationNumber: values.registrationNumber,
//           taxNumber: values.taxNumber,
//           address: {
//             street: values['address.street'],
//             district: values['address.district'],
//             city: values['address.city'],
//             region: values['address.region'],
//             country: values['address.country']
//           },
//           contact: {
//             primaryEmail: values['contact.primaryEmail'],
//             primaryPhone: values['contact.primaryPhone'],
//             secondaryEmail: values['contact.secondaryEmail'],
//             secondaryPhone: values['contact.secondaryPhone'],
//             website: values['contact.website']
//           },
//           settings: {
//             vatRate: parseFloat(values['settings.vatRate']),
//             invoiceDueDays: parseInt(values['settings.invoiceDueDays']),
//             rentDueDay: parseInt(values['settings.rentDueDay'])
//           },
//           isActive: values.isActive
//         };

//         // Append each field to FormData
//         Object.keys(payload).forEach(key => {
//           if (key === 'address' || key === 'contact' || key === 'settings') {
//             formData.append(key, JSON.stringify(payload[key]));
//           } else {
//             formData.append(key, payload[key]);
//           }
//         });

//         if (organization?._id) {
//           formData.append("_id", organization._id);
//         }

//         await dispatch(onCreateOrUpdateOrganization(formData));
//         setModal(false);
//         setLogoFile(null);
//         resetForm();
//         fetchOrganization();

//       } catch (err) {
//         console.error("Form submit error:", err);
//       } finally {
//         setSubmitting(false);
//       }
//     }
//   });



//   return (
//     <div className="page-content">
//       <Container fluid>
//         <BreadCrumb title="Organization Profile" pageTitle="Settings" />
//         {/* Main Content */}
//         <Card>
//           <CardHeader className="d-flex justify-content-between align-items-center bg-light">
//             <div>
//               <h5 className="card-title mb-0">
//                 <i className="ri-building-line align-middle me-2"></i>
//                 Organization Profile
//               </h5>
//               {organization && (
//                 <small className="text-muted">
//                   Last updated: {formatDate(organization.updatedAt)}
//                 </small>
//               )}
//             </div>
//             <Button
//               color="primary"
//               onClick={() => setModal(true)}
//               className="shadow-sm"
//             >
//               <i className="ri-edit-line me-1 align-middle"></i>
//               Edit Profile
//             </Button>
//           </CardHeader>
//           <CardBody>
//             {loading ? (
//               <Loader />
//             ) : !organization ? (
//               <div className="text-center py-5">
//                 <i className="ri-building-line display-4 text-muted"></i>
//                 <h5 className="mt-3">No Organization Found</h5>
//                 <p className="text-muted">Click the button above to create your organization profile.</p>
//               </div>
//             ) : (
//               <Row>
//                 {/* Organization Overview */}
//                 <Col lg={4} className="border-end">
//                   <div className="text-center mb-4">
//                     <div className="avatar-xl mx-auto mb-3">
//                       {organization.logo ? (
//                         <img
//                           src={organization.logo}
//                           alt={organization.name}
//                           className="img-thumbnail rounded-circle"
//                           style={{ width: '120px', height: '120px', objectFit: 'cover' }}
//                         />
//                       ) : (
//                         <div
//                           className="avatar-title bg-light rounded-circle"
//                           style={{ width: '120px', height: '120px', margin: '0 auto' }}
//                         >
//                           <i className="ri-building-line" style={{ fontSize: '48px', color: '#adb5bd' }} />
//                         </div>
//                       )}
//                     </div>
//                     <h4 className="mb-1">{organization.name}</h4>
//                     <p className="text-muted mb-2">
//                       Reg: {organization.registrationNumber} | Tax: {organization.taxNumber}
//                     </p>
//                     <Badge color={organization.isActive ? 'success' : 'danger'} className="px-3 py-2">
//                       {organization.isActive ? 'Active' : 'Inactive'}
//                     </Badge>
//                   </div>

//                   <hr />

//                 </Col>

//                 {/* Organization Details */}
//                 <Col lg={8}>
//                   <Nav tabs className="mb-4">
//                     <NavItem>
//                       <NavLink
//                         className={classnames({ active: activeTab === '1' })}
//                         onClick={() => setActiveTab('1')}
//                       >
//                         <i className="ri-information-line me-1"></i>
//                         Address
//                       </NavLink>
//                     </NavItem>
//                     <NavItem>
//                       <NavLink
//                         className={classnames({ active: activeTab === '2' })}
//                         onClick={() => setActiveTab('2')}
//                       >
//                         <i className="ri-customer-service-line me-1"></i>
//                         Contact
//                       </NavLink>
//                     </NavItem>
//                     <NavItem>
//                       <NavLink
//                         className={classnames({ active: activeTab === '3' })}
//                         onClick={() => setActiveTab('3')}
//                       >
//                         <i className="ri-settings-4-line me-1"></i>
//                         Settings
//                       </NavLink>
//                     </NavItem>
//                   </Nav>

//                   <TabContent activeTab={activeTab}>
//                     {/* Address Tab */}
//                     <TabPane tabId="1">
//                       <div className="p-3">
//                         <h6 className="fw-semibold mb-3">Address Information</h6>
//                         <Row>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Street</Label>
//                             <p className="fw-medium">{organization.address?.street || 'N/A'}</p>
//                           </Col>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">District</Label>
//                             <p className="fw-medium">{organization.address?.district || 'N/A'}</p>
//                           </Col>
//                           <Col md={4} className="mb-3">
//                             <Label className="form-label text-muted">City</Label>
//                             <p className="fw-medium">{organization.address?.city || 'N/A'}</p>
//                           </Col>
//                           <Col md={4} className="mb-3">
//                             <Label className="form-label text-muted">Region</Label>
//                             <p className="fw-medium">{organization.address?.region || 'N/A'}</p>
//                           </Col>
//                           <Col md={4} className="mb-3">
//                             <Label className="form-label text-muted">Country</Label>
//                             <p className="fw-medium">{organization.address?.country || 'N/A'}</p>
//                           </Col>
//                           {/* <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Postal Code</Label>
//                             <p className="fw-medium">{organization.address?.postalCode || 'N/A'}</p>
//                           </Col> */}
//                         </Row>
//                       </div>
//                     </TabPane>

//                     {/* Contact Tab */}
//                     <TabPane tabId="2">
//                       <div className="p-3">
//                         <h6 className="fw-semibold mb-3">Contact Information</h6>
//                         <Row>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Primary Email</Label>
//                             <p className="fw-medium">
//                               <i className="ri-mail-line me-2"></i>
//                               {organization.contact?.primaryEmail || 'N/A'}
//                             </p>
//                           </Col>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Primary Phone</Label>
//                             <p className="fw-medium">
//                               <i className="ri-phone-line me-2"></i>
//                               {organization.contact?.primaryPhone || 'N/A'}
//                             </p>
//                           </Col>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Secondary Email</Label>
//                             <p className="fw-medium">
//                               <i className="ri-mail-line me-2"></i>
//                               {organization.contact?.secondaryEmail || 'N/A'}
//                             </p>
//                           </Col>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Secondary Phone</Label>
//                             <p className="fw-medium">
//                               <i className="ri-phone-line me-2"></i>
//                               {organization.contact?.secondaryPhone || 'N/A'}
//                             </p>
//                           </Col>
//                           <Col md={12} className="mb-3">
//                             <Label className="form-label text-muted">Website</Label>
//                             <p className="fw-medium">
//                               {organization.contact?.website ? (
//                                 <a href={organization.contact.website} target="_blank" rel="noopener noreferrer">
//                                   <i className="ri-global-line me-2"></i>
//                                   {organization.contact.website}
//                                 </a>
//                               ) : 'N/A'}
//                             </p>
//                           </Col>
//                         </Row>
//                       </div>
//                     </TabPane>

//                     {/* Settings Tab */}
//                     <TabPane tabId="3">
//                       <div className="p-3">
//                         <h6 className="fw-semibold mb-3">System Settings</h6>
//                         <Row>
//                           <Col md={6} className="mb-3">
//                             <Label className="form-label text-muted">Base Currency</Label>
//                             <p className="fw-medium">{organization.settings?.baseCurrency || 'USD'}</p>
//                           </Col>

//                           <Col md={4} className="mb-3">
//                             <Label className="form-label text-muted">VAT Rate</Label>
//                             <p className="fw-medium">{organization.settings?.vatRate || 0}%</p>
//                           </Col>



//                           <Col md={3} className="mb-3">
//                             <Label className="form-label text-muted">Invoice Due</Label>
//                             <p className="fw-medium">{organization.settings?.invoiceDueDays || 0} days</p>
//                           </Col>
//                           <Col md={3} className="mb-3">
//                             <Label className="form-label text-muted">Rent Due Day</Label>
//                             <p className="fw-medium">Day {organization.settings?.rentDueDay || 1}</p>
//                           </Col>
//                         </Row>
//                       </div>
//                     </TabPane>
//                   </TabContent>
//                 </Col>
//               </Row>
//             )}
//           </CardBody>
//         </Card>
//       </Container>

//       {/* Edit/Create Modal */}
//       <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" centered>
//         <ModalHeader toggle={() => setModal(false)} className="bg-light">
//           <i className={`ri-${organization ? 'edit' : 'add'}-line me-2`}></i>
//           {organization ? 'Edit Organization Profile' : 'Create Organization Profile'}
//         </ModalHeader>
//         <Form onSubmit={validation.handleSubmit}>
//           <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
//             <Row>
//               <Col lg={12}>
//                 {/* Logo Upload */}
//                 <Card className="border mb-3">
//                   <CardHeader className="bg-light">
//                     <h6 className="mb-0">Organization Logo</h6>
//                   </CardHeader>
//                   <CardBody>
//                     <FormGroup>
//                       <FilePond
//                         files={logoFile ? [logoFile] : []}
//                         onupdatefiles={(fileItems) => {
//                           setLogoFile(fileItems.length > 0 ? fileItems[0].file : null);
//                         }}
//                         allowMultiple={false}
//                         allowPaste={true}
//                         name="logo"
//                         labelIdle='<div class="text-center"><i class="ri-upload-cloud-2-line display-4 text-muted"></i><p class="mt-2">Drag & Drop your logo or <span class="filepond--label-action">Browse</span></p></div>'
//                         acceptedFileTypes={['image/*']}
//                         maxFileSize="5MB"
//                         className="filepond-border"
//                       />
//                       {organization?.logo && !logoFile && (
//                         <div className="mt-2">
//                           <small className="text-muted">Current logo:</small>
//                           <div className="mt-1">
//                             <img
//                               src={organization.logo}
//                               alt="Current logo"
//                               className="img-thumbnail"
//                               style={{ maxHeight: '100px' }}
//                             />
//                           </div>
//                         </div>
//                       )}
//                     </FormGroup>
//                   </CardBody>
//                 </Card>

//                 {/* Basic Information */}
//                 <Card className="border mb-3">
//                   <CardHeader className="bg-light">
//                     <h6 className="mb-0">Basic Information</h6>
//                   </CardHeader>
//                   <CardBody>
//                     <Row>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Organization Name <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             name="name"
//                             value={validation.values.name}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched.name && !!validation.errors.name}
//                             placeholder="Enter organization name"
//                           />
//                           <FormFeedback>{validation.errors.name}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={3}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Registration Number
//                           </Label>
//                           <Input
//                             name="registrationNumber"
//                             value={validation.values.registrationNumber}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched.registrationNumber && !!validation.errors.registrationNumber}
//                             placeholder="Reg. number"
//                           />
//                           <FormFeedback>{validation.errors.registrationNumber}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={3}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Tax Number
//                           </Label>
//                           <Input
//                             name="taxNumber"
//                             value={validation.values.taxNumber}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched.taxNumber && !!validation.errors.taxNumber}
//                             placeholder="Tax number"
//                           />
//                           <FormFeedback>{validation.errors.taxNumber}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                     </Row>

//                     <FormGroup check className="mt-2">
//                       <Input
//                         type="checkbox"
//                         name="isActive"
//                         checked={validation.values.isActive}
//                         onChange={validation.handleChange}
//                         id="isActive"
//                       />
//                       <Label for="isActive" check className="fw-medium">
//                         <i className="ri-checkbox-circle-line me-1"></i>
//                         Active Organization
//                       </Label>
//                     </FormGroup>
//                   </CardBody>
//                 </Card>

//                 {/* Address Information */}
//                 <Card className="border mb-3">
//                   <CardHeader className="bg-light">
//                     <h6 className="mb-0">Address Information</h6>
//                   </CardHeader>
//                   <CardBody>
//                     <Row>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Street <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             name="address.street"
//                             value={validation.values['address.street']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['address.street'] && !!validation.errors['address.street']}
//                             placeholder="Street address"
//                           />
//                           <FormFeedback>{validation.errors['address.street']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">District  <span className="text-danger">*</span></Label>
//                           <Input
//                             name="address.district"
//                             value={validation.values['address.district']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['address.district'] && !!validation.errors['address.district']}
//                             placeholder="District"
//                           />
//                           <FormFeedback>{validation.errors['address.district']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             City <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             name="address.city"
//                             disabled={true}
//                             value={validation.values['address.city']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['address.city'] && !!validation.errors['address.city']}
//                             placeholder="City"
//                           />
//                           <FormFeedback>{validation.errors['address.city']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4}>
//                         <FormGroup>
//                           <Label className="form-label">Region  <span className="text-danger">*</span></Label>
//                           <Input
//                             name="address.region"
//                             disabled={true}
//                             value={validation.values['address.region']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['address.region'] && !!validation.errors['address.region']}
//                             placeholder="Region"
//                           />
//                           <FormFeedback>{validation.errors['address.region']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Country <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             name="address.country"
//                             value={validation.values['address.country']}
//                             onChange={validation.handleChange}
//                             disabled={true}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['address.country'] && !!validation.errors['address.country']}
//                             placeholder="Country"
//                           />
//                           <FormFeedback>{validation.errors['address.country']}</FormFeedback>
//                         </FormGroup>
//                       </Col>

//                     </Row>
//                   </CardBody>
//                 </Card>

//                 {/* Contact Information */}
//                 <Card className="border mb-3">
//                   <CardHeader className="bg-light">
//                     <h6 className="mb-0">Contact Information</h6>
//                   </CardHeader>
//                   <CardBody>
//                     <Row>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Primary Email <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="email"
//                             name="contact.primaryEmail"
//                             value={validation.values['contact.primaryEmail']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['contact.primaryEmail'] && !!validation.errors['contact.primaryEmail']}
//                             placeholder="primary@example.com"
//                           />
//                           <FormFeedback>{validation.errors['contact.primaryEmail']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Primary Phone <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             name="contact.primaryPhone"
//                             value={validation.values['contact.primaryPhone']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['contact.primaryPhone'] && !!validation.errors['contact.primaryPhone']}
//                             placeholder="+252 XX XXX XXXX"
//                           />
//                           <FormFeedback>{validation.errors['contact.primaryPhone']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">Secondary Email</Label>
//                           <Input
//                             type="email"
//                             name="contact.secondaryEmail"
//                             value={validation.values['contact.secondaryEmail']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['contact.secondaryEmail'] && !!validation.errors['contact.secondaryEmail']}
//                             placeholder="secondary@example.com"
//                           />
//                           <FormFeedback>{validation.errors['contact.secondaryEmail']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={6}>
//                         <FormGroup>
//                           <Label className="form-label">Secondary Phone</Label>
//                           <Input
//                             name="contact.secondaryPhone"
//                             value={validation.values['contact.secondaryPhone']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['contact.secondaryPhone'] && !!validation.errors['contact.secondaryPhone']}
//                             placeholder="Alternative phone"
//                           />
//                           <FormFeedback>{validation.errors['contact.secondaryPhone']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={12}>
//                         <FormGroup>
//                           <Label className="form-label">Website</Label>
//                           <Input
//                             name="contact.website"
//                             value={validation.values['contact.website']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['contact.website'] && !!validation.errors['contact.website']}
//                             placeholder="https://example.com"
//                           />
//                           <FormFeedback>{validation.errors['contact.website']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                     </Row>
//                   </CardBody>
//                 </Card>

//                 {/* System Settings */}
//                 <Card className="border">
//                   <CardHeader className="bg-light">
//                     <h6 className="mb-0">System Settings</h6>
//                   </CardHeader>
//                   <CardBody>
//                     <Row>

//                       <Col md={4}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             VAT Rate (%) <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="number"
//                             name="settings.vatRate"
//                             value={validation.values['settings.vatRate']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['settings.vatRate'] && !!validation.errors['settings.vatRate']}
//                             min="0"
//                             max="100"
//                             step="0.1"
//                             placeholder="0"
//                           />
//                           <FormFeedback>{validation.errors['settings.vatRate']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4} style={{ display: "none" }}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Late Fee Type <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="select"
//                             name="settings.lateFeeType"
//                             value={validation.values['settings.lateFeeType']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['settings.lateFeeType'] && !!validation.errors['settings.lateFeeType']}
//                           >
//                             {lateFeeTypeOptions.map(option => (
//                               <option key={option.value} value={option.value}>{option.label}</option>
//                             ))}
//                           </Input>
//                           <FormFeedback>{validation.errors['settings.lateFeeType']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4} style={{ display: "none" }}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Late Fee Value <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="number"
//                             name="settings.lateFeeValue"
//                             value={validation.values['settings.lateFeeValue']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['settings.lateFeeValue'] && !!validation.errors['settings.lateFeeValue']}
//                             min="0"
//                             step="0.01"
//                             placeholder={validation.values['settings.lateFeeType'] === 'percentage' ? '5' : '0'}
//                           />
//                           <FormFeedback>{validation.errors['settings.lateFeeValue']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4} style={{ display: "none" }}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Grace Period (Days) <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="number"
//                             name="settings.gracePeriodDays"
//                             value={validation.values['settings.gracePeriodDays']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['settings.gracePeriodDays'] && !!validation.errors['settings.gracePeriodDays']}
//                             min="0"
//                             placeholder="5"
//                           />
//                           <FormFeedback>{validation.errors['settings.gracePeriodDays']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Invoice Due Days <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="number"
//                             name="settings.invoiceDueDays"
//                             value={validation.values['settings.invoiceDueDays']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['settings.invoiceDueDays'] && !!validation.errors['settings.invoiceDueDays']}
//                             min="1"
//                             placeholder="5"
//                           />
//                           <FormFeedback>{validation.errors['settings.invoiceDueDays']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                       <Col md={4}>
//                         <FormGroup>
//                           <Label className="form-label">
//                             Rent Due Day <span className="text-danger">*</span>
//                           </Label>
//                           <Input
//                             type="number"
//                             name="settings.rentDueDay"
//                             value={validation.values['settings.rentDueDay']}
//                             onChange={validation.handleChange}
//                             onBlur={validation.handleBlur}
//                             invalid={validation.touched['settings.rentDueDay'] && !!validation.errors['settings.rentDueDay']}
//                             min="1"
//                             max="31"
//                             placeholder="1"
//                           />
//                           <FormFeedback>{validation.errors['settings.rentDueDay']}</FormFeedback>
//                         </FormGroup>
//                       </Col>
//                     </Row>
//                   </CardBody>
//                 </Card>
//               </Col>
//             </Row>
//           </ModalBody>
//           <ModalFooter className="bg-light">
//             <Button color="light" onClick={() => setModal(false)} className="me-2">
//               <i className="ri-close-line me-1"></i>
//               Cancel
//             </Button>
//             <Button
//               color="primary"
//               type="submit"
//               disabled={validation.isSubmitting}
//               className="px-4"
//             >
//               {validation.isSubmitting ? (
//                 <>
//                   <i className="ri-loader-4-line spin me-1"></i>
//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <i className="ri-save-line me-1"></i>
//                   {organization ? 'Update Profile' : 'Create Profile'}
//                 </>
//               )}
//             </Button>
//           </ModalFooter>
//         </Form>
//       </Modal>

//       <ToastContainer />
//     </div>
//   );
// };

// export default Organization;
