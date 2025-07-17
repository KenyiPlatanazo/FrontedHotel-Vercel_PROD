import axios from "axios";
import axiosRetry from "axios-retry";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

axiosRetry(api, {
  retries: 1,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) ||
    axiosRetry.isRetryableError(error) ||
    (typeof error.response?.status === "number" &&
      error.response?.status >= 500),
});

api.interceptors.request.use(
  (config) => {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith("access_token="));
    const token = raw ? raw.split("=")[1] : "";
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

export default api;
