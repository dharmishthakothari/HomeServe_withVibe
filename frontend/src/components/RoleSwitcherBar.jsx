import React from 'react';
import { ShieldCheck, User, Wrench, HardHat, LogOut, CheckCircle2 } from 'lucide-react';

export default function RoleSwitcherBar({ currentUser, onSwitchRole, onLogout }) {
  const personas = [
    {
      role: 'ADMIN',
      title: 'Super Admin',
      email: 'admin@homeserve.com',
      password: 'admin123',
      icon: ShieldCheck,
      color: 'from-amber-500 to-orange-500',
      border: 'hover:border-amber-400',
      activeBorder: 'border-amber-400 text-amber-300 bg-amber-950/40'
    },
    {
      role: 'CUSTOMER',
      title: 'Customer (Rahul)',
      email: 'customer@homeserve.com',
      password: 'cust123',
      icon: User,
      color: 'from-teal-500 to-emerald-500',
      border: 'hover:border-teal-400',
      activeBorder: 'border-teal-400 text-teal-300 bg-teal-950/40'
    },
    {
      role: 'PROVIDER',
      title: 'Provider (Apex Pro)',
      email: 'provider@homeserve.com',
      password: 'prov123',
      icon: Wrench,
      color: 'from-cyan-500 to-blue-500',
      border: 'hover:border-cyan-400',
      activeBorder: 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
    },
    {
      role: 'TECHNICIAN',
      title: 'Technician (Vikram)',
      email: 'tech@homeserve.com',
      password: 'tech123',
      icon: HardHat,
      color: 'from-purple-500 to-indigo-500',
      border: 'hover:border-purple-400',
      activeBorder: 'border-purple-400 text-purple-300 bg-purple-950/40'
    }
  ];

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-xs py-2 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
            Capstone Demo Persona Switcher:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {personas.map((p) => {
            const Icon = p.icon;
            const isActive = currentUser && currentUser.email === p.email;
            return (
              <button
                key={p.role}
                onClick={() => onSwitchRole(p.email, p.password)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-150 font-medium ${
                  isActive
                    ? p.activeBorder + ' shadow-sm shadow-teal-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 ' + p.border + ' hover:text-slate-200'
                }`}
                title={`Instant switch to ${p.title}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.title}</span>
                {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            <span className="text-slate-400 hidden md:inline">
              Active: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.role})
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/40 transition"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
