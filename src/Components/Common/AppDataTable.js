import React from "react";
import ReactDataTable from "react-data-table-component";
import Loader from "./Loader";
import NoDataFound from "./NoDataFound";

const AppDataTable = ({ emptyStateProps, loaderProps, ...props }) => (
  <ReactDataTable
    noDataComponent={<NoDataFound {...emptyStateProps} />}
    progressComponent={<Loader {...loaderProps} />}
    {...props}
  />
);

export default AppDataTable;
