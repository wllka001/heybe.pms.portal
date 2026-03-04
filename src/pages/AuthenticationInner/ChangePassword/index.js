// import React, { useEffect, useState } from "react";
// import {
//   Alert,
//   Button,
//   Card,
//   Col,
//   Container,
//   FormFeedback,
//   Input,
//   Label,
//   Row,
//   Spinner,
// } from "reactstrap";
// import { useNavigate } from "react-router-dom";
// import { useFormik } from "formik";
// import * as Yup from "yup";

// import AuthSlider from "../authCarousel";
// import { changePassword } from "../../../helpers/backend_helper";
// import { setAuthorization } from "../../../helpers/api_helper";
// import useAuthUser from "../../../Components/Hooks/useAuthUser";

// const ChangePassword = () => {
//   const navigate = useNavigate();
//   const authUser = useAuthUser();
//   const [passwordShow, setPasswordShow] = useState({
//     current: false,
//     next: false,
//     confirm: false,
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   useEffect(() => {
//     if (!authUser?.token) {
//       navigate("/login");
//       return;
//     }

//     setAuthorization(authUser.token);

//     // if (authUser?.raw?.data?.staff?.mustChangePassword === false) {
//     //   navigate("/auth-twostep");
//     // }
//   }, [authUser, navigate]);

//   const validation = useFormik({
//     enableReinitialize: true,
//     initialValues: {
//       currentPassword: "",
//       newPassword: "",
//       confirmPassword: "",
//     },
//     validationSchema: Yup.object({
//       currentPassword: Yup.string().required(
//         "Please enter your current password",
//       ),
//       newPassword: Yup.string()
//         .required("Please enter a new password")
//         .min(8, "Password must be at least 8 characters")
//         .matches(/[a-z]/, "Password must include a lowercase letter")
//         .matches(/[A-Z]/, "Password must include an uppercase letter")
//         .matches(/\d/, "Password must include a number")
//         .matches(/[^A-Za-z0-9]/, "Password must include a special character")
//         .notOneOf(
//           [Yup.ref("currentPassword")],
//           "New password must be different from current password",
//         ),
//       confirmPassword: Yup.string()
//         .required("Please confirm your new password")
//         .oneOf([Yup.ref("newPassword")], "Passwords do not match"),
//     }),
//     onSubmit: async (values) => {
//       setSubmitting(true);
//       setError("");
//       setSuccess("");
//       try {
//         const response = await changePassword({
//           currentPassword: values.currentPassword,
//           newPassword: values.newPassword,
//         });

//         if (response?.success) {
//           setSuccess(response?.message || "Password changed successfully");
//           validation.resetForm();
//           setTimeout(() => navigate("/auth-twostep"), 800);
//         } else {
//           setError(response?.message || "Failed to change password");
//         }
//       } catch (err) {
//         setError(err?.message || "Failed to change password");
//       } finally {
//         setSubmitting(false);
//       }
//     },
//   });

//   document.title = "Change Password | Test Web";

//   return (
//     <React.Fragment>
//       <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
//         <div className="bg-overlay"></div>
//         <div className="auth-page-content overflow-hidden pt-lg-5">
//           <Container>
//             <Row>
//               <Col lg={12}>
//                 <Card className="overflow-hidden card-bg-fill galaxy-border-none">
//                   <Row className="g-0">
//                     <AuthSlider />
//                     <Col lg={6}>
//                       <div className="p-lg-5 p-4">
//                         <div className="mb-4 text-center">
//                           <div className="avatar-lg mx-auto">
//                             <div className="avatar-title bg-light text-primary display-5 rounded-circle">
//                               <i className="ri-lock-2-line"></i>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="text-muted text-center mx-lg-3">
//                           <h4 className="">Change Password</h4>
//                           <p>Please update your password to continue.</p>
//                         </div>

//                         {error ? <Alert color="danger">{error}</Alert> : null}
//                         {success ? (
//                           <Alert color="success">{success}</Alert>
//                         ) : null}

//                         <div className="mt-4">
//                           <form
//                             onSubmit={(e) => {
//                               e.preventDefault();
//                               validation.handleSubmit();
//                               return false;
//                             }}
//                             action="#"
//                           >
//                             <div className="mb-3">
//                               <Label
//                                 className="form-label"
//                                 htmlFor="currentPassword"
//                               >
//                                 Current Password
//                               </Label>
//                               <div className="position-relative auth-pass-inputgroup">
//                                 <Input
//                                   id="currentPassword"
//                                   name="currentPassword"
//                                   type={
//                                     passwordShow.current ? "text" : "password"
//                                   }
//                                   className="form-control pe-5"
//                                   placeholder="Enter current password"
//                                   onChange={validation.handleChange}
//                                   onBlur={validation.handleBlur}
//                                   value={validation.values.currentPassword}
//                                   invalid={
//                                     validation.touched.currentPassword &&
//                                       validation.errors.currentPassword
//                                       ? true
//                                       : false
//                                   }
//                                 />
//                                 {validation.touched.currentPassword &&
//                                   validation.errors.currentPassword ? (
//                                   <FormFeedback type="invalid">
//                                     {validation.errors.currentPassword}
//                                   </FormFeedback>
//                                 ) : null}
//                                 <button
//                                   className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted material-shadow-none"
//                                   type="button"
//                                   onClick={() =>
//                                     setPasswordShow((prev) => ({
//                                       ...prev,
//                                       current: !prev.current,
//                                     }))
//                                   }
//                                 >
//                                   <i className="ri-eye-fill align-middle"></i>
//                                 </button>
//                               </div>
//                             </div>

//                             <div className="mb-3">
//                               <Label
//                                 className="form-label"
//                                 htmlFor="newPassword"
//                               >
//                                 New Password
//                               </Label>
//                               <div className="position-relative auth-pass-inputgroup">
//                                 <Input
//                                   id="newPassword"
//                                   name="newPassword"
//                                   type={passwordShow.next ? "text" : "password"}
//                                   className="form-control pe-5"
//                                   placeholder="Enter new password"
//                                   onChange={validation.handleChange}
//                                   onBlur={validation.handleBlur}
//                                   value={validation.values.newPassword}
//                                   invalid={
//                                     validation.touched.newPassword &&
//                                       validation.errors.newPassword
//                                       ? true
//                                       : false
//                                   }
//                                 />
//                                 {validation.touched.newPassword &&
//                                   validation.errors.newPassword ? (
//                                   <FormFeedback type="invalid">
//                                     {validation.errors.newPassword}
//                                   </FormFeedback>
//                                 ) : null}
//                                 <button
//                                   className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted material-shadow-none"
//                                   type="button"
//                                   onClick={() =>
//                                     setPasswordShow((prev) => ({
//                                       ...prev,
//                                       next: !prev.next,
//                                     }))
//                                   }
//                                 >
//                                   <i className="ri-eye-fill align-middle"></i>
//                                 </button>
//                               </div>
//                               <div className="mt-2 text-muted small">
//                                 Password must be at least 8 characters and
//                                 include uppercase, lowercase, number, and
//                                 special character.
//                               </div>
//                             </div>

//                             <div className="mb-4">
//                               <Label
//                                 className="form-label"
//                                 htmlFor="confirmPassword"
//                               >
//                                 Confirm New Password
//                               </Label>
//                               <div className="position-relative auth-pass-inputgroup">
//                                 <Input
//                                   id="confirmPassword"
//                                   name="confirmPassword"
//                                   type={
//                                     passwordShow.confirm ? "text" : "password"
//                                   }
//                                   className="form-control pe-5"
//                                   placeholder="Confirm new password"
//                                   onChange={validation.handleChange}
//                                   onBlur={validation.handleBlur}
//                                   value={validation.values.confirmPassword}
//                                   invalid={
//                                     validation.touched.confirmPassword &&
//                                       validation.errors.confirmPassword
//                                       ? true
//                                       : false
//                                   }
//                                 />
//                                 {validation.touched.confirmPassword &&
//                                   validation.errors.confirmPassword ? (
//                                   <FormFeedback type="invalid">
//                                     {validation.errors.confirmPassword}
//                                   </FormFeedback>
//                                 ) : null}
//                                 <button
//                                   className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted material-shadow-none"
//                                   type="button"
//                                   onClick={() =>
//                                     setPasswordShow((prev) => ({
//                                       ...prev,
//                                       confirm: !prev.confirm,
//                                     }))
//                                   }
//                                 >
//                                   <i className="ri-eye-fill align-middle"></i>
//                                 </button>
//                               </div>
//                             </div>

//                             <div className="mt-3">
//                               <Button
//                                 color="success"
//                                 className="w-100"
//                                 type="submit"
//                                 disabled={submitting}
//                               >
//                                 {submitting ? (
//                                   <Spinner size="sm" className="me-2">
//                                     Loading...
//                                   </Spinner>
//                                 ) : null}
//                                 Change Password
//                               </Button>
//                             </div>
//                           </form>
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </Card>
//               </Col>
//             </Row>
//           </Container>
//         </div>

//         <footer className="footer">
//           <Container>
//             <Row>
//               <Col lg={12}>
//                 <div className="text-center">
//                   <p className="mb-0">
//                     &copy; {new Date().getFullYear()} Crafted with{" "}
//                     <i className="mdi mdi-heart text-danger"></i> by apartment
//                   </p>
//                 </div>
//               </Col>
//             </Row>
//           </Container>
//         </footer>
//       </div>
//     </React.Fragment>
//   );
// };

// export default ChangePassword;
