import React from "react";
import { Button, UncontrolledTooltip } from "reactstrap";

const ActionIconButton = ({
  id,
  icon,
  tooltip,
  onClick,
  disabled = false,
  type = "button",
}) => (
  <>
    <Button
      type={type}
      size="sm"
      color="light"
      onClick={onClick}
      disabled={disabled}
      id={id}
      className="rounded-circle p-2"
    >
      {icon}
    </Button>
    {tooltip ? <UncontrolledTooltip target={id}>{tooltip}</UncontrolledTooltip> : null}
  </>
);

export default ActionIconButton;
