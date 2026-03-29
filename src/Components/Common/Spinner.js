import React, { useEffect } from "react";
import Loader from "./Loader";

const Spinners = ({ setLoading }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setLoading]);

  return <Loader className="position-absolute top-50 start-50 translate-middle" inline />;
};

export default Spinners;
