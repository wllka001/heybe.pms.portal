import { login, resendLoginOtp, verifyLoginOtp } from "../../../helpers/backend_helper";
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
    const response = login({
      identifier: user.identifier,
      password: user.password,
    });
    let data = await response;

    if (data) {
      const finallogin = JSON.parse(JSON.stringify(data));
      data = finallogin.data;

      if (finallogin.success) {
        sessionStorage.removeItem("authUser");
        setAuthorization(null);
        sessionStorage.setItem("pendingLogin", JSON.stringify(data));
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

export const verifyUserLoginOtp = (payload, history) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const response = await verifyLoginOtp(payload);

    if (response?.success) {
      sessionStorage.removeItem("pendingLogin");
      sessionStorage.setItem("authUser", JSON.stringify(response));

      const accessToken = response.data?.accessToken;
      if (accessToken) {
        setAuthorization(accessToken);
      }

      dispatch(loginSuccess(response.data));
      history("/dashboard");
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resendUserLoginOtp = (payload) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const response = await resendLoginOtp(payload);

    if (response?.success) {
      const existingPending = JSON.parse(sessionStorage.getItem("pendingLogin") || "{}");
      sessionStorage.setItem(
        "pendingLogin",
        JSON.stringify({
          ...existingPending,
          ...response.data,
        }),
      );
      dispatch(loginSuccess(response.data));
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");
    sessionStorage.removeItem("pendingLogin");
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
