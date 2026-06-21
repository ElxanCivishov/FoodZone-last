import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiResponse } from "@/types";

const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const message =
      (error.response?.data as any)?.message ||
      "Network error. Please try again.";
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("fz_auth");
      if (!window.location.pathname.startsWith("/login")) {
        const from = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/login?from=${encodeURIComponent(from)}`;
      }
    }

    return Promise.reject(new Error(message));
  },
);

export function get<T>(
  url: string,
  params?: Record<string, any>,
): Promise<ApiResponse<T>> {
  return api.get(url, { params });
}

export function post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return api.post(url, data);
}

export function patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
  return api.patch(url, data);
}

export function del<T>(url: string): Promise<ApiResponse<T>> {
  return api.delete(url);
}

export default api;
