import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, User, Phone, MapPin, FileText, Star, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { bookingApi, reviewApi } from '../services/api';

export default function BookingTrackerModal({
  bookingId,
  onClose,
  currentUser,
  onRefresh
}) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review Form
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Complaint Form
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintPriority, setComplaintPriority] = useState('MEDIUM');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const fetchDetail = () => {
    bookingApi.getBookingDetail(bookingId)
      .then(res => setBooking(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [bookingId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      await reviewApi.createReview(booking.id, rating, reviewComment);
      alert('Thank you! Your review has been published.');
      setShowReview(false);
      fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Error submitting review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setComplaintSubmitting(true);
    try {
      await reviewApi.raiseComplaint({
        booking_id: booking.id,
        subject: complaintSubject,
        description: complaintDesc,
        priority: complaintPriority
      });
      alert('Complaint lodged. Our customer dispute resolution team will review within 24 hours.');
      setShowComplaint(false);
      fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Error raising complaint');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Are you sure you want to cancel booking ${booking.booking_code}?`)) return;
    try {
      await bookingApi.cancelBooking(booking.id, 'Customer requested cancellation via tracker');
      alert('Booking cancelled successfully.');
      fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading booking telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="glass-panel p-6 rounded-2xl max-w-sm text-center">
          <p className="text-rose-400 text-sm mb-4">{error || 'Booking not found'}</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-teal-400">{booking.booking_code}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                booking.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                booking.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse' :
                booking.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{booking.service.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Animated Status Stepper */}
          <div className="glass-card p-4 rounded-xl border border-slate-800">
            <h4 className="text-slate-400 font-semibold mb-4 text-[11px] uppercase tracking-wider">Live Booking Pipeline</h4>
            <div className="relative flex justify-between">
              {/* Stepper connecting line */}
              <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-800 -z-0"></div>

              {booking.timeline.map((step, idx) => (
                <div key={step.stage} className="relative z-10 flex flex-col items-center text-center max-w-[80px]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.is_completed
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : step.is_current
                      ? 'bg-teal-500 text-slate-950 animate-pulse ring-4 ring-teal-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {step.is_completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`mt-2 font-medium leading-tight ${step.is_current ? 'text-teal-300' : step.is_completed ? 'text-slate-200' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service & Technician Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service & Schedule info */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Appointment Info</span>
              <div className="text-slate-200 font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>{booking.booking_date} ({booking.time_slot})</span>
              </div>
              <div className="text-slate-400 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{booking.address.street}, {booking.address.city} - {booking.address.postal_code}</span>
              </div>
              <div className="text-slate-400">
                Provider: <strong className="text-slate-200">{booking.provider.company_name}</strong>
              </div>
            </div>

            {/* Technician card */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assigned Technician</span>
              {booking.technician ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <User className="w-4 h-4 text-teal-400" />
                    <span>{booking.technician.name}</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <a href={`tel:${booking.technician.phone}`} className="text-teal-400 hover:underline">
                      {booking.technician.phone || '+91 98765 43216'}
                    </a>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Status: <span className="text-emerald-400 font-semibold">{booking.technician.status}</span>
                  </div>
                  {booking.technician.remarks && (
                    <p className="text-[11px] text-slate-400 italic">"{booking.technician.remarks}"</p>
                  )}
                </>
              ) : (
                <div className="text-slate-400 py-3">
                  A certified technician is being dispatched by {booking.provider.company_name}.
                </div>
              )}
            </div>
          </div>

          {/* Before & After Work Photos */}
          {booking.images && booking.images.length > 0 && (
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Service Documentation Photos</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {booking.images.map((img, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    <img src={img.url} alt="work photo" className="h-28 w-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-bold text-teal-300">
                      {img.type}
                    </span>
                    {img.notes && (
                      <p className="p-1.5 text-[10px] text-slate-400 truncate bg-slate-950/90">{img.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice & Payment Banner */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-200">
                Payment: <span className="text-emerald-400">{booking.payment ? booking.payment.status : 'PENDING'}</span>
              </div>
              <p className="text-[11px] text-slate-400">Total Billed: ₹{booking.pricing.total_amount.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-2">
              {booking.invoice && (
                <a
                  href={`http://127.0.0.1:8000${booking.invoice.pdf_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Tax Invoice ({booking.invoice.invoice_number})</span>
                </a>
              )}

              {booking.status === 'COMPLETED' && !showReview && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-semibold transition"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Rate & Review</span>
                </button>
              )}

              {!showComplaint && (
                <button
                  onClick={() => setShowComplaint(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Review Form */}
          {showReview && (
            <form onSubmit={handleSubmitReview} className="glass-card p-4 rounded-xl border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">Rate Your Service Experience</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRating(st)}
                      className={`p-1 transition ${st <= rating ? 'text-amber-400 scale-110' : 'text-slate-600'}`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience with the technician and quality of work..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReview(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {reviewSubmitting ? 'Posting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          )}

          {/* Interactive Complaint Form */}
          {showComplaint && (
            <form onSubmit={handleSubmitComplaint} className="glass-card p-4 rounded-xl border border-rose-500/40 space-y-3">
              <span className="font-bold text-rose-300">Raise a Support Ticket / Dispute</span>
              <input
                type="text"
                value={complaintSubject}
                onChange={e => setComplaintSubject(e.target.value)}
                placeholder="Issue Subject (e.g. Technician arrived late, improper wiring)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                required
              />
              <textarea
                value={complaintDesc}
                onChange={e => setComplaintDesc(e.target.value)}
                placeholder="Describe your complaint in detail for our Super Admin team to investigate..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComplaint(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={complaintSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {complaintSubmitting ? 'Lodging...' : 'File Complaint'}
                </button>
              </div>
            </form>
          )}

          {/* Cancellation Option for Customer */}
          {['PENDING', 'CONFIRMED'].includes(booking.status) && (
            <div className="text-right">
              <button
                onClick={handleCancel}
                className="text-rose-400 hover:text-rose-300 hover:underline text-[11px]"
              >
                Cancel this booking
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
