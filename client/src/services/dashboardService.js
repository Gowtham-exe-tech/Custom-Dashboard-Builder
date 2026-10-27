import api from "./api";


export const getDashboards = () => api.get("/dashboards");
export const getDashboard = (id) => api.get(`/dashboards/${id}`);
export const getDefaultDashboard = () => api.get("/dashboards/default");
export const createDashboard = (data) => api.post("/dashboards", data);
export const updateDashboard = (id, data) => api.put(`/dashboards/${id}`, data);
export const setDefaultDashboard = (id) => api.put(`/dashboards/${id}/default`);
export const deleteDashboard = (id) => api.delete(`/dashboards/${id}`);
