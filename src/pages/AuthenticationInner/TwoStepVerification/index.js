import AuthSlider from "../authCarousel";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { resendUserLoginOtp, verifyUserLoginOtp } from "../../../slices/thunks";

const OTP_LENGTH = 6;

const TwosVerify = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const inputsRef = useRef([]);
    const lastSubmittedCodeRef = useRef("");
    const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
    const [resendMessage, setResendMessage] = useState("");

    const pendingLogin = useMemo(
        () => JSON.parse(sessionStorage.getItem("pendingLogin") || "null"),
        [],
    );

    const loginpageData = createSelector(
        (state) => state,
        (state) => ({
            error: state.Login.error,
            loading: state.Login.loading,
        }),
    );

    const { error, loading } = useSelector(loginpageData);

    useEffect(() => {
        if (!pendingLogin?.challengeId || !pendingLogin?.email) {
            navigate("/login");
        }
    }, [navigate, pendingLogin]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (!loading) {
            lastSubmittedCodeRef.current = "";
        }
    }, [loading]);

    const code = otpDigits.join("");

    const submitOtp = (otpCode) => {
        if (
            loading ||
            otpCode.length !== OTP_LENGTH ||
            !pendingLogin?.challengeId ||
            !pendingLogin?.email ||
            lastSubmittedCodeRef.current === otpCode
        ) {
            return;
        }

        lastSubmittedCodeRef.current = otpCode;
        dispatch(
            verifyUserLoginOtp(
                {
                    email: pendingLogin.email,
                    challengeId: pendingLogin.challengeId,
                    otp: otpCode,
                },
                navigate,
            ),
        );
    };

    const updateDigit = (index, value) => {
        const sanitizedValue = value.replace(/\D/g, "").slice(-1);
        const nextDigits = [...otpDigits];
        nextDigits[index] = sanitizedValue;
        setOtpDigits(nextDigits);
        setResendMessage("");

        if (sanitizedValue && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        const nextCode = nextDigits.join("");
        if (nextCode.length === OTP_LENGTH && nextDigits.every(Boolean)) {
            submitOtp(nextCode);
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event) => {
        const pastedText = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pastedText) {
            return;
        }

        event.preventDefault();

        const nextDigits = Array(OTP_LENGTH)
            .fill("")
            .map((_, index) => pastedText[index] || "");

        setOtpDigits(nextDigits);
        setResendMessage("");

        if (pastedText.length === OTP_LENGTH) {
            submitOtp(pastedText);
            inputsRef.current[OTP_LENGTH - 1]?.blur();
            return;
        }

        inputsRef.current[Math.min(pastedText.length, OTP_LENGTH - 1)]?.focus();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        submitOtp(code);
    };

    const handleResend = async (event) => {
        event.preventDefault();

        if (!pendingLogin?.challengeId || !pendingLogin?.email) {
            navigate("/login");
            return;
        }

        await dispatch(
            resendUserLoginOtp({
                email: pendingLogin.email,
                challengeId: pendingLogin.challengeId,
            }),
        );

        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setResendMessage("A new OTP has been sent to your email.");
        inputsRef.current[0]?.focus();
    };

    return (
        <React.Fragment>
            <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
                <div className="bg-overlay"></div>
                <div className="auth-page-content overflow-hidden pt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <Card className="overflow-hidden card-bg-fill galaxy-border-none">
                                    <Row className="justify-content-center g-0">
                                        <AuthSlider />
                                        <Col lg={6}>
                                            <div className="p-lg-5 p-4">
                                                <div className="mb-4">
                                                    <div className="avatar-lg mx-auto">
                                                        <div className="avatar-title bg-light text-primary display-5 rounded-circle">
                                                            <i className="ri-mail-line"></i>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-muted text-center mx-lg-3">
                                                    <h4>Verify Your Email</h4>
                                                    <p>
                                                        Enter the 6 digit OTP sent to{" "}
                                                        <span className="fw-semibold">{pendingLogin?.email || "-"}</span>
                                                    </p>
                                                </div>

                                                {error ? <Alert color="danger">{error}</Alert> : null}
                                                {resendMessage ? <Alert color="success">{resendMessage}</Alert> : null}

                                                <div className="mt-4">
                                                    <form onSubmit={handleSubmit}>
                                                        <Row>
                                                            {otpDigits.map((digit, index) => (
                                                                <Col className="col-2" key={index}>
                                                                    <div className="mb-3">
                                                                        <label htmlFor={`digit${index + 1}-input`} className="visually-hidden">
                                                                            Digit {index + 1}
                                                                        </label>
                                                                        <input
                                                                            ref={(element) => {
                                                                                inputsRef.current[index] = element;
                                                                            }}
                                                                            type="text"
                                                                            className="form-control form-control-lg bg-light border-light text-center"
                                                                            inputMode="numeric"
                                                                            autoComplete={index === 0 ? "one-time-code" : "off"}
                                                                            maxLength="1"
                                                                            id={`digit${index + 1}-input`}
                                                                            placeholder="0"
                                                                            aria-label={`OTP digit ${index + 1}`}
                                                                            value={digit}
                                                                            onChange={(event) => updateDigit(index, event.target.value)}
                                                                            onKeyDown={(event) => handleKeyDown(index, event)}
                                                                            onPaste={handlePaste}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                            ))}
                                                        </Row>

                                                        <div className="text-center text-muted small mb-3">
                                                            Type or paste the full 6 digit OTP here
                                                        </div>

                                                        <div className="mt-3">
                                                            <Button
                                                                color="success"
                                                                className="w-100"
                                                                type="submit"
                                                                disabled={loading || code.length !== OTP_LENGTH}
                                                            >
                                                                {loading ? <Spinner size="sm" className="me-2" /> : null}
                                                                Verify OTP
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>

                                                <div className="mt-5 text-center">
                                                    <p className="mb-0">
                                                        Didn&apos;t receive a code?{" "}
                                                        <Button
                                                            color="link"
                                                            className="fw-semibold text-primary text-decoration-underline p-0 border-0"
                                                            onClick={handleResend}
                                                            disabled={loading}
                                                        >
                                                            Resend OTP
                                                        </Button>
                                                    </p>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
                <footer className="footer">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center">
                                    <p className="mb-0">
                                        &copy; {new Date().getFullYear()} Crafted with{" "}
                                        <i className="mdi mdi-heart text-danger"></i> by apartment
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </React.Fragment>
    );
};

export default TwosVerify;
