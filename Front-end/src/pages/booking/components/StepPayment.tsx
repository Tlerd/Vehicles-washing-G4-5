import React, { useState } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { CheckCircle2, QrCode } from 'lucide-react';

// Single Source of Truth VinaWash Menu to recalculate price
const vinawashMenu = {
  rua_xe_and_combo: { items: [{ id: "vw_basic", price: 180000 }, { id: "vw_detail", price: 280000 }, { id: "vw_ultimate", price: 640000 }, { id: "rua_ngoai", price: 90000 }, { id: "rua_gam", price: 50000 }] },
  ve_sinh_trong: { items: [{ id: "interior_super", price: 1400000 }, { id: "interior_ultimate", price: 1900000 }, { id: "interior_plus", price: 2300000 }, { id: "ghe_le", price: 350000 }, { id: "noi_soi_1", price: 1200000 }] },
  ve_sinh_ngoai: { items: [{ id: "khoang_may", price: 800000 }, { id: "tay_nhua_duong", price: 400000 }] },
  xu_ly_be_mat: { items: [{ id: "polish_basic", price: 1500000 }, { id: "polish_hieu_chinh", price: 2200000 }] },
  bao_ve: { items: [{ id: "ceramic_2", price: 8500000 }, { id: "ppf_dopon", price: 21000000 }, { id: "film_3m", price: 15600000 }] }
};

interface StepPaymentProps {
  onCompleteBooking: () => void;
}

export const StepPayment: React.FC<StepPaymentProps> = ({ onCompleteBooking }) => {
  const { state, multiplier } = useBooking();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const allItems = Object.values(vinawashMenu).flatMap(cat => cat.items);
  const totalPrice = state.selectedServices.reduce((sum, serviceId) => {
    const item = allItems.find(i => i.id === serviceId);
    return sum + (item ? item.price * multiplier : 0);
  }, 0);

  const bookingRef = "AWP-381927"; // Mock Booking Reference ID

  if (isConfirmed) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Booking Ref: <span className="font-bold text-brand-orange">{bookingRef}</span>
          </p>
        </div>
        <div className="glass-card p-6 text-sm text-left leading-relaxed">
          <p className="font-semibold mb-1">Status: Pending Verification</p>
          <p className="text-slate-500 dark:text-slate-400">
            Our staff is checking the manual bank transfer transaction. We will call or send an SMS confirmation to your number: <span className="font-bold">{state.customerInfo.phone}</span> shortly.
          </p>
        </div>
        <button onClick={onCompleteBooking} className="btn-primary w-full">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-2 text-center">Payment & Final Confirmation</h2>
      <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Scan the VietQR code to make a 100% manual bank transfer.</p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: QR code and Transfer details */}
        <div className="flex-1 glass-card p-6 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <QrCode className="text-brand-orange w-5 h-5" /> Bank Transfer
          </h3>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Fake QR Image placeholder */}
            <div className="w-44 h-44 bg-white border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col justify-between items-center text-slate-800">
              <div className="w-full text-center font-bold text-blue-800 text-[10px]">VietQR</div>
              <div className="w-32 h-32 bg-slate-100 flex items-center justify-center border border-slate-200 border-dashed text-slate-400">
                QR Placeholder
              </div>
              <div className="w-full text-center text-slate-400 text-[8px]">Scan with Banking App</div>
            </div>

            {/* Bank accounts description */}
            <div className="flex-1 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                <span className="text-slate-400">Bank:</span>
                <span className="font-semibold">Vietcombank (VCB)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                <span className="text-slate-400">Account Name:</span>
                <span className="font-semibold">VINAWASH CO. LTD</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                <span className="text-slate-400">Account Number:</span>
                <span className="font-mono font-semibold text-brand-orange">1234567890</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 pb-1">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-brand-orange">{totalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 py-0.5 px-2 rounded">{bookingRef}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            * Note: Please write the exact description reference above to ensure automatic mapping. After the transfer is completed, click the button below to submit.
          </p>
        </div>

        {/* Right: Booking Summary sticky card */}
        <div className="w-full md:w-80 shrink-0">
          <div className="glass-card p-6">
            <h3 className="font-bold text-lg border-b border-slate-200/50 dark:border-slate-800/50 pb-3 mb-4">
              Booking Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Branch:</span>
                <span className="font-semibold">{state.branchId === 'b1' ? 'District 1' : 'District 7'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold">{state.selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="font-semibold">{state.selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle:</span>
                <span className="font-semibold">{state.customerInfo.vehicleModel} ({state.vehicleSize})</span>
              </div>
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 flex justify-between items-end">
                <span className="font-bold text-slate-500">Total:</span>
                <span className="font-extrabold text-brand-orange text-lg">{totalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <button 
              onClick={() => setIsConfirmed(true)}
              className="btn-primary w-full mt-6"
            >
              Confirm & Submit Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
