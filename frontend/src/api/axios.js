import axios from 'axios';

const API = axios.create({
    // MUST start with VITE_ to be visible to the browser
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});

// Add interceptor to attach Token if you have auth
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default API;