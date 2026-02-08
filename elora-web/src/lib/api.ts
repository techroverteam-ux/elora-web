import axios from "axios";

const api = axios.create({
  // Ensure this matches your backend URL
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // IMPORTANT: Allows cookies to be sent/received
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
