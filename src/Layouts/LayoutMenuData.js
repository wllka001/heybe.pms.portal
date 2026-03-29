import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

  const buildCollapsibleMenu = ({ id, label, icon, subItems }) => ({
    id,
    label,
    icon,
    link: "/#",
    stateVariables: menuStates[id] || false,
    click: function (e) {
      e.preventDefault();
      setMenuStates((prev) => ({ ...prev, [id]: !prev[id] }));
      setIscurrentState(id);
      updateIconSidebar(e);
    },
    subItems,
  });
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
      id: "MAIN_HEADER",
      label: "Main",
      isHeader: true,
    },
    {
      id: "DASHBOARD",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/dashboard",
    },
    {
      id: "OPERATIONS_HEADER",
      label: "Operations",
      isHeader: true,
    },
    buildCollapsibleMenu({
      id: "PEOPLE_OPERATIONS",
      label: "People & Leasing",
      icon: "ri-team-line",
      subItems: [
        {
          id: "EMPLOYEES",
          label: "Employees",
          link: "/employees",
          parentId: "PEOPLE_OPERATIONS",
        },
        {
          id: "TENANTS",
          label: "Tenants",
          link: "/tenants",
          parentId: "PEOPLE_OPERATIONS",
        },
        {
          id: "LEASES",
          label: "Leases",
          link: "/leases",
          parentId: "PEOPLE_OPERATIONS",
        },
      ],
    }),
    buildCollapsibleMenu({
      id: "PROPERTY_OPERATIONS",
      label: "Property Ops",
      icon: "ri-tools-line",
      subItems: [
        {
          id: "MAINTENANCE",
          label: "Maintenance",
          link: "/maintenance",
          parentId: "PROPERTY_OPERATIONS",
        },
        {
          id: "VENDORS",
          label: "Vendors",
          link: "/maintenance/vendors",
          parentId: "PROPERTY_OPERATIONS",
        },
      ],
    }),
    {
      id: "PORTFOLIO_HEADER",
      label: "Portfolio",
      isHeader: true,
    },
    buildCollapsibleMenu({
      id: "PROPERTY_SETUP",
      label: "Property Setup",
      icon: "ri-building-line",
      subItems: [
        {
          id: "ORGANIZATION",
          label: "Organization",
          link: "/organization",
          parentId: "PROPERTY_SETUP",
        },
        {
          id: "BUILDINGS",
          label: "Buildings",
          link: "/buildings",
          parentId: "PROPERTY_SETUP",
        },
        {
          id: "UNITS",
          label: "Units",
          link: "/units",
          parentId: "PROPERTY_SETUP",
        },
        {
          id: "UTILITY-USAGES",
          label: "Utility Types",
          link: "/utility-usages",
          parentId: "PROPERTY_SETUP",
        },
      ],
    }),
    {
      id: "FINANCE_HEADER",
      label: "Finance & Reports",
      isHeader: true,
    },
    buildCollapsibleMenu({
      id: "FINANCE",
      label: "Finance",
      icon: "ri-bank-card-line",
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
    }),
    buildCollapsibleMenu({
      id: "REPORTS",
      label: "Reports",
      icon: "ri-bar-chart-grouped-line",
      subItems: [
        {
          id: "REPORTS_OVERVIEW",
          label: "Overview",
          link: "/reports",
          parentId: "REPORTS",
        },
        {
          id: "UTILITY_BILLS_REPORT",
          label: "Utility Bills Report",
          link: "/reports/utility-bills-report",
          parentId: "REPORTS",
        },
        {
          id: "INVOICE_REPORT",
          label: "Invoice Report",
          link: "/reports/invoice-report",
          parentId: "REPORTS",
        },
        {
          id: "PAYMENT_REPORT",
          label: "Payment Report",
          link: "/reports/payment-report",
          parentId: "REPORTS",
        },
        {
          id: "EXPENSE_REPORT",
          label: "Expense Report",
          link: "/reports/expense-report",
          parentId: "REPORTS",
        },
        {
          id: "GENERAL_FINANCE_REPORT",
          label: "General Finance Report",
          link: "/reports/general-finance-report",
          parentId: "REPORTS",
        },
        {
          id: "TENANT_BALANCE_REPORT",
          label: "Tenant Balance Report",
          link: "/reports/tenant-balance-report",
          parentId: "REPORTS",
        },
        {
          id: "TENANT_HISTORY_REPORT",
          label: "Tenant Invoice History",
          link: "/reports/tenant-invoice-payment-history",
          parentId: "REPORTS",
        },
      ],
    }),
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
