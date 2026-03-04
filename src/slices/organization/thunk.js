import { createAsyncThunk } from "@reduxjs/toolkit";
import { OrganizationsAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";


export const {
    delete: deleteOrganization,
} = makeCRUDThunks("content-operation/organization", OrganizationsAPI);

export const activateOrganization = createAsyncThunk("content-operation/organization/activate", async (id, { dispatch }) => {
    const res = await OrganizationsAPI.activate(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getOrganization(id));
    return res;
});



export const getOrganization = createAsyncThunk("organization", async () => {
    try {
        const res = await OrganizationsAPI.list();
        if (!res.success) throw res;
        return res.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load organization data';
        toast.error(errorMessage);
    }

});

// In your Redux thunks (example)
export const createOrUpdateOrganization = (formData) => async (dispatch) => {
    try {
        const id = formData.get("_id");
        const res = id
            ? await OrganizationsAPI.update(id, formData)
            : await OrganizationsAPI.create(formData);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getOrganization());
    } catch (error) {
        const errorMessage = error?.message || 'Failed to save organization data';
        toast.error(errorMessage);

    }
};

