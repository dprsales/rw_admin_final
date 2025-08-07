import axios from "axios";
import Cookies from "js-cookie";

export const http = axios.create({
  baseURL: "https://api.rajivwilliams.com",
  // baseURL: "192.168.0.109:8088",
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
    config.headers["Content-Type"] = "multipart/form-data";
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
    } else if (err.response.status === 401) {
      Cookies.remove("access_token");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
