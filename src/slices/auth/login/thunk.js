//Include Both Helper File with needed methods
// import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { login } from "../../../helpers/backend_helper";
import { setAuthorization } from "../../../helpers/api_helper";

import {
  loginStart,
  loginSuccess,
  logoutUserSuccess,
  apiError,
  reset_login_flag,
} from "./reducer";

export const loginUser = (user, history) => async (dispatch) => {
  try {
    dispatch(loginStart());
    let response;
    response = login({
      email: user.email,
      password: user.password,
    });
    var data = await response;

    if (data) {
      sessionStorage.setItem("authUser", JSON.stringify(data));

      var finallogin = JSON.stringify(data);
      finallogin = JSON.parse(finallogin);
      data = finallogin.data;
      console.log("ddd", finallogin);
      if (finallogin.success) {
        const accessToken = data?.accessToken;
        if (accessToken) {
          setAuthorization(accessToken);
        }
        dispatch(loginSuccess(data));
        history("/auth-twostep");
      } else {
        dispatch(apiError(finallogin));
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");
    localStorage.removeItem("user");
    setAuthorization(null);
    dispatch(logoutUserSuccess(true));

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
