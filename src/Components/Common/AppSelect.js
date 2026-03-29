import React from "react";
import ReactSelect from "react-select";

const defaultStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const AppSelect = ({
  className = "react-select",
  classNamePrefix = "select",
  placeholder = "Select an option",
  styles,
  menuPortalTarget,
  ...props
}) => (
  <ReactSelect
    className={className}
    classNamePrefix={classNamePrefix}
    placeholder={placeholder}
    styles={{ ...defaultStyles, ...styles }}
    menuPortalTarget={menuPortalTarget || (typeof document !== "undefined" ? document.body : null)}
    {...props}
  />
);

export default AppSelect;
