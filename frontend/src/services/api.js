import axios from "axios";

// ── Base instance ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attaches the stored JWT to every outgoing request (fallback for initial load)

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tc_token");
    if (token && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401 → clear session and redirect to login

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API ERROR:", error.config?.url, error.response?.status);
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint) {
        localStorage.removeItem("tc_token");
        localStorage.removeItem("tc_user");
        delete api.defaults.headers.common["Authorization"];
        if (!window.location.pathname.startsWith("/login")) {
          console.trace("REDIRECTING TO LOGIN");
          debugger;
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;