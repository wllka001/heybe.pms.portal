import { createAsyncThunk } from "@reduxjs/toolkit";
import { Surplus_PackageAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";


export const {
    delete: deleteSurplusPackage,
} = makeCRUDThunks("content-operation/surplus-package", Surplus_PackageAPI);

export const activateSurplusPackage = createAsyncThunk("content-operation/surplus-package/activate", async (id, { dispatch }) => {
    const res = await Surplus_PackageAPI.activate(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getSurplusPackages());
    return res;
});



export const getSurplusPackages = createAsyncThunk("orders/order/return-completed-orders", async (id) => {
    try {
        const res = await Surplus_PackageAPI.list(id);
        if (!res.success) throw res;
        return res.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load completed orders';
        toast.error(errorMessage);
    }

});

// In your Redux thunks (example)
export const createOrUpdateSurplusPackage = (formData) => async (dispatch) => {
    try {
        const res = await Surplus_PackageAPI.createOrUpdate(formData);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getSurplusPackages(formData.get('businessId')));
    } catch (error) {
        // Handle axios error response
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save package data';
        toast.error(errorMessage);

    }
};

