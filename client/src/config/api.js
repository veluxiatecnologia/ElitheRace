// API base URL configuration
const API_URL = import.meta.env.MODE === 'production'
    ? 'https://elithe-race-up.railway.app'
    : 'http://localhost:3000';

export default API_URL;
