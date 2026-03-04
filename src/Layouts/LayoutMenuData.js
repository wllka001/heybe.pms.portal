import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../config";
const Navdata = () => {
  const history = useNavigate();
  const location = useLocation();

  const authUser = JSON.parse(sessionStorage.getItem("authUser"));
  const userId = authUser?.data?.user?._id;
  const isSuperAdmin = userId === "superadmin-id";
  const [iscurrentState, setIscurrentState] = useState("Dashboard");
  const [retreivedMenus, setRetreivedMenus] = useState([]);
  const [menuStates, setMenuStates] = useState({}); // dynamic toggle states

  function updateIconSidebar(e) {
    if (e?.target?.getAttribute("subitems")) {
      const ul = document.getElementById("two-column-menu");
      const iconItems = ul?.querySelectorAll(".nav-icon.active") || [];
      [...iconItems].forEach((item) => {
        item.classList.remove("active");
        const id = item.getAttribute("subitems");
        const el = document.getElementById(id);
        if (el) el.classList.remove("show");
      });
    }
  }
  // Function to collect all permitted paths from menus
  const getAllPermittedPaths = (menus) => {
    const paths = [];
    menus.forEach((menu) => {
      if (menu.link && menu.link !== "/#") paths.push(menu.link);
      if (menu.subItems) {
        menu.subItems.forEach((sub) => {
          paths.push(sub.link);
        });
      }
    });
    return paths;
  };

  // Reset state variables on current state change
  useEffect(() => {
    setMenuStates((prevStates) => {
      const newStates = {};
      Object.keys(prevStates).forEach((key) => {
        newStates[key] = key === iscurrentState;
      });
      return newStates;
    });
  }, [iscurrentState]);

  // console.log("current state is:", iscurrentState)

  // Fetch dynamic menu if not superadmin
  // useEffect(() => {
  //   const fetchDynamicMenu = async () => {
  //     try {

  //       const response = await fetch(`${api.API_URL}/users/${userId}/menu`);
  //       const data = await response.json();
  //       setRetreivedMenus(data.flatMenu);
  //     } catch (err) {
  //       console.error("Error fetching user menu:", err);
  //     }
  //   };

  //   if (userId && userId !== "superadmin-id") {
  //     fetchDynamicMenu();
  //   }
  // }, [userId]);

  // Check route permission
  useEffect(() => {
    if (!isSuperAdmin && retreivedMenus.length > 0) {
      const permittedPaths = getAllPermittedPaths(retreivedMenus);
      const currentPath = location.pathname;

      // Allow access to root or not-found page
      if (currentPath === "/" || currentPath === "/not-found") return;

      // Check if current path or any parent path is permitted
      const isPermitted = permittedPaths.some((path) => {
        return (
          currentPath.startsWith(path) ||
          (path !== "/dashboard" && currentPath.includes(path))
        );
      });

      if (!isPermitted) {
        history("/not-found");
      }
    }
  }, [location.pathname, retreivedMenus, isSuperAdmin, history]);

  // Static full-access menu for superadmin
  const menuItems = [
    {
      id: "DASHBOARD",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/dashboard",
    },
    {
      id: "EMPLOYEES",
      label: "Employees",
      icon: "ri-user-line",
      link: "/employees",
    },
    {
      id: "TENANTS",
      label: "Tenants",
      icon: "ri-user-line",
      link: "/tenants",
    },

    {
      id: "UNITS",
      label: "Units",
      icon: "ri-home-5-line",
      link: "/units",
    },

    {
      id: "MAINTENANCE",
      label: "Maintenance",
      icon: "ri-tools-line",
      link: "/maintenance",
    },
    {
      id: "VENDORS",
      label: "Vendors",
      icon: "ri-store-2-line",
      link: "/maintenance/vendors",
    },

    {
      id: "LEASES",
      label: "Leases",
      icon: "ri-file-list-2-line",
      link: "/leases",
    },
    {
      id: "UTILITY-USAGES",
      label: "Utility Usage",
      icon: "ri-flashlight-line",
      link: "/utility-usages",
    },
    {
      id: "ORGANIZATION",
      label: "Organization",
      icon: "ri-building-line",
      link: "/organization",
    },
    {
      id: "BUILDINGS",
      label: "Buildings",
      icon: "ri-building-line",
      link: "/buildings",
    },


    {
      id: "FINANCE",
      label: "Finance",
      icon: "ri-file-list-2-line",
      link: "/#",
      stateVariables: menuStates["FINANCE"] || false,
      click: function (e) {
        e.preventDefault();
        setMenuStates((prev) => ({ ...prev, FINANCE: !prev.FINANCE }));
        setIscurrentState("FINANCE");
        updateIconSidebar(e);
      },
      subItems: [
        {
          id: "EXPENSES",
          label: "Expenses",
          link: "/finance/expenses",
          parentId: "FINANCE",
        },
        {
          id: "INVOICES",
          label: "Invoices",
          link: "/finance/invoices",
          parentId: "FINANCE",
        },
        {
          id: "PAYMENTS",
          label: "Payments",
          link: "/finance/payments",
          parentId: "FINANCE",
        },
        {
          id: "UTILITY-BILLS",
          label: "Utility Bills",
          link: "/finance/utility-bills",
          parentId: "FINANCE",
        },
      ],
    },

  ];
  const dynamicMenu = retreivedMenus.map((item) => {
    const menuItem = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      link: item.link,
      stateVariables: menuStates[item.label] || false,
      click: (e) => {
        e.preventDefault();
        setMenuStates((prev) => ({
          ...prev,
          [item.label]: !prev[item.label],
        }));
        setIscurrentState(item.label);
        updateIconSidebar(e);
      },
    };

    // Only add subItems if they exist and length > 0
    if (item.subItems && item.subItems.length > 0) {
      menuItem.subItems = item.subItems.map((sub) => ({
        id: sub.id,
        label: sub.label,
        link: sub.link,
        parentId: sub.parentId,
      }));
    }

    return menuItem;
  });

  // const menuToRender = userId === "superadmin-id" ? menuItems : dynamicMenu;

  return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
