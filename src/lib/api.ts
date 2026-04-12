import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://elora-api-smoky.vercel.app/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("elora_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        if (data?.accessToken) {
          localStorage.setItem("elora_token", data.accessToken);
        }
        return api(originalRequest);
      } catch {
        localStorage.removeItem("elora_token");
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
