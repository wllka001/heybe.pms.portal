import React, { useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, FormFeedback, Input, Label, Row, Spinner } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiCheckCircle, FiLock, FiShield } from "react-icons/fi";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { changePassword } from "../../../helpers/backend_helper";
import { logoutUser } from "../../../slices/auth/login/thunk";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const PasswordField = ({ id, label, placeholder, value, onChange, onBlur, invalid, error, visible, onToggle }) => (
  <div className="mb-3">
    <Label className="form-label text-muted small mb-1" htmlFor={id}>{label}</Label>
    <div className="position-relative auth-pass-inputgroup">
      <Input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        className="form-control pe-5"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        invalid={invalid}
      />
      {invalid ? <FormFeedback>{error}</FormFeedback> : null}
      <button
        className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted material-shadow-none"
        type="button"
        onClick={onToggle}
      >
        <i className={`ri-eye${visible ? "-off" : ""}-line align-middle`}></i>
      </button>
    </div>
  </div>
);

const ChangePassword = () => {
  document.title = "Change Password | Apartment Management";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passwordShow, setPasswordShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Enter your current password"),
      newPassword: Yup.string()
        .required("Enter a new password")
        .min(8, "Password must be at least 8 characters")
        .matches(/[a-z]/, "Password must include a lowercase letter")
        .matches(/[A-Z]/, "Password must include an uppercase letter")
        .matches(/\d/, "Password must include a number")
        .matches(/[^A-Za-z0-9]/, "Password must include a special character")
        .notOneOf([Yup.ref("currentPassword")], "New password must be different from current password"),
      confirmPassword: Yup.string()
        .required("Confirm your new password")
        .oneOf([Yup.ref("newPassword")], "Passwords do not match"),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      setError("");
      setSuccess("");

      try {
        const response = await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });

        if (response?.success) {
          setSuccess(response.message || "Password changed successfully. Please sign in again.");
          formik.resetForm();
          setTimeout(() => {
            dispatch(logoutUser());
            navigate("/login");
          }, 1400);
        }
      } catch (err) {
        setError(err?.message || "Failed to change password");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const togglePassword = (field) => {
    setPasswordShow((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Change Password" pageTitle="Account" />

        <Card className="border-0 shadow-sm overflow-hidden mb-4">
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #164e63 55%, #0f766e 100%)",
              padding: "2.5rem",
            }}
          >
            <Row className="align-items-center g-4">
              <Col lg={8}>
                <div className="d-flex align-items-center gap-4">
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center"
                    style={{
                      width: "84px",
                      height: "84px",
                      background: "rgba(255,255,255,0.14)",
                      color: "#fff",
                    }}
                  >
                    <FiLock size={34} />
                  </div>
                  <div className="text-white">
                    <div className="small text-white-50 mb-2">Security settings</div>
                    <h2 className="mb-2 text-white">Change your password</h2>
                    <p className="mb-0 text-white-50">
                      Keep your account secure with a strong password you do not use anywhere else.
                    </p>
                  </div>
                </div>
              </Col>
              <Col lg={4}>
                <div className="bg-white bg-opacity-10 rounded-4 p-4 text-white border border-white border-opacity-10">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FiShield />
                    <span className="fw-semibold">Password rules</span>
                  </div>
                  <div className="small text-white-50">Minimum 8 characters with uppercase, lowercase, number, and special character.</div>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        <Row>
          <Col xl={7} className="mb-4">
            <Card className="border-0 shadow-sm">
              <CardBody className="p-4">
                <h5 className="mb-4">Update Password</h5>
                {error ? <Alert color="danger">{error}</Alert> : null}
                {success ? <Alert color="success">{success}</Alert> : null}

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    formik.handleSubmit();
                  }}
                >
                  <PasswordField
                    id="currentPassword"
                    label="Current Password"
                    placeholder="Enter current password"
                    value={formik.values.currentPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.currentPassword && !!formik.errors.currentPassword}
                    error={formik.errors.currentPassword}
                    visible={passwordShow.currentPassword}
                    onToggle={() => togglePassword("currentPassword")}
                  />

                  <PasswordField
                    id="newPassword"
                    label="New Password"
                    placeholder="Enter new password"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.newPassword && !!formik.errors.newPassword}
                    error={formik.errors.newPassword}
                    visible={passwordShow.newPassword}
                    onToggle={() => togglePassword("newPassword")}
                  />

                  <PasswordField
                    id="confirmPassword"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                    error={formik.errors.confirmPassword}
                    visible={passwordShow.confirmPassword}
                    onToggle={() => togglePassword("confirmPassword")}
                  />

                  <Button color="success" className="w-100 mt-2" type="submit" disabled={submitting}>
                    {submitting ? <Spinner size="sm" className="me-2" /> : <FiCheckCircle className="me-2" />}
                    Save New Password
                  </Button>
                </form>
              </CardBody>
            </Card>
          </Col>

          <Col xl={5} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4">
                <h5 className="mb-4">Security Tips</h5>
                <div className="bg-light rounded-4 p-4 mb-3">
                  <div className="fw-semibold mb-2">Use a unique password</div>
                  <div className="text-muted small">Do not reuse passwords from your email, banking, or other systems.</div>
                </div>
                <div className="bg-light rounded-4 p-4 mb-3">
                  <div className="fw-semibold mb-2">Make it strong</div>
                  <div className="text-muted small">Combine uppercase, lowercase, numbers, and symbols for better protection.</div>
                </div>
                <div className="bg-light rounded-4 p-4">
                  <div className="fw-semibold mb-2">Sign in again after update</div>
                  <div className="text-muted small">For security, you will be signed out after your password is changed successfully.</div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChangePassword;
