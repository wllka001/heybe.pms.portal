import React from "react";
import { Button } from "reactstrap";

const NoDataFound = ({
  icon = "ri-inbox-line",
  title = "No Data Found",
  description = "There is nothing to display right now.",
  actionLabel,
  onAction,
}) => (
  <div className="text-center py-5 px-3">
    <i className={`${icon} display-5 text-muted`} />
    <h5 className="mt-3 mb-2">{title}</h5>
    <p className="text-muted mb-0">{description}</p>
    {actionLabel && onAction ? (
      <Button color="primary" size="sm" className="mt-3" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default NoDataFound;
