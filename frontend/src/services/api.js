import { INITIAL_CATEGORIES, INITIAL_SERVICES, INITIAL_ADDRESSES, INITIAL_BOOKINGS } from './mockData';

const API_BASE = '/api';

// Token Management
export const getToken = () => localStorage.getItem('homeserve_token');
export const setToken = (token) => localStorage.setItem('homeserve_token', token);
export const removeToken = () => {
  localStorage.removeItem('homeserve_token');
  localStorage.removeItem('homeserve_user');
};
export const getUser = () => {
  const u = localStorage.getItem('homeserve_user');
  return u ? JSON.parse(u) : null;
};
export const setUser = (user) => localStorage.setItem('homeserve_user', JSON.stringify(user));

// In-Memory / LocalStorage Mock State for Netlify Demo Fallback
let mockAddresses = [...INITIAL_ADDRESSES];
let mockBookings = [...INITIAL_BOOKINGS];

// Fetch Helper with Auth Headers and Fallback
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return response.blob();
      }
      return await response.json();
    }
  } catch (err) {
    // Network or proxy fail - will use mock fallback below
  }

  throw new Error(`API ${endpoint} unreachable, using fallback`);
}

// 1. Auth Services
export const authApi = {
  login: async (email, password) => {
    try {
      return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch {
      // Mock Login Fallback
      let role = 'CUSTOMER';
      let name = 'Rahul Sharma';
      if (email.includes('admin')) {
        role = 'ADMIN';
        name = 'Super Administrator';
      } else if (email.includes('provider')) {
        role = 'PROVIDER';
        name = 'Apex Pro Home Solutions';
      } else if (email.includes('tech')) {
        role = 'TECHNICIAN';
        name = 'Vikram Singh';
      }
      return {
        access_token: `mock_jwt_token_${Date.now()}`,
        token_type: 'bearer',
        role: role,
        user_id: 1,
        name: name,
        email: email
      };
    }
  },
  register: async (data) => {
    try {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return {
        access_token: `mock_jwt_token_${Date.now()}`,
        token_type: 'bearer',
        role: data.role || 'CUSTOMER',
        user_id: 2,
        name: data.full_name || 'New User',
        email: data.email
      };
    }
  },
  getMe: () => apiRequest('/auth/me'),
  getDemoUsers: () => apiRequest('/auth/demo-users')
};

// 2. Service & Catalog Services
export const serviceApi = {
  getCategories: async () => {
    try {
      return await apiRequest('/services/categories');
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  getServices: async (params = {}) => {
    try {
      const q = new URLSearchParams();
      if (params.category_id) q.append('category_id', params.category_id);
      if (params.search) q.append('search', params.search);
      if (params.min_price) q.append('min_price', params.min_price);
      if (params.max_price) q.append('max_price', params.max_price);
      return await apiRequest(`/services?${q.toString()}`);
    } catch {
      let list = [...INITIAL_SERVICES];
      if (params.category_id) {
        list = list.filter(s => s.category_id === Number(params.category_id));
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
      }
      return list;
    }
  },
  getServiceDetail: async (id) => {
    try {
      return await apiRequest(`/services/${id}`);
    } catch {
      const s = INITIAL_SERVICES.find(srv => srv.id === Number(id)) || INITIAL_SERVICES[0];
      return {
        ...s,
        providers: [
          {
            provider_id: 1,
            company_name: "Apex Pro Home & Electricals",
            bio: "Licensed master electricians and HVAC specialists providing fast, certified same-day home repairs.",
            experience_years: 8,
            avg_rating: 4.9,
            total_reviews: 48,
            price: s.base_price
          }
        ]
      };
    }
  },
  validateCoupon: async (code, order_amount) => {
    try {
      return await apiRequest('/services/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, order_amount })
      });
    } catch {
      const upper = code.toUpperCase();
      if (upper === 'WELCOME100') {
        return { valid: true, code: 'WELCOME100', discount_amount: 100, message: 'Coupon WELCOME100 applied! You saved ₹100' };
      } else if (upper === 'HORIZON20') {
        const disc = Math.min((order_amount * 20) / 100, 300);
        return { valid: true, code: 'HORIZON20', discount_amount: disc, message: `Coupon HORIZON20 applied! You saved ₹${disc.toFixed(0)}` };
      }
      throw new Error('Invalid coupon code. Try WELCOME100 or HORIZON20');
    }
  },
  getActiveCoupons: () => apiRequest('/services/coupons/active'),
  createCategory: (data) => apiRequest('/services/categories', { method: 'POST', body: JSON.stringify(data) }),
  createService: (data) => apiRequest('/services', { method: 'POST', body: JSON.stringify(data) })
};

// 3. Customer Services
export const customerApi = {
  getProfile: () => apiRequest('/customers/profile'),
  getAddresses: async () => {
    try {
      return await apiRequest('/customers/addresses');
    } catch {
      return mockAddresses;
    }
  },
  addAddress: async (data) => {
    try {
      return await apiRequest('/customers/addresses', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      const newOne = { id: Date.now(), ...data, is_default: false };
      mockAddresses.push(newOne);
      return newOne;
    }
  },
  deleteAddress: async (id) => {
    try {
      return await apiRequest(`/customers/addresses/${id}`, { method: 'DELETE' });
    } catch {
      mockAddresses = mockAddresses.filter(a => a.id !== id);
      return { message: 'Address deleted' };
    }
  },
  getBookings: async () => {
    try {
      return await apiRequest('/customers/bookings');
    } catch {
      return mockBookings;
    }
  }
};

// 4. Booking & Appointment Services
export const bookingApi = {
  createBooking: async (data) => {
    try {
      return await apiRequest('/bookings', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      const newBooking = {
        id: mockBookings.length + 1,
        booking_code: `HS-2026-${Math.floor(100 + Math.random() * 900)}`,
        service_id: data.service_id,
        service_name: "Service Appointment",
        booking_date: data.booking_date,
        time_slot: data.time_slot,
        status: "CONFIRMED",
        total_amount: data.total_amount || 454.0,
        provider_name: "Apex Pro Home & Electricals",
        payment_status: "PAID",
        has_review: false,
        has_invoice: true,
        invoice_number: `INV-2026-000${mockBookings.length + 1}`
      };
      mockBookings.unshift(newBooking);
      return newBooking;
    }
  },
  getBookingDetail: async (id) => {
    try {
      return await apiRequest(`/bookings/${id}`);
    } catch {
      const b = mockBookings.find(item => item.id === Number(id)) || mockBookings[0];
      return {
        id: b.id,
        booking_code: b.booking_code,
        status: b.status,
        booking_date: b.booking_date,
        time_slot: b.time_slot,
        special_instructions: b.special_instructions || "Standard appointment",
        pricing: {
          subtotal: b.total_amount - 29,
          discount: 0,
          platform_fee: 29,
          total_amount: b.total_amount
        },
        service: {
          id: 1,
          name: b.service_name,
          duration: 60,
          image_url: b.service_image || "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
          category: "Home Maintenance"
        },
        provider: {
          id: 1,
          company_name: b.provider_name,
          phone: "9876543213",
          avg_rating: 4.9
        },
        customer: {
          id: 1,
          full_name: "Rahul Sharma",
          phone: "9876543211",
          email: "customer@homeserve.com"
        },
        address: {
          title: "Home",
          street: "Flat 402, Sea Breeze Residency",
          city: "Mumbai",
          state: "Maharashtra",
          postal_code: "400050",
          landmark: "Near Joggers Park"
        },
        technician: {
          id: 1,
          name: b.technician_name || "Vikram Singh",
          phone: b.technician_phone || "9876543216",
          status: b.technician_status || "COMPLETED",
          remarks: "All diagnostics and work verified successfully."
        },
        payment: {
          status: b.payment_status || "PAID",
          method: "RAZORPAY_TEST",
          order_id: `order_${b.booking_code}`,
          payment_id: "pay_rzp_test_success"
        },
        invoice: {
          invoice_number: b.invoice_number || "INV-2026-0001",
          total_amount: b.total_amount,
          issue_date: "2026-11-04",
          pdf_url: `/api/invoices/${b.invoice_number || 'INV-2026-0001'}/html`
        },
        images: [
          { type: "BEFORE", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", notes: "Before work initial inspection" },
          { type: "AFTER", url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80", notes: "Finished verified installation" }
        ],
        timeline: [
          { stage: "PENDING", title: "Booking Received", is_completed: true, is_current: false },
          { stage: "CONFIRMED", title: "Provider Confirmed", is_completed: true, is_current: false },
          { stage: "PROVIDER_ASSIGNED", title: "Technician Assigned", is_completed: true, is_current: false },
          { stage: "IN_PROGRESS", title: "Work In Progress", is_completed: b.status === "COMPLETED", is_current: b.status === "IN_PROGRESS" },
          { stage: "COMPLETED", title: "Completed & Invoiced", is_completed: b.status === "COMPLETED", is_current: b.status === "COMPLETED" }
        ]
      };
    }
  },
  updateStatus: async (id, status, notes) => {
    try {
      return await apiRequest(`/bookings/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) });
    } catch {
      const b = mockBookings.find(item => item.id === Number(id));
      if (b) b.status = status;
      return { message: `Booking status updated to ${status}` };
    }
  },
  assignTechnician: async (id, technician_id, remarks) => {
    try {
      return await apiRequest(`/bookings/${id}/assign`, { method: 'POST', body: JSON.stringify({ technician_id, remarks }) });
    } catch {
      const b = mockBookings.find(item => item.id === Number(id));
      if (b) {
        b.status = "PROVIDER_ASSIGNED";
        b.technician_name = "Vikram Singh";
        b.technician_status = "ASSIGNED";
      }
      return { message: "Technician assigned successfully" };
    }
  },
  cancelBooking: async (id, reason) => {
    try {
      return await apiRequest(`/bookings/${id}/cancel?reason=${encodeURIComponent(reason || '')}`, { method: 'POST' });
    } catch {
      const b = mockBookings.find(item => item.id === Number(id));
      if (b) b.status = "CANCELLED";
      return { message: "Booking cancelled" };
    }
  },
  uploadImage: (id, image_type, image_url, notes) => apiRequest(`/bookings/${id}/images?image_type=${image_type}&image_url=${encodeURIComponent(image_url)}&notes=${encodeURIComponent(notes || '')}`, { method: 'POST' })
};

// 5. Payment Services
export const paymentApi = {
  createOrder: async (booking_id, payment_method = 'RAZORPAY_TEST') => {
    try {
      return await apiRequest('/payments/create-order', { method: 'POST', body: JSON.stringify({ booking_id, payment_method }) });
    } catch {
      return {
        order_id: `order_mock_${Date.now()}`,
        amount: 45400,
        currency: "INR",
        key_id: "rzp_test_HS_apex_2026"
      };
    }
  },
  verifyPayment: async (data) => {
    try {
      return await apiRequest('/payments/verify', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return {
        success: true,
        message: "Payment verified successfully",
        payment_id: data.gateway_payment_id || "pay_mock_test_001",
        invoice_number: "INV-2026-0002"
      };
    }
  }
};

// 6. Provider Services
export const providerApi = {
  getStats: async () => {
    try {
      return await apiRequest('/providers/dashboard/stats');
    } catch {
      return {
        company_name: "Apex Pro Home & Electricals",
        is_verified: true,
        kyc_status: "APPROVED",
        avg_rating: 4.9,
        total_reviews: 48,
        metrics: {
          total_bookings: 24,
          pending_bookings: 3,
          in_progress_bookings: 2,
          completed_bookings: 19,
          total_earnings: 14850.0,
          pending_payout: 1250.0
        }
      };
    }
  },
  getBookings: async (status) => {
    try {
      return await apiRequest(`/providers/bookings${status ? `?status=${status}` : ''}`);
    } catch {
      return mockBookings.map(b => ({
        id: b.id,
        booking_code: b.booking_code,
        service_name: b.service_name,
        customer_name: "Rahul Sharma",
        customer_phone: "9876543211",
        address: b.address,
        booking_date: b.booking_date,
        time_slot: b.time_slot,
        status: b.status,
        total_amount: b.total_amount,
        assigned_technician_name: b.technician_name,
        technician_status: b.technician_status
      }));
    }
  },
  getTechnicians: async () => {
    try {
      return await apiRequest('/providers/technicians');
    } catch {
      return [
        { id: 1, full_name: "Vikram Singh", email: "tech@homeserve.com", phone: "9876543216", skill_specialization: "Certified Electrician & Inverter HVAC Tech", is_available: true, jobs_completed: 124 },
        { id: 2, full_name: "Amit Verma", email: "tech2@homeserve.com", phone: "9876543217", skill_specialization: "Senior Plumbing & Sanitary Specialist", is_available: true, jobs_completed: 88 }
      ];
    }
  },
  addTechnician: async (data) => {
    try {
      return await apiRequest('/providers/technicians', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { id: 3, ...data, is_available: true, jobs_completed: 0 };
    }
  },
  submitKYC: (data) => apiRequest('/providers/kyc/submit', { method: 'POST', body: JSON.stringify(data) })
};

// 7. Technician Services
export const technicianApi = {
  getJobs: async () => {
    try {
      return await apiRequest('/technicians/jobs');
    } catch {
      return [
        {
          assignment_id: 1,
          booking_id: 2,
          booking_code: "HS-2026-102",
          service_name: "Switchboard & MCB Fuse Replacement",
          service_duration: 60,
          customer_name: "Rahul Sharma",
          customer_phone: "9876543211",
          address: { street: "Flat 402, Sea Breeze Residency", city: "Mumbai", landmark: "Near Joggers Park", postal_code: "400050" },
          booking_date: "2026-11-04",
          time_slot: "02:00 PM - 04:00 PM",
          special_instructions: "Living room main switchboard sparks occasionally.",
          assignment_status: "ARRIVED",
          booking_status: "IN_PROGRESS",
          assigned_at: "2026-11-04T09:00:00Z"
        }
      ];
    }
  },
  updateStatus: async (booking_id, status, remarks, image_url) => {
    try {
      return await apiRequest(`/technicians/jobs/${booking_id}/status`, { method: 'POST', body: JSON.stringify({ status, remarks, image_url }) });
    } catch {
      const b = mockBookings.find(item => item.id === Number(booking_id));
      if (b) {
        b.status = status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
        b.technician_status = status;
      }
      return { message: `Status updated to ${status}` };
    }
  }
};

// 8. Notification Services
export const notificationApi = {
  getNotifications: async () => {
    try {
      return await apiRequest('/notifications');
    } catch {
      return {
        unread_count: 2,
        notifications: [
          { id: 1, title: "Technician Arrived!", message: "Vikram Singh has arrived at your address for Switchboard Replacement (HS-2026-102).", type: "TECHNICIAN_ARRIVAL", is_read: false, created_at: new Date().toISOString() },
          { id: 2, title: "Service Completed & Invoice Ready", message: "Your AC Deep Jet Servicing (HS-2026-101) is completed. Invoice INV-2026-0001 is ready for download.", type: "INVOICE_GENERATED", is_read: false, created_at: new Date().toISOString() }
        ]
      };
    }
  },
  markAllRead: async () => {
    try {
      return await apiRequest('/notifications/mark-all-read', { method: 'POST' });
    } catch {
      return { message: "All marked read" };
    }
  },
  markOneRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' })
};

// 9. Review & Complaint Services
export const reviewApi = {
  createReview: async (booking_id, rating, comment) => {
    try {
      return await apiRequest('/reviews', { method: 'POST', body: JSON.stringify({ booking_id, rating, comment }) });
    } catch {
      return { message: "Review submitted successfully!" };
    }
  },
  replyReview: (id, provider_reply) => apiRequest(`/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify({ provider_reply }) }),
  raiseComplaint: async (data) => {
    try {
      return await apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) });
    } catch {
      return { message: "Complaint lodged successfully" };
    }
  },
  getComplaints: async () => {
    try {
      return await apiRequest('/complaints');
    } catch {
      return [
        { id: 1, booking_code: "HS-2026-101", customer_name: "Rahul Sharma", provider_name: "Apex Pro Home & Electricals", subject: "Technician arrived 10 mins early", description: "Just a minor note: technician arrived at 9:50 AM instead of 10:00 AM.", priority: "LOW", status: "RESOLVED", resolution_notes: "Checked with customer, customer was happy with early completion." }
      ];
    }
  },
  resolveComplaint: async (id, status, resolution_notes) => {
    try {
      return await apiRequest(`/complaints/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, resolution_notes }) });
    } catch {
      return { message: "Complaint resolved" };
    }
  }
};

// 10. Admin Analytics & Governance
export const adminApi = {
  getAnalytics: async () => {
    try {
      return await apiRequest('/analytics/admin');
    } catch {
      return {
        kpis: {
          total_customers: 142,
          total_providers: 28,
          verified_providers: 25,
          pending_kyc_providers: 3,
          total_technicians: 46,
          total_bookings: 312,
          pending_bookings: 14,
          in_progress_bookings: 8,
          completed_bookings: 278,
          cancelled_bookings: 12,
          total_revenue: 184590.0,
          platform_commission: 18459.0,
          provider_payouts: 166131.0,
          resolution_rate: 98.2
        },
        category_distribution: [
          { category_id: 1, category_name: "Electrical Services", booking_count: 98 },
          { category_id: 3, category_name: "AC Repair & Maintenance", booking_count: 84 },
          { category_id: 4, category_name: "Home Cleaning", booking_count: 56 },
          { category_id: 2, category_name: "Plumbing Services", booking_count: 42 },
          { category_id: 7, category_name: "Appliance Repair", booking_count: 32 }
        ],
        recent_bookings: [
          { id: 1, code: "HS-2026-101", customer: "Rahul Sharma", provider: "Apex Pro Home & Electricals", service: "AC Deep Jet Servicing", amount: 679.0, status: "COMPLETED", date: "2026-11-02" },
          { id: 2, code: "HS-2026-102", customer: "Rahul Sharma", provider: "Apex Pro Home & Electricals", service: "Switchboard Replacement", amount: 454.0, status: "IN_PROGRESS", date: "2026-11-04" },
          { id: 3, code: "HS-2026-103", customer: "Rahul Sharma", provider: "AquaFlow Plumbing", service: "Tap Leakage Repair", amount: 349.0, status: "CONFIRMED", date: "2026-11-05" }
        ]
      };
    }
  },
  getProviders: async () => {
    try {
      return await apiRequest('/admin/providers');
    } catch {
      return [
        { id: 1, company_name: "Apex Pro Home & Electricals", email: "provider@homeserve.com", phone: "9876543213", business_reg_no: "MH-MUM-2021-9921", experience_years: 8, kyc_status: "APPROVED", is_verified: true, id_proof_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80", commission_rate: 10.0, avg_rating: 4.9, total_reviews: 48, technicians_count: 4 },
        { id: 2, company_name: "AquaFlow Plumbing Masters", email: "plumb.expert@homeserve.com", phone: "9876543214", business_reg_no: "MH-PUN-2022-4412", experience_years: 6, kyc_status: "APPROVED", is_verified: true, id_proof_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80", commission_rate: 10.0, avg_rating: 4.8, total_reviews: 32, technicians_count: 3 },
        { id: 3, company_name: "SparkleClean Facility Care", email: "clean.elite@homeserve.com", phone: "9876543215", business_reg_no: "MH-MUM-2023-8831", experience_years: 4, kyc_status: "PENDING", is_verified: false, id_proof_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80", commission_rate: 12.0, avg_rating: 4.7, total_reviews: 19, technicians_count: 2 }
      ];
    }
  },
  verifyProvider: async (id, approve, reason) => {
    try {
      return await apiRequest(`/admin/providers/${id}/verify?approve=${approve}&reason=${encodeURIComponent(reason || '')}`, { method: 'POST' });
    } catch {
      return { message: approve ? "Provider verified successfully" : "Provider rejected", is_verified: approve, kyc_status: approve ? "APPROVED" : "REJECTED" };
    }
  },
  exportCsvUrl: () => `${API_BASE}/analytics/export/csv`
};
