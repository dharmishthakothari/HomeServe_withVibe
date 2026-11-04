import React, { useState, useEffect } from 'react';
import { Wrench, Users, DollarSign, Star, Calendar, CheckCircle, XCircle, UserPlus, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { providerApi, bookingApi } from '../services/api';

export default function ProviderDashboard({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings | team

  // Assign Tech Modal
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Add Tech Modal
  const [showAddTech, setShowAddTech] = useState(false);
  const [newTech, setNewTech] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: 'tech123',
    skill_specialization: 'Certified Electrician & HVAC Tech'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, bRes, tRes] = await Promise.all([
        providerApi.getStats(),
        providerApi.getBookings(),
        providerApi.getTechnicians()
      ]);
      setStats(sRes);
      setBookings(bRes);
      setTechnicians(tRes);
      if (tRes.length > 0) setSelectedTechId(tRes[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingApi.updateStatus(bookingId, status);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignTech = async (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    setAssignLoading(true);
    try {
      await bookingApi.assignTechnician(assignModalBooking.id, selectedTechId, assignRemarks);
      setAssignModalBooking(null);
      setAssignRemarks('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAddTech = async (e) => {
    e.preventDefault();
    try {
      await providerApi.addTechnician(newTech);
      setShowAddTech(false);
      setNewTech({ full_name: '', email: '', phone: '', password: 'tech123', skill_specialization: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-xs">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-2">
            <span>Provider Operations Hub</span>
            {stats?.is_verified && (
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                <span>KYC VERIFIED</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white mt-1">{stats?.company_name || 'Apex Pro Solutions'}</h1>
          <p className="text-xs text-slate-400 mt-1">Manage dispatch schedules, field technician assignments & revenue settlements.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'bookings'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            Bookings Queue ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'team'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            Technicians Team ({technicians.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-slate-400 font-medium">Total Bookings</div>
            <div className="text-2xl font-black text-white mt-1">{stats.metrics.total_bookings}</div>
            <div className="text-[11px] text-teal-400 mt-1">{stats.metrics.completed_bookings} Completed</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-slate-400 font-medium">Pending Requests</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.metrics.pending_bookings}</div>
            <div className="text-[11px] text-slate-400 mt-1">Needs confirmation</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-slate-400 font-medium">Net Settled Earnings</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹{stats.metrics.total_earnings.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 mt-1">Platform cut: 10%</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="text-slate-400 font-medium">Average Rating</div>
            <div className="text-2xl font-black text-amber-300 mt-1 flex items-center gap-1.5">
              <span>{stats.avg_rating}</span>
              <Star className="w-5 h-5 fill-current text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{stats.total_reviews} verified reviews</div>
          </div>
        </div>
      )}

      {/* Bookings Queue */}
      {activeTab === 'bookings' ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Service Booking Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse glass-card rounded-2xl overflow-hidden border border-slate-800">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Booking Code</th>
                  <th className="p-3.5">Service</th>
                  <th className="p-3.5">Customer & Phone</th>
                  <th className="p-3.5">Schedule</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Tech</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-mono font-bold text-teal-400">{b.booking_code}</td>
                    <td className="p-3.5 font-semibold text-white">{b.service_name}</td>
                    <td className="p-3.5">
                      <div className="text-slate-200 font-medium">{b.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{b.customer_phone || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div>{b.booking_date}</div>
                      <div className="text-[10px] text-slate-400">{b.time_slot}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        b.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse' :
                        b.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {b.assigned_technician_name ? (
                        <span className="text-teal-300 font-medium">{b.assigned_technician_name}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {b.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                            className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {['CONFIRMED', 'PROVIDER_ASSIGNED'].includes(b.status) && (
                        <button
                          onClick={() => setAssignModalBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold transition"
                        >
                          {b.assigned_technician_name ? 'Reassign Tech' : 'Assign Tech'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Team Tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Field Technicians Roster</h2>
            <button
              onClick={() => setShowAddTech(!showAddTech)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Technician</span>
            </button>
          </div>

          {showAddTech && (
            <form onSubmit={handleAddTech} className="glass-card p-5 rounded-2xl border border-slate-700 space-y-3">
              <h3 className="font-bold text-white text-sm">Add New Field Technician</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={newTech.full_name}
                    onChange={e => setNewTech({...newTech, full_name: e.target.value})}
                    placeholder="Vikram Singh"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400">Skill Specialization</label>
                  <input
                    type="text"
                    value={newTech.skill_specialization}
                    onChange={e => setNewTech({...newTech, skill_specialization: e.target.value})}
                    placeholder="Inverter AC & Wiring Specialist"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Email Address (Login)</label>
                  <input
                    type="email"
                    value={newTech.email}
                    onChange={e => setNewTech({...newTech, email: e.target.value})}
                    placeholder="tech@apexpro.com"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400">Mobile Phone</label>
                  <input
                    type="text"
                    value={newTech.phone}
                    onChange={e => setNewTech({...newTech, phone: e.target.value})}
                    placeholder="9876543216"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">
                Register Technician
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map(t => (
              <div key={t.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{t.full_name}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.is_available ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.is_available ? 'AVAILABLE' : 'ON JOB'}
                  </span>
                </div>
                <p className="text-teal-400 text-xs">{t.skill_specialization}</p>
                <div className="text-slate-400 text-xs">Email: {t.email}</div>
                <div className="text-slate-400 text-xs">Phone: {t.phone}</div>
                <div className="pt-2 border-t border-slate-800 text-slate-300 font-semibold">
                  Jobs Completed: <strong className="text-white">{t.jobs_completed}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Tech Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Assign Field Technician</h3>
              <button onClick={() => setAssignModalBooking(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-xs">
              Booking: <strong className="text-white">{assignModalBooking.booking_code}</strong> ({assignModalBooking.service_name})
            </p>

            <form onSubmit={handleAssignTech} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Select Technician</label>
                <select
                  value={selectedTechId}
                  onChange={e => setSelectedTechId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                >
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} - {t.skill_specialization} ({t.jobs_completed} jobs done)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dispatch Remarks</label>
                <textarea
                  value={assignRemarks}
                  onChange={e => setAssignRemarks(e.target.value)}
                  placeholder="e.g. Please carry extra thermal paste and testing multimeter."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={assignLoading}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                {assignLoading ? 'Dispatching...' : 'Confirm Technician Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
