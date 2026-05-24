import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh`, { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ─── API helpers ─────────────────────────────────────────────────────────────

export const authApi = {
  register: (d) => api.post('/api/auth/register', d),
  login: (d) => api.post('/api/auth/login', d),
  refresh: (d) => api.post('/api/auth/refresh', d),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (reset_token, new_password) => api.post('/api/auth/reset-password', { reset_token, new_password }),
  sendCode: (email, type) => api.post('/api/auth/send-code', { email, type }),
  verifyRegister: (d) => api.post('/api/auth/verify-register', d),
  verifyReset: (email, code, new_password) => api.post('/api/auth/verify-reset', { email, code, new_password }),
}

export const usersApi = {
  me: () => api.get('/api/users/me'),
  update: (d) => api.put('/api/users/me', d),
  changePassword: (old_password, new_password) => api.post('/api/users/me/change-password', { old_password, new_password }),
}

export const petsApi = {
  list: () => api.get('/api/pets/'),
  get: (id) => api.get(`/api/pets/${id}`),
  create: (d) => api.post('/api/pets/', d),
  update: (id, d) => api.put(`/api/pets/${id}`, d),
  delete: (id) => api.delete(`/api/pets/${id}`),
}

export const roomsApi = {
  list: () => api.get('/api/rooms/'),
  get: (id) => api.get(`/api/rooms/${id}`),
  create: (d) => api.post('/api/rooms/', d),
  update: (id, d) => api.put(`/api/rooms/${id}`, d),
  delete: (id) => api.delete(`/api/rooms/${id}`),
}

export const bookingsApi = {
  list: () => api.get('/api/bookings/'),
  create: (d) => api.post('/api/bookings/', d),
  update: (id, d) => api.put(`/api/bookings/${id}`, d),
  extend: (id, extension_date) => api.post(`/api/bookings/${id}/extend`, { extension_date }),
  cancel: (id) => api.delete(`/api/bookings/${id}`),
}

export const staffApi = {
  list: () => api.get('/api/staff/'),
  create: (d) => api.post('/api/staff/', d),
  update: (id, d) => api.put(`/api/staff/${id}`, d),
  delete: (id) => api.delete(`/api/staff/${id}`),
}

export const camerasApi = {
  public: () => api.get('/api/cameras/public'),
  petCamera: (petId) => api.get(`/api/cameras/pet/${petId}`),
  list: () => api.get('/api/cameras/'),
  create: (d) => api.post('/api/cameras/', d),
  update: (id, d) => api.put(`/api/cameras/${id}`, d),
  delete: (id) => api.delete(`/api/cameras/${id}`),
}

export const galleryApi = {
  list: () => api.get('/api/gallery/'),
  update: (id, d) => api.put(`/api/gallery/${id}`, d),
  delete: (id) => api.delete(`/api/gallery/${id}`),
}

export const tariffsApi = {
  list: () => api.get('/api/tariffs/'),
  create: (d) => api.post('/api/tariffs/', d),
  update: (id, d) => api.put(`/api/tariffs/${id}`, d),
  delete: (id) => api.delete(`/api/tariffs/${id}`),
}

export const notesApi = {
  petNotes: (petId) => api.get(`/api/notes/pet/${petId}`),
  create: (d) => api.post('/api/notes/', d),
  delete: (id) => api.delete(`/api/notes/${id}`),
}

export const adminApi = {
  dashboard: () => api.get('/api/admin/dashboard'),
  users: (search) => api.get('/api/admin/users', { params: { search } }),
  toggleUser: (id) => api.put(`/api/admin/users/${id}/toggle`),
  changeRole: (id, role) => api.put(`/api/admin/users/${id}/role`, null, { params: { role } }),
  allPets: (search) => api.get('/api/admin/pets', { params: { search } }),
  allBookings: (status, search) => api.get('/api/admin/bookings', { params: { status, search } }),
  updateBookingStatus: (id, status) => api.put(`/api/admin/bookings/${id}/status`, null, { params: { status } }),
  editBooking: (id, d) => api.put(`/api/admin/bookings/${id}`, d),
  handleExtension: (id, action) => api.put(`/api/admin/bookings/${id}/extension`, null, { params: { action } }),
  addGallery: (d) => api.post('/api/admin/gallery', d),
  allNotes: (petId) => api.get('/api/admin/notes', { params: { pet_id: petId } }),
}
