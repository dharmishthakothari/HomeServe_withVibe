import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, FileText, Star, Eye, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { customerApi } from '../services/api';

export default function CustomerDashboard({
  currentUser,
  onOpenTracker,
  onExploreMore
}) {
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings | addresses
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    title: 'Home',
    street_address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400050',
    landmark: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        customerApi.getBookings(),
        customerApi.getAddresses()
      ]);
      setBookings(bRes);
      setAddresses(aRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await customerApi.addAddress(newAddr);
      setShowAddAddr(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await customerApi.deleteAddress(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-teal-400 tracking-wider">Customer Portal</div>
          <h1 className="text-2xl font-black text-white mt-1">Welcome back, {currentUser?.name || 'Customer'}!</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your active service requests, track technician arrivals & view past invoices.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'bookings'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'addresses'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            Saved Addresses ({addresses.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading your account history...</div>
      ) : activeTab === 'bookings' ? (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center border border-slate-800 space-y-4">
              <p className="text-slate-400 text-sm">You haven't placed any service bookings yet.</p>
              <button
                onClick={onExploreMore}
                className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
              >
                Browse Services & Book
              </button>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {b.service_image && (
                    <img
                      src={b.service_image}
                      alt={b.service_name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-teal-400">{b.booking_code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        b.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse' :
                        b.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">{b.service_name}</h3>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        <span>{b.booking_date} ({b.time_slot})</span>
                      </span>
                      <span>•</span>
                      <span>Provider: <strong className="text-slate-300">{b.provider_name}</strong></span>
                      {b.technician_name && (
                        <>
                          <span>•</span>
                          <span className="text-teal-300">Tech: {b.technician_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Paid</div>
                    <div className="text-base font-black text-white">₹{b.total_amount.toFixed(2)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenTracker(b.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Tracker</span>
                    </button>

                    {b.has_invoice && (
                      <a
                        href={`http://127.0.0.1:8000/api/invoices/${b.invoice_number}/html`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                        title="Download Invoice"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddAddr(!showAddAddr)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddAddr ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {showAddAddr && (
            <form onSubmit={handleAddAddress} className="glass-card p-5 rounded-2xl border border-slate-700 space-y-4 text-xs">
              <h3 className="font-bold text-white text-sm">Add New Delivery Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400">Address Label</label>
                  <input
                    type="text"
                    value={newAddr.title}
                    onChange={e => setNewAddr({...newAddr, title: e.target.value})}
                    placeholder="Home / Office / Studio"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400">City</label>
                  <input
                    type="text"
                    value={newAddr.city}
                    onChange={e => setNewAddr({...newAddr, city: e.target.value})}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400">Street Address</label>
                <input
                  type="text"
                  value={newAddr.street_address}
                  onChange={e => setNewAddr({...newAddr, street_address: e.target.value})}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400">Postal Code</label>
                  <input
                    type="text"
                    value={newAddr.postal_code}
                    onChange={e => setNewAddr({...newAddr, postal_code: e.target.value})}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400">Landmark</label>
                  <input
                    type="text"
                    value={newAddr.landmark}
                    onChange={e => setNewAddr({...newAddr, landmark: e.target.value})}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <button type="submit" className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs">
                Save Address
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(a => (
              <div key={a.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{a.title}</span>
                    {a.is_default && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{a.street_address}</p>
                  <p className="text-xs text-slate-400">{a.city}, {a.state} - {a.postal_code}</p>
                  {a.landmark && <p className="text-[11px] text-slate-500 mt-1">Landmark: {a.landmark}</p>}
                </div>
                <button
                  onClick={() => handleDeleteAddress(a.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

