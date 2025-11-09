import axios from 'axios';

const API_URL = 'https://susie-epiphloedal-nontoxically.ngrok-free.dev';

console.log('🔧 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  timeout: 10000
});

api.interceptors.request.use((config) => {
  console.log('📤 REQUEST:', config.method.toUpperCase(), config.url);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ ERROR:', error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getUsers: () => api.get('/api/auth/users')
};

export const messageAPI = {
  send: (data) => api.post('/api/messages/send', data),
  getConversation: (userId) => api.get('/api/messages/conversation/' + userId),
  markDelivered: (messageId) => api.put('/api/messages/' + messageId + '/delivered'),
  markRead: (messageId) => api.put('/api/messages/' + messageId + '/read')
};

export default api;
