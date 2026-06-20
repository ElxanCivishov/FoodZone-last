import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor - attach token
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

// Response interceptor - standardized error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const message =
      (error.response?.data as any)?.message ||
      "Network error. Please try again.";
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/admin/login";
    }

    return Promise.reject(new Error(message));
  },
);

// ✅ Adi funksiyalar (generic arrow function yox, TSX xətası olmur)
export function get<T = any>(
  url: string,
  params?: Record<string, any>,
): Promise<T> {
  return api.get(url, { params });
}

export function post<T = any>(url: string, data?: any): Promise<T> {
  return api.post(url, data);
}

export function patch<T = any>(url: string, data?: any): Promise<T> {
  return api.patch(url, data);
}

export function del<T = any>(url: string): Promise<T> {
  return api.delete(url);
}

export default api;
