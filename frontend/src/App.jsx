import React, { useState, useEffect } from 'react';
import RoleSwitcherBar from './components/RoleSwitcherBar';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServiceCard from './components/ServiceCard';
import BookingModal from './components/BookingModal';
import RazorpayModal from './components/RazorpayModal';
import BookingTrackerModal from './components/BookingTrackerModal';
import NotificationDrawer from './components/NotificationDrawer';
import AuthModal from './components/AuthModal';

import CustomerDashboard from './components/CustomerDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import AdminDashboard from './components/AdminDashboard';

import {
  getUser, setUser, setToken, removeToken,
  authApi, serviceApi, bookingApi, paymentApi, notificationApi
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUserState] = useState(getUser());
  const [currentView, setCurrentView] = useState('explore'); // explore | customer-bookings | customer-addresses | provider-dashboard | technician-dashboard | admin-dashboard
  
  // Services & Categories data
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingServices, setLoadingServices] = useState(true);

  // Modals state
  const [selectedServiceToBook, setSelectedServiceToBook] = useState(null);
  const [pendingPaymentBooking, setPendingPaymentBooking] = useState(null);
  const [activeTrackerBookingId, setActiveTrackerBookingId] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Auto-login default demo customer on first visit if not logged in
  useEffect(() => {
    if (!currentUser) {
      handleRoleSwitch('customer@homeserve.com', 'cust123');
    }
  }, []);

  // Fetch Categories & Services
  useEffect(() => {
    serviceApi.getCategories()
      .then(res => setCategories(res))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoadingServices(true);
    serviceApi.getServices({
      category_id: selectedCategory,
      search: searchQuery
    })
      .then(res => setServices(res))
      .catch(console.error)
      .finally(() => setLoadingServices(false));
  }, [selectedCategory, searchQuery]);

  // Fetch Notifications when user changes
  const fetchNotifications = () => {
    if (currentUser) {
      notificationApi.getNotifications()
        .then(res => {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unread_count || 0);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle instant role switch from the top bar
  const handleRoleSwitch = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      setToken(res.access_token);
      setUser(res);
      setCurrentUserState(res);

      // Automatically switch default view based on role
      if (res.role === 'ADMIN') setCurrentView('admin-dashboard');
      else if (res.role === 'PROVIDER') setCurrentView('provider-dashboard');
      else if (res.role === 'TECHNICIAN') setCurrentView('technician-dashboard');
      else setCurrentView('explore');

      fetchNotifications();
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('homeserve_user');
    setCurrentUserState(null);
    setCurrentView('explore');
  };

  // Booking Flow: Step 1 -> Booking created -> Razorpay Modal
  const handleProceedToPayment = async (bookingData) => {
    try {
      const res = await bookingApi.createBooking({
        provider_id: bookingData.provider_id,
        service_id: bookingData.service_id,
        address_id: bookingData.address_id,
        booking_date: bookingData.booking_date,
        time_slot: bookingData.time_slot,
        special_instructions: bookingData.special_instructions,
        coupon_code: bookingData.coupon_code
      });

      setSelectedServiceToBook(null);
      setPendingPaymentBooking({
        bookingId: res.id,
        bookingCode: res.booking_code,
        totalAmount: res.total_amount,
        serviceName: bookingData.serviceName
      });
    } catch (err) {
      alert(err.message || 'Error creating booking');
    }
  };

  // Payment Flow: Razorpay simulation success -> Verify API -> Open Live Tracker
  const handlePaymentSuccess = async (mockPaymentId) => {
    try {
      const res = await paymentApi.verifyPayment({
        booking_id: pendingPaymentBooking.bookingId,
        gateway_payment_id: mockPaymentId
      });

      const bookedId = pendingPaymentBooking.bookingId;
      setPendingPaymentBooking(null);
      fetchNotifications();
      
      // Prompt live tracker immediately
      setActiveTrackerBookingId(bookedId);
    } catch (err) {
      alert(err.message || 'Payment verification failed');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950">
      
      {/* 1. Sticky Persona Switcher Bar */}
      <RoleSwitcherBar
        currentUser={currentUser}
        onSwitchRole={handleRoleSwitch}
        onLogout={handleLogout}
      />

      {/* 2. Main Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 3. Dynamic Views */}
      <main className="flex-1">
        {currentView === 'explore' && (
          <div>
            {/* Hero & Discovery */}
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
            />

            {/* Services Grid Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {selectedCategory
                      ? `${categories.find(c => c.id === selectedCategory)?.name || 'Category'} Services`
                      : 'Featured Home Services'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Verified background-checked technicians with standard fixed rate cards.</p>
                </div>
                <span className="text-xs text-teal-400 font-bold">
                  {services.length} services available
                </span>
              </div>

              {loadingServices ? (
                <div className="text-center py-20 text-slate-400">Loading catalog...</div>
              ) : services.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center border border-slate-800">
                  <p className="text-slate-400 text-sm">No services matched your query. Try searching for "AC" or "Cleaning".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {services.map(s => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      onBook={(service) => {
                        if (!currentUser) {
                          setIsAuthModalOpen(true);
                          return;
                        }
                        setSelectedServiceToBook(service);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'customer-bookings' && (
          <CustomerDashboard
            currentUser={currentUser}
            onOpenTracker={(id) => setActiveTrackerBookingId(id)}
            onExploreMore={() => setCurrentView('explore')}
          />
        )}

        {currentView === 'customer-addresses' && (
          <CustomerDashboard
            currentUser={currentUser}
            onOpenTracker={(id) => setActiveTrackerBookingId(id)}
            onExploreMore={() => setCurrentView('explore')}
          />
        )}

        {currentView === 'provider-dashboard' && (
          <ProviderDashboard
            currentUser={currentUser}
          />
        )}

        {currentView === 'technician-dashboard' && (
          <TechnicianDashboard
            currentUser={currentUser}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            currentUser={currentUser}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">HomeServe Horizon SaaS</span> • Complete SDLC Full Stack Capstone Project
          </div>
          <div className="flex gap-4">
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
              Swagger API Docs
            </a>
            <a href="http://127.0.0.1:8000/redoc" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
              ReDoc
            </a>
            <span>•</span>
            <span>MySQL 8.0 • FastAPI • React 19 • Tailwind CSS</span>
          </div>
        </div>
      </footer>

      {/* 5. Modals */}
      {selectedServiceToBook && (
        <BookingModal
          service={selectedServiceToBook}
          currentUser={currentUser}
          onClose={() => setSelectedServiceToBook(null)}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {pendingPaymentBooking && (
        <RazorpayModal
          bookingInfo={pendingPaymentBooking}
          onClose={() => setPendingPaymentBooking(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {activeTrackerBookingId && (
        <BookingTrackerModal
          bookingId={activeTrackerBookingId}
          currentUser={currentUser}
          onClose={() => setActiveTrackerBookingId(null)}
          onRefresh={fetchNotifications}
        />
      )}

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => {
          setCurrentUserState(u);
          fetchNotifications();
        }}
      />

    </div>
  );
}
