import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Tag, Plus, Check, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { customerApi, serviceApi } from '../services/api';

export default function BookingModal({
  service,
  onClose,
  onProceedToPayment,
  currentUser
}) {
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    title: 'Home',
    street_address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400050',
    landmark: ''
  });

  // Date and slot selection
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM'
  ];
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Active providers for this service
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    // Fetch addresses
    if (currentUser) {
      customerApi.getAddresses()
        .then(res => {
          setAddresses(res);
          if (res.length > 0) {
            const def = res.find(a => a.is_default) || res[0];
            setSelectedAddressId(def.id);
          } else {
            setShowAddAddress(true);
          }
        })
        .catch(() => {});
    }

    // Fetch providers offering this service
    serviceApi.getServiceDetail(service.id)
      .then(res => {
        if (res.providers && res.providers.length > 0) {
          setProviders(res.providers);
          setSelectedProviderId(res.providers[0].provider_id);
        } else {
          // Default fallback provider ID 1
          setSelectedProviderId(1);
        }
      })
      .catch(() => {
        setSelectedProviderId(1);
      })
      .finally(() => setLoadingProviders(false));
  }, [service, currentUser]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    try {
      const added = await customerApi.addAddress(newAddr);
      setAddresses([...addresses, added]);
      setSelectedAddressId(added.id);
      setShowAddAddress(false);
    } catch (err) {
      alert(err.message || 'Error adding address');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await serviceApi.validateCoupon(couponCode, service.base_price);
      setAppliedCoupon(res);
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Pricing
  const subtotal = service.base_price;
  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const platformFee = 29.0;
  const totalAmount = Math.max(0, subtotal - discount + platformFee);

  const handleContinue = () => {
    if (step === 1 && !selectedAddressId) {
      alert('Please select or add a delivery address to proceed.');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finalize and proceed to Razorpay test payment
      onProceedToPayment({
        provider_id: selectedProviderId || 1,
        service_id: service.id,
        address_id: selectedAddressId,
        booking_date: bookingDate,
        time_slot: selectedSlot,
        special_instructions: specialInstructions,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        subtotal,
        discount,
        platformFee,
        totalAmount,
        serviceName: service.name
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                STEP {step} OF 3
              </span>
              <h2 className="text-lg font-bold text-white">{service.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Instant booking with 30-day satisfaction warranty</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* STEP 1: Address Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Select Service Address</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddAddress ? 'Choose Existing' : 'Add New Address'}</span>
                </button>
              </div>

              {showAddAddress ? (
                <form onSubmit={handleAddNewAddress} className="glass-card p-4 rounded-xl border border-slate-700/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400">Label (Home, Office)</label>
                      <input
                        type="text"
                        value={newAddr.title}
                        onChange={e => setNewAddr({...newAddr, title: e.target.value})}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">City</label>
                      <input
                        type="text"
                        value={newAddr.city}
                        onChange={e => setNewAddr({...newAddr, city: e.target.value})}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Street Address</label>
                    <input
                      type="text"
                      value={newAddr.street_address}
                      onChange={e => setNewAddr({...newAddr, street_address: e.target.value})}
                      placeholder="Flat/House No, Building, Street..."
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400">Postal Code</label>
                      <input
                        type="text"
                        value={newAddr.postal_code}
                        onChange={e => setNewAddr({...newAddr, postal_code: e.target.value})}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Landmark (Optional)</label>
                      <input
                        type="text"
                        value={newAddr.landmark}
                        onChange={e => setNewAddr({...newAddr, landmark: e.target.value})}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
                  >
                    Save & Select Address
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No saved addresses yet. Click "Add New Address" above.
                    </div>
                  ) : (
                    addresses.map(a => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAddressId(a.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                          selectedAddressId === a.id
                            ? 'border-teal-500 bg-teal-950/20 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                            <span>{a.title}</span>
                            {a.is_default && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">DEFAULT</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{a.street_address}, {a.city} - {a.postal_code}</p>
                          {a.landmark && <p className="text-[10px] text-slate-500">Landmark: {a.landmark}</p>}
                        </div>
                        {selectedAddressId === a.id && (
                          <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-slate-950">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Date & Slot Selection */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Choose Service Date</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Select Time Slot</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                        selectedSlot === slot
                          ? 'border-teal-400 bg-teal-950/30 text-teal-300 shadow-sm shadow-teal-500/20'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Special Instructions for Technician (Optional)</label>
                <textarea
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Please bring extra 16A modular sockets; ring doorbell twice."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Summary, Promo Coupon & Price Breakdown */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Promo Coupon Applicator */}
              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  <span>Have a Promo Coupon?</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Try WELCOME100 or HORIZON20"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                  >
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{appliedCoupon.message}</span>
                  </div>
                )}
                {couponError && (
                  <div className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-200 border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                  <span>Bill Summary</span>
                  <span className="text-[10px] text-teal-400 font-normal">All taxes included</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Base Service Charge ({service.duration_minutes}m)</span>
                  <span className="text-slate-200 font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Platform Trust & Safety Fee</span>
                  <span className="text-slate-200 font-medium">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Total Payable Amount</span>
                  <span className="text-teal-400 text-base font-black">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Pill */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                <span>Protected by Razorpay Test Sandbox • 100% Secure Checkout with Instant Automated Invoice.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition transform active:scale-95"
          >
            <span>{step === 3 ? 'Proceed to Razorpay Payment' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}

