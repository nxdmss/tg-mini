import axios from "axios";

export const api = axios.create({
  baseURL: "https://tg-mini-backend.onrender.com",
});