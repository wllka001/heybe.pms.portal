import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "reactstrap";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from "react-redux";

//import images
import avatar1 from "../../assets/images/heybe-logo.png";
import useAuthUser from "../Hooks/useAuthUser";
import { logoutUser } from "../../slices/auth/login/thunk";

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const profiledropdownData = createSelector(
    (state) => state.Profile,
    (state) => ({
      user: state.user,
    }),
  );
  // Inside your component
  const { user } = useSelector(profiledropdownData);

  const [userName, setUserName] = useState("Admin");
  const [userRole, setuserRole] = useState("Admin");

  const authUser = useAuthUser();

  useEffect(() => {
    if (sessionStorage.getItem("authUser")) {
      const obj = JSON.parse(sessionStorage.getItem("authUser"));

      const userName = obj.data.user.firstName || "Admin";
      const userRole = obj.data.user.role || "Admin";

      setUserName(userName);
      setuserRole(userRole);
    }
  }, [userName, userRole, user]);

  //Dropdown Toggle
  const [isProfileDropdown, setIsProfileDropdown] = useState(false);
  const toggleProfileDropdown = () => {
    setIsProfileDropdown(!isProfileDropdown);
  };

  const handleLogout = (event) => {
    event.preventDefault();
    dispatch(logoutUser());
    navigate("/login");
  };
  return (
    <React.Fragment>
      <Dropdown
        isOpen={isProfileDropdown}
        toggle={toggleProfileDropdown}
        className="ms-sm-3 header-item topbar-user"
      >
        <DropdownToggle tag="button" type="button" className="btn">
          <span className="d-flex align-items-center">
            <img
              className="rounded-circle header-profile-user"
              src={avatar1}
              alt="Header Avatar"
            />
            <span className="text-start ms-xl-2">
              <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">
                {authUser.firstName}
              </span>
              <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">
                {authUser.role}
              </span>
            </span>
          </span>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <h6 className="dropdown-header">Welcome {userName}!</h6>
          <DropdownItem className="p-0">
            <Link to="/users/user-profile" className="dropdown-item">
              <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
              <span className="align-middle">Profile</span>
            </Link>
          </DropdownItem>
          {/* <DropdownItem className='p-0'>
                        <Link to="/apps-chat" className="dropdown-item">
                            <i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i> <span
                                className="align-middle">Messages</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="#" className="dropdown-item">
                            <i className="mdi mdi-calendar-check-outline text-muted fs-16 align-middle me-1"></i> <span
                                className="align-middle">Taskboard</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-faqs" className="dropdown-item">
                            <i
                                className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle">Help</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile" className="dropdown-item">
                            <i
                                className="mdi mdi-wallet text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle">Balance : <b>$5971.67</b></span>
                        </Link>
                    </DropdownItem > */}
          <DropdownItem className="p-0">
            <Link
              to="/business/profile-settings"
              className="dropdown-item"
            >
              <span className="badge bg-success-subtle text-success mt-1 float-end">
                New
              </span>
              <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Settings</span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <Link to="/auth-change-password" className="dropdown-item">
              <i className="mdi mdi-lock-outline text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Change Password</span>
            </Link>
          </DropdownItem>
          {/* <DropdownItem className='p-0'>
                        <Link to="/auth-lockscreen-basic" className="dropdown-item">
                            <i
                                className="mdi mdi-lock text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Lock screen</span>
                        </Link>
                    </DropdownItem> */}
          <DropdownItem className="p-0">
            <Link to="/login" className="dropdown-item" onClick={handleLogout}>
              <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle" data-key="t-logout">
                Logout
              </span>
            </Link>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

export default ProfileDropdown;
