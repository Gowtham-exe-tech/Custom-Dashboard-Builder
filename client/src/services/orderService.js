import api from "./api";


export const getOrders = (params) => 
    api.get("/orders", { params });

export const createOrder = (data) => 
    api.post("/orders", data);

export const updateOrder = (id, data) => 
    api.put(`/orders/${id}`, data);

export const deleteOrder = (id) => 
    api.delete(`/orders/${id}`);
