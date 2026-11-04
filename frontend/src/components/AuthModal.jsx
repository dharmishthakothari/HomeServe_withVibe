import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { authApi, setToken, setUser } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: '',
    experience_years: 1,
    skill_specialization: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await authApi.login(form.email, form.password);
        setToken(res.access_token);
        setUser(res);
        onAuthSuccess(res);
        onClose();
      } else {
        const res = await authApi.register({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone,
          role: role,
          company_name: form.company_name,
          experience_years: Number(form.experience_years),
          skill_specialization: form.skill_specialization
        });
        setToken(res.access_token);
        setUser(res);
        onAuthSuccess(res);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (email, password) => {
    setForm(prev => ({ ...prev, email, password }));
    setIsLogin(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isLogin ? 'Sign In to HomeServe' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLogin ? 'Access your dashboard, bookings & profile' : 'Join as a Customer or Service Provider'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${
              isLogin ? 'border-teal-400 text-teal-300' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${
              !isLogin ? 'border-teal-400 text-teal-300' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`py-2 rounded-lg font-semibold border text-center transition ${
                    role === 'CUSTOMER' ? 'border-teal-400 bg-teal-950/30 text-teal-300' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('PROVIDER')}
                  className={`py-2 rounded-lg font-semibold border text-center transition ${
                    role === 'PROVIDER' ? 'border-teal-400 bg-teal-950/30 text-teal-300' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  Service Provider
                </button>
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-[11px] text-slate-400">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                placeholder="Rahul Sharma"
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          )}

          {!isLogin && role === 'PROVIDER' && (
            <div>
              <label className="text-[11px] text-slate-400">Company / Business Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => setForm({...form, company_name: e.target.value})}
                placeholder="Apex Pro Solutions"
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-slate-400">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="name@example.com"
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="••••••••"
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
