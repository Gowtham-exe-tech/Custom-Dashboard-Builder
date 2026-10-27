import api from "./api";


export const getDataConnections = () => 
  api.get("/data-connections");

export const createDataConnection = (data) =>
  api.post("/data-connections", data);

export const deleteDataConnection = (id) =>
  api.delete(`/data-connections/${id}`);
