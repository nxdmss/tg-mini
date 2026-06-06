import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://YOUR-RAILWAY-URL.up.railway.app',
});