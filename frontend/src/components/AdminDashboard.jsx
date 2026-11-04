import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Plus, CheckCircle, XCircle, AlertTriangle, Users, DollarSign, TrendingUp, Briefcase, FileSpreadsheet, Eye } from 'lucide-react';
import { adminApi, reviewApi, serviceApi } from '../services/api';

export default function AdminDashboard({ currentUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [providers, setProviders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | kyc | complaints | services

  // Resolve complaint modal
  const [resolveCompModal, setResolveCompModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  // Add Category modal
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '', icon: 'Wrench', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anRes, provRes, compRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getProviders(),
        reviewApi.getComplaints()
      ]);
      setAnalytics(anRes);
      setProviders(provRes);
      setComplaints(compRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyProvider = async (providerId, approve) => {
    const reason = approve ? '' : prompt('Reason for rejection:') || 'Incomplete documentation';
    try {
      await adminApi.verifyProvider(providerId, approve, reason);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!resolveCompModal) return;
    try {
      await reviewApi.resolveComplaint(resolveCompModal.id, 'RESOLVED', resolveNotes);
      setResolveCompModal(null);
      setResolveNotes('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const slug = newCat.slug || newCat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await serviceApi.createCategory({ ...newCat, slug });
      setShowAddCat(false);
      setNewCat({ name: '', slug: '', icon: 'Wrench', description: '' });
      alert('New service category created!');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadCsv = () => {
    window.open('http://127.0.0.1:8000/api/analytics/export/csv', '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-xs">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-900/40 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Super Administrator Command Center</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Platform Analytics & Global Governance</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time revenue attribution, KYC document auditing & customer dispute resolutions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>

          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['overview', 'kyc', 'complaints'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition ${
                  activeTab === t
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'kyc' ? `KYC Approvals (${providers.filter(p => p.kyc_status === 'PENDING').length})` :
                 t === 'complaints' ? `Disputes (${complaints.filter(c => c.status === 'OPEN').length})` :
                 'Analytics'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading platform governance telemetry...</div>
      ) : activeTab === 'overview' && analytics ? (
        <div className="space-y-8">
          {/* KPI Matrix */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-slate-400 font-medium">Total Billed Revenue</div>
              <div className="text-2xl font-black text-white mt-1">₹{analytics.kpis.total_revenue.toFixed(2)}</div>
              <div className="text-[11px] text-emerald-400 mt-1">Across all verified bookings</div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-slate-400 font-medium">Platform Commission (10%)</div>
              <div className="text-2xl font-black text-teal-400 mt-1">₹{analytics.kpis.platform_commission.toFixed(2)}</div>
              <div className="text-[11px] text-teal-300 mt-1">Net platform SaaS earnings</div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-slate-400 font-medium">Provider Disbursements</div>
              <div className="text-2xl font-black text-amber-400 mt-1">₹{analytics.kpis.provider_payouts.toFixed(2)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Earned by {analytics.kpis.total_providers} providers</div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <div className="text-slate-400 font-medium">Dispute Resolution Rate</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{analytics.kpis.resolution_rate}%</div>
              <div className="text-[11px] text-slate-400 mt-1">{complaints.length} tickets handled</div>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Registered Customers</span>
              <div className="text-lg font-bold text-white mt-1">{analytics.kpis.total_customers}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Field Technicians</span>
              <div className="text-lg font-bold text-white mt-1">{analytics.kpis.total_technicians}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Total Bookings</span>
              <div className="text-lg font-bold text-white mt-1">{analytics.kpis.total_bookings}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">Pending KYC Audits</span>
              <div className="text-lg font-bold text-amber-400 mt-1">{analytics.kpis.pending_kyc_providers}</div>
            </div>
          </div>

          {/* Category Distribution & Recent Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category popularity */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Category Popularity & Booking Share</h3>
              <div className="space-y-3">
                {analytics.category_distribution.map(cat => {
                  const percent = analytics.kpis.total_bookings > 0
                    ? Math.round((cat.booking_count / analytics.kpis.total_bookings) * 100)
                    : 0;
                  return (
                    <div key={cat.category_id} className="space-y-1">
                      <div className="flex justify-between text-slate-300 font-medium">
                        <span>{cat.category_name}</span>
                        <span>{cat.booking_count} bookings ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, 8)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Live Platform Activity Stream</h3>
              <div className="space-y-2.5">
                {analytics.recent_bookings.map(b => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-400">{b.code}</span>
                        <span className="text-white font-medium">{b.service}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.customer} • {b.provider}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">₹{b.amount.toFixed(2)}</div>
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'kyc' ? (
        /* KYC Verifications Tab */
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Service Provider KYC Audits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse glass-card rounded-2xl overflow-hidden border border-slate-800">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Registration No</th>
                  <th className="p-3.5">Experience</th>
                  <th className="p-3.5">KYC Document</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {providers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{p.company_name}</div>
                      <div className="text-[10px] text-slate-400">{p.email} • {p.phone}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{p.business_reg_no || 'N/A'}</td>
                    <td className="p-3.5 text-slate-300">{p.experience_years} Years</td>
                    <td className="p-3.5">
                      {p.id_proof_url ? (
                        <a
                          href={p.id_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">Not Uploaded</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.kyc_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        p.kyc_status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {p.kyc_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleVerifyProvider(p.id, true)}
                        className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerifyProvider(p.id, false)}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Complaints Tab */
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Customer Dispute & Support Tickets</h2>
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center text-slate-400">
                No active complaints filed.
              </div>
            ) : (
              complaints.map(c => (
                <div key={c.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.priority === 'URGENT' ? 'bg-rose-500 text-white' :
                          c.priority === 'HIGH' ? 'bg-amber-500 text-slate-950' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {c.priority} PRIORITY
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Filed by: <strong className="text-slate-200">{c.customer_name}</strong> for booking <strong className="text-teal-400">{c.booking_code}</strong> (Provider: {c.provider_name})
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    "{c.description}"
                  </p>

                  {c.resolution_notes && (
                    <div className="p-2.5 rounded-lg bg-teal-950/20 border border-teal-900/40 text-teal-300 text-[11px]">
                      <strong>Resolution Notes:</strong> {c.resolution_notes}
                    </div>
                  )}

                  {c.status !== 'RESOLVED' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setResolveCompModal(c)}
                        className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resolve Complaint Modal */}
      {resolveCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Resolve Customer Dispute</h3>
            <p className="text-slate-400 text-xs">
              Subject: <strong className="text-white">{resolveCompModal.subject}</strong>
            </p>

            <form onSubmit={handleResolveComplaint} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Resolution Explanation & Actions Taken</label>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="e.g. Refund issued to customer; provider given warning."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveCompModal(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold"
                >
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

