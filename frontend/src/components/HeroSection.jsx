import React from 'react';
import { Search, ShieldCheck, Clock, Award, Sparkles, Zap, Droplets, Wind } from 'lucide-react';

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories
}) {
  return (
    <div className="relative overflow-hidden pt-8 pb-12 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-950/40 text-teal-300 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>India's Most Trusted Home Services SaaS Ecosystem</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Expert Home Repairs,{' '}
          <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-200 bg-clip-text text-transparent">
            Delivered in Under 60 Minutes.
          </span>
        </h1>

        <p className="mt-4 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Connect with certified electricians, plumbers, HVAC technicians, and deep cleaners with real-time arrival tracking and transparent instant billing.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="glass-card p-2 rounded-2xl flex items-center gap-2 border border-slate-700/60 shadow-xl shadow-slate-950/50">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5 text-teal-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for 'AC jet wash', 'switchboard repair', 'tap leak'..."
              className="w-full bg-transparent border-none text-white placeholder-slate-500 focus:outline-none text-sm sm:text-base py-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Clear
              </button>
            )}
            <button
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition transform active:scale-95 shadow-md shadow-teal-500/20 shrink-0"
            >
              Find Pro
            </button>
          </div>
        </div>

        {/* Category Carousel Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
              selectedCategory === null
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            All Services
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                selectedCategory === c.id
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>100% Verified Providers</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Real-Time Live ETA</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>30-Day Service Warranty</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Zero Advance Required</span>
          </div>
        </div>

      </div>
    </div>
  );
}

