import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://eloracraftingarts.vercel.app/api/v1' 
      : 'http://localhost:5000/api/v1'),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
