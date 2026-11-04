const API_BASE = '/api';

// Token Management
export const getToken = () => localStorage.getItem('homeserve_token');
export const setToken = (token) => localStorage.setItem('homeserve_token', token);
export const removeToken = () => localStorage.removeItem('homeserve_token');
export const getUser = () => {
  const u = localStorage.getItem('homeserve_user');
  return u ? JSON.parse(u) : null;
};
export const setUser = (user) => localStorage.setItem('homeserve_user', JSON.stringify(user));

// Fetch Helper with Auth Headers
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Something went wrong';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  // If response is CSV or plain text
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
}

// API Services
export const authApi = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMe: () => apiRequest('/auth/me'),
  getDemoUsers: () => apiRequest('/auth/demo-users'),
};

export const serviceApi = {
  getCategories: () => apiRequest('/services/categories'),
  getServices: (params = {}) => {
    const q = new URLSearchParams();
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.search) q.append('search', params.search);
    if (params.min_price) q.append('min_price', params.min_price);
    if (params.max_price) q.append('max_price', params.max_price);
    return apiRequest(`/services?${q.toString()}`);
  },
  getServiceDetail: (id) => apiRequest(`/services/${id}`),
  validateCoupon: (code, order_amount) => apiRequest('/services/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, order_amount })
  }),
  getActiveCoupons: () => apiRequest('/services/coupons/active'),
  createCategory: (data) => apiRequest('/services/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createService: (data) => apiRequest('/services', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const customerApi = {
  getProfile: () => apiRequest('/customers/profile'),
  getAddresses: () => apiRequest('/customers/addresses'),
  addAddress: (data) => apiRequest('/customers/addresses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAddress: (id) => apiRequest(`/customers/addresses/${id}`, { method: 'DELETE' }),
  getBookings: () => apiRequest('/customers/bookings'),
};

export const bookingApi = {
  createBooking: (data) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getBookingDetail: (id) => apiRequest(`/bookings/${id}`),
  updateStatus: (id, status, notes) => apiRequest(`/bookings/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, notes })
  }),
  assignTechnician: (id, technician_id, remarks) => apiRequest(`/bookings/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ technician_id, remarks })
  }),
  cancelBooking: (id, reason) => apiRequest(`/bookings/${id}/cancel?reason=${encodeURIComponent(reason || '')}`, {
    method: 'POST'
  }),
  uploadImage: (id, image_type, image_url, notes) => apiRequest(`/bookings/${id}/images?image_type=${image_type}&image_url=${encodeURIComponent(image_url)}&notes=${encodeURIComponent(notes || '')}`, {
    method: 'POST'
  })
};

export const paymentApi = {
  createOrder: (booking_id, payment_method = 'RAZORPAY_TEST') => apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ booking_id, payment_method })
  }),
  verifyPayment: (data) => apiRequest('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

export const providerApi = {
  getStats: () => apiRequest('/providers/dashboard/stats'),
  getBookings: (status) => apiRequest(`/providers/bookings${status ? `?status=${status}` : ''}`),
  getTechnicians: () => apiRequest('/providers/technicians'),
  addTechnician: (data) => apiRequest('/providers/technicians', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  submitKYC: (data) => apiRequest('/providers/kyc/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const technicianApi = {
  getJobs: () => apiRequest('/technicians/jobs'),
  updateStatus: (booking_id, status, remarks, image_url) => apiRequest(`/technicians/jobs/${booking_id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, remarks, image_url })
  })
};

export const notificationApi = {
  getNotifications: () => apiRequest('/notifications'),
  markAllRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),
  markOneRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' })
};

export const reviewApi = {
  createReview: (booking_id, rating, comment) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify({ booking_id, rating, comment })
  }),
  replyReview: (id, provider_reply) => apiRequest(`/reviews/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ provider_reply })
  }),
  raiseComplaint: (data) => apiRequest('/complaints', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getComplaints: () => apiRequest('/complaints'),
  resolveComplaint: (id, status, resolution_notes) => apiRequest(`/complaints/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status, resolution_notes })
  })
};

export const adminApi = {
  getAnalytics: () => apiRequest('/analytics/admin'),
  getProviders: () => apiRequest('/admin/providers'),
  verifyProvider: (id, approve, reason) => apiRequest(`/admin/providers/${id}/verify?approve=${approve}&reason=${encodeURIComponent(reason || '')}`, {
    method: 'POST'
  }),
  exportCsvUrl: () => `${API_BASE}/analytics/export/csv`
};

