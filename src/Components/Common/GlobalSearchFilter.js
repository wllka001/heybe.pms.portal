import React, { useState } from 'react';
import {
    Col,
    Row,
    Button,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownItem,
    DropdownMenu,
} from "reactstrap";
import { Link } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import AppSelect from "./AppSelect";

const ProductsGlobalFilter = () => {
    return (
        <React.Fragment>
            <div className="col-sm-auto ms-auto">
                <div>
                    <Link
                        to="/apps-ecommerce-add-product"
                        className="btn btn-success"
                    >
                        <i className="ri-add-line align-bottom me-1"></i> Add
                        Product
                    </Link>
                </div>
            </div>
        </React.Fragment>
    );
};
const CustomersGlobalFilter = () => {
    const [customerStatus, setcustomerStatus] = useState(null);

    function handlecustomerStatus(customerStatus) {
        setcustomerStatus(customerStatus);
    }

    const customerstatus = [
        {
            options: [
                { label: "Status", value: "Status" },
                { label: "All", value: "All" },
                { label: "Active", value: "Active" },
                { label: "Block", value: "Block" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <Col xl={7}>
                <Row className="g-3">
                    <Col sm={4}>
                        <div className="">
                            <Flatpickr
                                className="form-control"
                                id="datepicker-publish-input"
                                placeholder="Select a date"
                                options={{
                                    altInput: true,
                                    altFormat: "F j, Y",
                                    mode: "multiple",
                                    dateFormat: "d.m.y",
                                }}
                            />
                        </div>
                    </Col>

                    <Col sm={4}>
                        <div>
                            <Select
                                value={customerStatus}
                                onChange={(e) => {
                                    handlecustomerStatus(e.value);
                                }}
                                options={customerstatus}
                                name="choices-single-default"
                                id="idStatus"
                            ></Select>
                        </div>
                    </Col>

                    <Col sm={4}>
                        <div>
                            <button
                                type="button"
                                className="btn btn-primary w-100"
                            >
                                {" "}
                                <i className="ri-equalizer-fill me-2 align-bottom"></i>
                                Filters
                            </button>
                        </div>
                    </Col>
                </Row>
            </Col>
        </React.Fragment>
    );
};

const OrderGlobalFilter = () => {
    const [orderStatus, setorderStatus] = useState([]);
    const [orderPayement, setorderPayement] = useState(null);

    function handleorderStatus(orderstatus) {
        setorderStatus(orderstatus);
    }

    function handleorderPayement(orderPayement) {
        setorderPayement(orderPayement);
    }

    const orderstatus = [
        {
            options: [
                { label: "Status", value: "Status" },
                { label: "All", value: "All" },
                { label: "Pending", value: "Pending" },
                { label: "Inprogress", value: "Inprogress" },
                { label: "Cancelled", value: "Cancelled" },
                { label: "Pickups", value: "Pickups" },
                { label: "Returns", value: "Returns" },
                { label: "Delivered", value: "Delivered" },
            ],
        },
    ];

    const orderpayement = [
        {
            options: [
                { label: "Select Payment", value: "Select Payment" },
                { label: "All", value: "All" },
                { label: "Mastercard", value: "Mastercard" },
                { label: "Paypal", value: "Paypal" },
                { label: "Visa", value: "Visa" },
                { label: "COD", value: "COD" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <Col sm={6} className="col-xxl-2">
                <div>
                    <Flatpickr
                        className="form-control"
                        id="datepicker-publish-input"
                        placeholder="Select a date"
                        options={{
                            altInput: true,
                            altFormat: "F j, Y",
                            mode: "multiple",
                            dateFormat: "d.m.y",
                        }}
                    />
                </div>
            </Col>

            <Col sm={4} className="col-xxl-2">
                <div>
                    <Select
                        value={orderStatus}
                        onChange={(e) => {
                            handleorderStatus(e);
                        }}
                        options={orderstatus}
                        name="choices-single-default"
                        id="idStatus"
                    ></Select>
                </div>
            </Col>

            <Col sm={4} className="col-xxl-2">
                <div>
                    <Select
                        value={orderPayement}
                        onChange={() => {
                            handleorderPayement();
                        }}
                        options={orderpayement}
                        name="choices-payment-default"
                        id="idPayment"
                    ></Select>
                </div>
            </Col>

            <Col sm={4} className="col-xxl-1">
                <div>
                    <button type="button" className="btn btn-primary w-100">
                        {" "}
                        <i className="ri-equalizer-fill me-1 align-bottom"></i>
                        Filters
                    </button>
                </div>
            </Col>
        </React.Fragment>
    );
};

const ContactsGlobalFilter = () => {
    const [sortBy, setsortBy] = useState(null);

    function handlesortBy(sortBy) {
        setsortBy(sortBy);
    }

    const sortbyname = [
        {
            options: [
                { label: "Owner", value: "Owner" },
                { label: "Company", value: "Company" },
                { label: "Location", value: "Location" }
            ],
        },
    ];
    return (
        <React.Fragment>
            <div className="col-md-auto ms-auto">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Sort by: </span>
                    <Select
                        className="mb-0"
                        value={sortBy}
                        onChange={() => {
                            handlesortBy();
                        }}
                        options={sortbyname}
                        id="choices-single-default"
                    >
                    </Select>
                </div>
            </div>
        </React.Fragment>
    );
};

const CompaniesGlobalFilter = () => {
    const [sortBy, setsortBy] = useState("Owner");

    function handlesortBy(sortBy) {
        setsortBy(sortBy);
    }

    const sortbyname = [
        {
            options: [
                { label: "Owner", value: "Owner" },
                { label: "Company", value: "Company" },
                { label: "Location", value: "Location" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <div className="col-md-auto ms-auto">
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Sort by: </span>
                    <Select
                        className="mb-0"
                        value={sortBy}
                        onChange={() => {
                            handlesortBy();
                        }}
                        options={sortbyname}
                        id="choices-single-default"
                    ></Select>
                </div>
            </div>
        </React.Fragment>
    );
};

const CryptoOrdersGlobalFilter = () => {
    const typeOptions = [
        { value: "buy", label: "Buy" },
        { value: "sell", label: "Sell" },
    ];
    const statusOptions = [
        { value: "successful", label: "Successful" },
        { value: "cancelled", label: "Cancelled" },
        { value: "pending", label: "Pending" },
    ];

    return (
        <React.Fragment>
            <Col xl={2} md={6}>
                <div className="input-group">
                    <span className="input-group-text" id="basic-addon1"><i className="ri-calendar-2-line"></i></span>
                    <Flatpickr
                        placeholder="Select date"
                        className="form-control"
                        options={{
                            mode: "range",
                            dateFormat: "d M, Y"
                        }}
                    />
                </div>
            </Col>
            <Col xl={2} md={4}>
                <AppSelect
                    options={typeOptions}
                    placeholder="Select order type"
                    isSearchable={false}
                />
            </Col>
            <Col xl={2} md={4}>
                <AppSelect
                    options={statusOptions}
                    placeholder="Select status"
                    isSearchable={false}
                />
            </Col>
            <Col xl={1} md={4}>
                <button className="btn btn-success w-100">Filters</button>
            </Col>
        </React.Fragment>
    );
};

const InvoiceListGlobalSearch = () => {
    const [isStatus, setisStatus] = useState(null);


    function handleisStatus(isStatus) {
        setisStatus(isStatus);
    }

    const allstatus = [
        {
            options: [
                { label: "Status", value: "Status" },
                { label: "All", value: "All" },
                { label: "Unpaid", value: "Unpaid" },
                { label: "Paid", value: "Paid" },
                { label: "Cancel", value: "Cancel" },
                { label: "Refund", value: "Refund" },
            ],
        },
    ];
    return (
        <React.Fragment>
            <Col sm={4} xxl={3}>
                <Flatpickr
                    className="form-control bg-light border-light"
                    id="datepicker-publish-input"
                    placeholder="Select a date"
                    options={{
                        altInput: true,
                        altFormat: "F j, Y",
                        mode: "multiple",
                        dateFormat: "d.m.y",
                    }}
                />
            </Col>

            <Col sm={4} xxl={3}>
                <div className="input-light">
                    <AppSelect
                        value={isStatus}
                        onChange={() => {
                            handleisStatus();
                        }}
                        options={allstatus}
                        name="choices-single-default"
                        id="idStatus"
                    />
                </div>
            </Col>

            <Col sm={4} xxl={1}>
                <Button color="primary" className="w-100">
                    <i className="ri-equalizer-fill me-1 align-bottom"></i>{" "}
                    Filters
                </Button>
            </Col>

        </React.Fragment>
    );
};

const TicketsListGlobalFilter = () => {
    const statusOptions = [
        { value: "all", label: "All" },
        { value: "open", label: "Open" },
        { value: "inprogress", label: "In Progress" },
        { value: "closed", label: "Closed" },
        { value: "new", label: "New" },
    ];

    return (
        <React.Fragment>
            <Col xxl={3} sm={4}>
                <Flatpickr
                    className="form-control"
                    placeholder="Select date range"
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y"
                    }}
                />
            </Col>
            <Col xxl={3} sm={4}>
                <div className="input-light">
                    <AppSelect
                        options={statusOptions}
                        placeholder="Select status"
                        isSearchable={false}
                    />
                </div>
            </Col>
            <Col xxl={1} sm={4}>
                <button type="button" className="btn btn-primary w-100"> <i className="ri-equalizer-fill me-1 align-bottom"></i>
                    Filters
                </button>
            </Col>
        </React.Fragment>
    );
};

const NFTRankingGlobalFilter = () => {
    const rangeOptions = [
        { value: "all-time", label: "All Time" },
        { value: "1-day", label: "1 Day" },
        { value: "7-days", label: "7 Days" },
        { value: "15-days", label: "15 Days" },
        { value: "1-month", label: "1 Month" },
        { value: "6-months", label: "6 Months" },
    ];

    return (
        <React.Fragment>
            <Col xxl={2} sm={4} className="ms-auto">
                <div>
                    <AppSelect
                        options={rangeOptions}
                        placeholder="Select time range"
                        isSearchable={false}
                    />
                </div>
            </Col>
        </React.Fragment>
    );
};

const TaskListGlobalFilter = () => {
    const statusOptions = [
        { value: "all", label: "All" },
        { value: "new", label: "New" },
        { value: "pending", label: "Pending" },
        { value: "inprogress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    return (
        <React.Fragment>
            <div className="col-xxl-3 col-sm-4">
                <Flatpickr
                    placeholder="Select date range"
                    className="form-control bg-light border-light"
                    options={{
                        mode: "range",
                        dateFormat: "d M, Y"
                    }}
                />
            </div>

            <div className="col-xxl-3 col-sm-4">
                <div className="input-light">
                    <AppSelect
                        options={statusOptions}
                        placeholder="Select status"
                        isSearchable={false}
                    />
                </div>
            </div>
            <div className="col-xxl-1 col-sm-4">
                <button type="button" className="btn btn-primary w-100"> <i className="ri-equalizer-fill me-1 align-bottom"></i>
                    Filters
                </button>
            </div>
        </React.Fragment>
    );
};


const LeadsGlobalFilter = ({ onClickDelete }) => {
    return (
        <React.Fragment>
            <div className="col-sm-auto ms-auto">
                <div className="hstack gap-2">
                    <button className="btn btn-soft-danger" onClick={onClickDelete}
                    ><i className="ri-delete-bin-2-line"></i></button>
                    <button type="button" className="btn btn-info"
                    //  onClick={toggleInfo}
                    >
                        <i className="ri-filter-3-line align-bottom me-1"></i>{" "}
                        Fliters
                    </button>
                    <button
                        type="button"
                        className="btn btn-success add-btn"
                        id="create-btn"
                    // onClick={() => { setIsEdit(false); toggle(); }}
                    >
                        <i className="ri-add-line align-bottom me-1"></i> Add
                        Leads
                    </button>
                    <UncontrolledDropdown>
                        <DropdownToggle
                            className="btn btn-soft-info btn-icon fs-14"
                            type="button"
                            id="dropdownMenuButton1"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="ri-settings-4-line"></i>
                        </DropdownToggle>
                        <DropdownMenu
                        >
                            <li>
                                <DropdownItem>
                                    Copy
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Move to pipline
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Add to exceptions
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Switch to common form view
                                </DropdownItem>
                            </li>
                            <li>
                                <DropdownItem>
                                    Reset form view to default
                                </DropdownItem>
                            </li>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </div>
            </div>
        </React.Fragment>
    );
};

export {
    ProductsGlobalFilter,
    CustomersGlobalFilter,
    OrderGlobalFilter,
    ContactsGlobalFilter,
    CompaniesGlobalFilter,
    CryptoOrdersGlobalFilter,
    InvoiceListGlobalSearch,
    TicketsListGlobalFilter,
    NFTRankingGlobalFilter,
    TaskListGlobalFilter,
    LeadsGlobalFilter
};
