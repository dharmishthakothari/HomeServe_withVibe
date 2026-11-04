import React, { useState, useEffect } from 'react';
import { HardHat, MapPin, Phone, Clock, CheckCircle, Play, Camera, Navigation, AlertCircle } from 'lucide-react';
import { technicianApi } from '../services/api';

export default function TechnicianDashboard({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeModalJob, setCompleteModalJob] = useState(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionImageUrl, setCompletionImageUrl] = useState('https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80');
  const [updating, setUpdating] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await technicianApi.getJobs();
      setJobs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (bookingId, status, remarks = null, imageUrl = null) => {
    setUpdating(true);
    try {
      await technicianApi.updateStatus(bookingId, status, remarks, imageUrl);
      setCompleteModalJob(null);
      setCompletionRemarks('');
      fetchJobs();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-xs">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-800/60 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <HardHat className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Field Operations Console</div>
            <h1 className="text-xl font-black text-white">{currentUser?.name || 'Technician Vikram'}</h1>
            <p className="text-slate-400 mt-0.5">Assigned Customer Work Orders & Status Actions</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Queue</div>
          <div className="text-xl font-black text-purple-300">{jobs.length} Jobs</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading your assigned dispatch jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center border border-slate-800">
          <p className="text-slate-400 text-sm">No jobs currently assigned to you. Stand by for dispatch!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div
              key={job.assignment_id}
              className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition"
            >
              {/* Job Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-teal-400 text-sm">{job.booking_code}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{job.service_name}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  job.assignment_status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  job.assignment_status === 'ARRIVED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                  job.assignment_status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                  'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {job.assignment_status}
                </span>
              </div>

              {/* Schedule & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="space-y-1">
                  <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{job.booking_date} ({job.time_slot})</span>
                  </div>
                  <div className="text-slate-300 font-bold">{job.customer_name}</div>
                  {job.customer_phone && (
                    <a href={`tel:${job.customer_phone}`} className="text-teal-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{job.customer_phone}</span>
                    </a>
                  )}
                </div>

                {job.address && (
                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{job.address.street}, {job.address.city} - {job.address.postal_code}</span>
                    </div>
                    {job.address.landmark && (
                      <p className="text-[11px] text-slate-500">Near: {job.address.landmark}</p>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(job.address.street + ' ' + job.address.city)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Open in Navigation Maps</span>
                    </a>
                  </div>
                )}
              </div>

              {job.special_instructions && (
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px]">
                  <strong>Customer Note:</strong> {job.special_instructions}
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="text-slate-500 text-[11px]">
                  Assigned: {new Date(job.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex items-center gap-2">
                  {job.assignment_status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(job.booking_id, 'ARRIVED')}
                      disabled={updating}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>I Have Arrived at Location</span>
                    </button>
                  )}

                  {job.assignment_status === 'ARRIVED' && (
                    <button
                      onClick={() => handleUpdateStatus(job.booking_id, 'IN_PROGRESS')}
                      disabled={updating}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {['ARRIVED', 'IN_PROGRESS'].includes(job.assignment_status) && (
                    <button
                      onClick={() => setCompleteModalJob(job)}
                      disabled={updating}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Complete Job & Proof</span>
                    </button>
                  )}

                  {job.assignment_status === 'COMPLETED' && (
                    <div className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                      <CheckCircle className="w-4 h-4" />
                      <span>Job Finished & Invoiced</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {completeModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Complete Job & Upload Proof</h3>
            <p className="text-slate-400 text-xs">
              Booking: <strong className="text-white">{completeModalJob.booking_code}</strong> ({completeModalJob.service_name})
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Work Completion Remarks</label>
                <textarea
                  value={completionRemarks}
                  onChange={e => setCompletionRemarks(e.target.value)}
                  placeholder="e.g. Cleaned coils, tested wiring voltage, checked drainage."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Work Completion Photo Proof URL</label>
                <input
                  type="text"
                  value={completionImageUrl}
                  onChange={e => setCompletionImageUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalJob(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(completeModalJob.booking_id, 'COMPLETED', completionRemarks, completionImageUrl)}
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                >
                  {updating ? 'Saving...' : 'Finalize & Mark Completed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
