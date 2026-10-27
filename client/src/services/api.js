import axios from "axios";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      new Error(
        error.response?.data?.message || error.message || "Request failed",
      ),
    ),
);


export default api;
