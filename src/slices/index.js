import { combineReducers } from "redux";

// Front
import LayoutReducer from "./layouts/reducer";

// Authentication
import LoginReducer from "./auth/login/reducer";
import AccountReducer from "./auth/register/reducer";
import ForgetPasswordReducer from "./auth/forgetpwd/reducer";
import ProfileReducer from "./auth/profile/reducer";

// import ContentManagementReducer from "./Content_Management/reducer"
import OrganizationManagementReducer from "./organization/reducer"
import BuildingsReducer from "./buildings/reducer";
import UnitsReducer from "./units/reducer";
import TenantsReducer from "./tenants/reducer";
import LeasesReducer from "./leases/reducer";
import MaintenanceReducer from "./maintenance/reducer";
import EmployeesReducer from "./employees/reducer";
import UtilityUsagesReducer from "./utilityUsages/reducer";
import FinanceReducer from "./finance/reducer";

const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Login: LoginReducer,
    Account: AccountReducer,
    ForgetPassword: ForgetPasswordReducer,
    Profile: ProfileReducer,
    // ContentManagement: ContentManagementReducer,
    Organization: OrganizationManagementReducer,
    Buildings: BuildingsReducer,
    Units: UnitsReducer,
    Tenants: TenantsReducer,
    Leases: LeasesReducer,
    Maintenance: MaintenanceReducer,
    Employees: EmployeesReducer,
    UtilityUsages: UtilityUsagesReducer,
    Finance: FinanceReducer,
});

export default rootReducer;
