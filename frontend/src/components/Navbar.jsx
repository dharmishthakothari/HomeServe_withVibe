import React from 'react';
import { Shield, Bell, Sparkles, User, LogIn, ChevronDown } from 'lucide-react';

export default function Navbar({
  currentUser,
  currentView,
  setCurrentView,
  unreadCount,
  onOpenNotifications,
  onOpenAuth
}) {
  return (
    <nav className="glass-panel sticky top-[33px] z-40 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentView('explore')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>HomeServe</span>
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Horizon</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400/80 -mt-1 block">
                SaaS Home Services Platform
              </span>
            </div>
          </div>

          {/* Navigation Links based on Role */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentView('explore')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'explore'
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Explore Services
            </button>

            {currentUser && currentUser.role === 'CUSTOMER' && (
              <>
                <button
                  onClick={() => setCurrentView('customer-bookings')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentView === 'customer-bookings'
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => setCurrentView('customer-addresses')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentView === 'customer-addresses'
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  My Addresses
                </button>
              </>
            )}

            {currentUser && currentUser.role === 'PROVIDER' && (
              <button
                onClick={() => setCurrentView('provider-dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  currentView === 'provider-dashboard'
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Provider Operations & Team
              </button>
            )}

            {currentUser && currentUser.role === 'TECHNICIAN' && (
              <button
                onClick={() => setCurrentView('technician-dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  currentView === 'technician-dashboard'
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                My Field Jobs
              </button>
            )}

            {currentUser && currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentView('admin-dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  currentView === 'admin-dashboard'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Super Admin Command Center
              </button>
            )}
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {currentUser && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] font-medium text-teal-400 capitalize">{currentUser.role.toLowerCase()}</div>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-teal-500/20 transition-all transform active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
