import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { PACKAGES, LOCATIONS } from '../data/landingData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const bookingSchema = z.object({
  branch: z.string().min(1, 'Please select a branch'),
  packageId: z.string().min(1, 'Please select a package'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  vehicleType: z.string().min(1, 'Please select a vehicle type'),
  fullName: z.string().min(2, 'Name is too short'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Invalid phone number'),
});

type BookingData = z.infer<typeof bookingSchema>;

const TIME_SLOTS = [
  { time: '09:30', status: 'Available' },
  { time: '11:00', status: 'Fast lane' },
  { time: '14:30', status: 'Busy' },
];

export function BookingWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      packageId: 'premium',
      branch: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      vehicleType: '',
    },
  });

  const selectedPackageId = watch('packageId');
  const selectedPackage = PACKAGES.find(p => p.id === selectedPackageId) || PACKAGES[1];
  const selectedTime = watch('time');

  const onSubmit = (data: BookingData) => {
    console.log('Booking submitted:', data);
    setIsSuccess(true);
    // Simulating API call delay could be added here, but keep it snappy for prototype
  };

  return (
    <div className="bg-white rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-border p-6 md:p-8 w-full max-w-[560px] mx-auto relative overflow-hidden" id="hero-booking">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-10"
          >
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Booking Confirmed!</h3>
            <p className="text-text-secondary mb-8">Your wash slot has been reserved. We will see you soon.</p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setIsExpanded(false);
              }}
              className="text-primary font-medium hover:underline"
            >
              Book another wash
            </button>
          </motion.div>
        ) : isExpanded ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <h3 className="font-display font-bold text-lg">Complete Reservation</h3>
              <button onClick={() => setIsExpanded(false)} className="text-sm text-text-secondary hover:text-text-primary">
                Back
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Branch</label>
                  <select {...register('branch')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="">Select branch</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  {errors.branch && <span className="text-xs text-red-500">{errors.branch.message}</span>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Vehicle Type</label>
                  <select {...register('vehicleType')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="">Select vehicle</option>
                    <option value="sedan">Sedan / Hatchback</option>
                    <option value="suv">SUV / Crossover</option>
                    <option value="truck">Pickup Truck</option>
                  </select>
                  {errors.vehicleType && <span className="text-xs text-red-500">{errors.vehicleType.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Date</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} {...register('date')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  {errors.date && <span className="text-xs text-red-500">{errors.date.message}</span>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Time</label>
                  <select {...register('time')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="">Select time</option>
                    {TIME_SLOTS.filter(t => t.status !== 'Busy').map(t => (
                      <option key={t.time} value={t.time}>{t.time}</option>
                    ))}
                  </select>
                  {errors.time && <span className="text-xs text-red-500">{errors.time.message}</span>}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-text-primary">Full Name</label>
                <input placeholder="John Doe" {...register('fullName')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
              </div>

              <div className="space-y-1.5 pb-2">
                <label className="text-sm font-medium text-text-primary">Phone Number</label>
                <input placeholder="0912345678" {...register('phone')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
              </div>

              <button type="submit" className="w-full primary-gradient text-white py-3.5 rounded-xl font-medium shadow-primary-btn hover:-translate-y-0.5 transition-transform">
                Confirm Booking
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">BEST SLOT TODAY</p>
                <h3 className="text-xl font-display font-bold text-text-primary">{selectedPackage.name}</h3>
              </div>
              <div className="bg-primary-light/40 text-primary-dark font-semibold px-4 py-1.5 rounded-full text-sm">
                VND {selectedPackage.price.toLocaleString()}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {TIME_SLOTS.map((slot) => {
                const isBusy = slot.status === 'Busy';
                const isSelected = selectedTime === slot.time;
                return (
                  <div
                    key={slot.time}
                    onClick={() => {
                      if (!isBusy) setValue('time', slot.time, { shouldValidate: true });
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      isBusy 
                        ? "bg-surface-soft/50 border-transparent opacity-50 cursor-not-allowed" 
                        : "bg-surface-soft border-transparent cursor-pointer hover:border-border",
                      isSelected && !isBusy && "border-primary bg-primary-light/10 ring-1 ring-primary"
                    )}
                  >
                    <span className="font-medium text-text-primary">{slot.time}</span>
                    <span className={cn(
                      "text-sm font-medium px-2.5 py-0.5 rounded-md",
                      isBusy ? "text-text-secondary bg-border" : "text-primary-dark bg-white shadow-sm"
                    )}>
                      {slot.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-white border border-border rounded-xl shadow-sm">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">Cars only</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-white border border-border rounded-xl shadow-sm">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">Standardized process</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-white border border-border rounded-xl shadow-sm">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">Premium finish</span>
              </div>
            </div>

            <button 
              onClick={() => setIsExpanded(true)}
              className="w-full primary-gradient text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-primary-btn hover:-translate-y-0.5 transition-transform"
            >
              Continue booking <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
