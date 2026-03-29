import React from "react";
import { Badge, Card, CardBody, Col, Container, Row } from "reactstrap";
import { FiCheckCircle, FiCreditCard, FiHome, FiMail, FiShield, FiUser } from "react-icons/fi";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import useAuthUser from "../../Components/Hooks/useAuthUser";

const ProfileStat = ({ icon: Icon, label, value, color }) => (
  <Card className="border-0 shadow-sm h-100">
    <CardBody className="p-4">
      <div className="d-flex align-items-center gap-3">
        <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
          <Icon size={20} className={`text-${color}`} />
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fw-semibold">{value || "-"}</div>
        </div>
      </div>
    </CardBody>
  </Card>
);

const Profile = () => {
  document.title = "My Profile | Apartment Management";
  const authUser = useAuthUser();

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="My Profile" pageTitle="Account" />

        <Card className="border-0 shadow-sm overflow-hidden mb-4">
          <div
            style={{
              background: "linear-gradient(135deg, #0f766e 0%, #164e63 55%, #0f172a 100%)",
              padding: "2.5rem",
            }}
          >
            <Row className="align-items-center g-4">
              <Col lg={8}>
                <div className="d-flex align-items-center gap-4">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{
                      width: "88px",
                      height: "88px",
                      fontSize: "2rem",
                      background: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    {(authUser?.firstName || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white">
                    <div className="small text-white-50 mb-2">Logged-in user profile</div>
                    <h2 className="mb-2 text-white">{authUser?.fullName || "Administrator"}</h2>
                    <div className="d-flex flex-wrap gap-2">
                      <Badge color="light" className="text-dark px-3 py-2">
                        <FiShield className="me-2" />
                        {authUser?.role || "Admin"}
                      </Badge>
                      <Badge color="light" className="text-dark px-3 py-2">
                        <FiCheckCircle className="me-2" />
                        {authUser?.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Col>
              <Col lg={4}>
                <div className="bg-white bg-opacity-10 rounded-4 p-4 text-white border border-white border-opacity-10">
                  <div className="small text-white-50 mb-1">Email Address</div>
                  <div className="fw-semibold mb-3">{authUser?.email || "-"}</div>
              <div className="small text-white-50 mb-1">Organization</div>
              <div className="fw-semibold">{authUser?.organizationId || "-"}</div>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <ProfileStat icon={FiUser} label="Full Name" value={authUser?.fullName} color="primary" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <ProfileStat icon={FiMail} label="Email" value={authUser?.email} color="info" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <ProfileStat icon={FiShield} label="Role" value={authUser?.role} color="success" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <ProfileStat
              icon={FiHome}
              label="Accessible Buildings"
              value={authUser?.accessibleBuildings?.length ?? 0}
              color="warning"
            />
          </Col>
        </Row>

        <Row>
          <Col xl={8} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4">
                <h5 className="mb-4">Profile Details</h5>
                <Row className="g-4">
                  <Col md={6}>
                    <div className="text-muted small mb-1">First Name</div>
                    <div className="fw-semibold">{authUser?.firstName || "-"}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Last Name</div>
                    <div className="fw-semibold">{authUser?.lastName || "-"}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Email</div>
                    <div className="fw-semibold">{authUser?.email || "-"}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Role</div>
                    <div className="fw-semibold text-capitalize">{authUser?.role || "-"}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Organization ID</div>
                    <div className="fw-semibold">{authUser?.organizationId || "-"}</div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          <Col xl={4} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4">
                <h5 className="mb-4">Account Security</h5>
                <div className="rounded-4 p-4 bg-light">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-success bg-opacity-10 rounded-3 p-3">
                      <FiCreditCard size={20} className="text-success" />
                    </div>
                    <div>
                      <div className="fw-semibold">Protected Login</div>
                      <div className="small text-muted">OTP verification is enabled for your account</div>
                    </div>
                  </div>
                  <div className="small text-muted">
                    Use the change password screen to rotate your password whenever needed.
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;
