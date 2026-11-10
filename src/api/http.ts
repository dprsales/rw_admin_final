import axios from "axios";
import Cookies from "js-cookie";

const apiBase =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://api.rajivwilliams.com";

export const http = axios.create({
  baseURL: String(apiBase).replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
  },
}); 

http.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");  
  if (token) {    
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

http.interceptors.response.use(
  function (response) {
    return response;
  },
  function (err) {
    if (err.message === "Network Error") {
      alert("Network Error");
    } else if (err.response && err.response.status === 401) {
      Cookies.remove("access_token");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
