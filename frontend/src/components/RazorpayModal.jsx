import React, { useState } from 'react';
import { Shield, CreditCard, Smartphone, CheckCircle2, Lock, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RazorpayModal({
  bookingInfo,
  onSuccess,
  onClose
}) {
  const [selectedMethod, setSelectedMethod] = useState('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testCard, setTestCard] = useState({
    number: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123'
  });
  const [testUpi, setTestUpi] = useState('success@razorpay');

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      const mockPaymentId = `pay_rzp_${Date.now().toString().slice(-8)}`;
      setIsProcessing(false);
      onSuccess(mockPaymentId);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1329] border border-blue-900/60 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Razorpay Header */}
        <div className="bg-[#0c2340] p-4 border-b border-blue-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Razorpay</span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-blue-300">HomeServe Horizon Technologies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-blue-900/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="p-4 bg-blue-950/30 border-b border-blue-900/40 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Total Payable Amount</div>
            <div className="text-2xl font-black text-white">₹{bookingInfo.totalAmount.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Service</div>
            <div className="text-xs font-semibold text-teal-400 max-w-[150px] truncate">{bookingInfo.serviceName}</div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-5 space-y-4">
          <div className="flex gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedMethod('CARD')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                selectedMethod === 'CARD'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setSelectedMethod('UPI')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                selectedMethod === 'UPI'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>
          </div>

          {selectedMethod === 'CARD' ? (
            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] text-slate-400">Test Card Number</label>
                <input
                  type="text"
                  value={testCard.number}
                  onChange={e => setTestCard({...testCard, number: e.target.value})}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400">Valid Thru</label>
                  <input
                    type="text"
                    value={testCard.expiry}
                    onChange={e => setTestCard({...testCard, expiry: e.target.value})}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">CVV</label>
                  <input
                    type="password"
                    value={testCard.cvv}
                    onChange={e => setTestCard({...testCard, cvv: e.target.value})}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] text-slate-400">Test UPI ID</label>
                <input
                  type="text"
                  value={testUpi}
                  onChange={e => setTestUpi(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500">Auto-approved sandbox test payment address.</p>
            </div>
          )}

          {/* Trust notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>End-to-end 256-bit SSL encrypted sandbox environment</span>
          </div>

          {/* Action Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authorizing Test Payment...</span>
              </>
            ) : (
              <>
                <span>Pay ₹{bookingInfo.totalAmount.toFixed(2)}</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

