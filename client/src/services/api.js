import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
}
export const API_BASE_URL = baseUrl;

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export default api;
