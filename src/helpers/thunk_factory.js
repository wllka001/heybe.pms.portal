import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export const makeCRUDThunks = (name, API) => {
    // console.log("API is:", API)
    const list = createAsyncThunk(`${name}/list`, async (_, thunkAPI) => {
        try {
            const res = await API.list();
            if (!res.success) throw res;
            // console.log("res data is:", res.data)
            return res.data;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Failed to fetch list");
            toast.error(message);
            return thunkAPI.rejectWithValue(error);
        }
    });

    const create = createAsyncThunk(`${name}/create`, async (payload, { dispatch, rejectWithValue }) => {
        try {
            const res = await API.create(payload);
            // console.log("res is:", res)
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(list()); // refresh
            return res;
        } catch (error) {
            console.log("error is:", error)
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Create failed");
            toast.error(message);
            return rejectWithValue(error);
        }
    });

    const update = createAsyncThunk(`${name}/update`, async (payload, { dispatch, rejectWithValue }) => {
        try {
            const res = await API.update(payload);
            console.log("res is:", res)
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(list()); // refresh
            return res;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Update failed");
            toast.error(message);
            return rejectWithValue(error);
        }
    });

    const remove = createAsyncThunk(`${name}/delete`, async (id, { dispatch, rejectWithValue }) => {
        try {
            const res = await API.delete(id);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(list()); // refresh
            return res;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Delete failed");
            toast.error(message);
            return rejectWithValue(error);
        }
    });

    return { list, create, update, delete: remove };
};