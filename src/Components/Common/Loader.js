import React, { useEffect } from "react";
import { Spinner } from "reactstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Loader = ({ error, text = "Loading...", className = "py-4", inline = false }) => {
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        hideProgressBar: false,
      });
    }
  }, [error]);

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center gap-2 ${className}`.trim()}>
      <Spinner color="primary" />
      {!inline ? <span className="text-muted small">{text}</span> : null}
    </div>
  );
};

export default Loader;
