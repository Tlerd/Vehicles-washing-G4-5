import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { PACKAGES, LOCATIONS } from '@/data/landingData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { todayStart, formatDayKey } from '@/lib/datetime';
import { useNavigate } from 'react-router-dom';

interface BookingData {
  branch: string;
  packageId: string;
  date: string;
  time: string;
  vehicleType: string;
  fullName: string;
  phone: string;
}

const TIME_SLOTS = [
  { time: '09:30', status: 'available' },
  { time: '11:00', status: 'fast-lane' },
  { time: '14:30', status: 'busy' },
];

export function BookingWidget() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const bookingSchema = useMemo(
    () =>
      z.object({
        branch: z.string().min(1, t('widget.form.errors.branch')),
        packageId: z.string().min(1, t('widget.form.errors.package')),
        date: z.string().min(1, t('widget.form.errors.date')),
        time: z.string().min(1, t('widget.form.errors.time')),
        vehicleType: z.string().min(1, t('widget.form.errors.vehicleType')),
        fullName: z.string().min(2, t('widget.form.errors.fullNameTooShort')),
        phone: z
          .string()
          .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, t('widget.form.errors.phoneInvalid')),
      }),
    [t]
  );

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

  const onSubmit = () => {
    setIsSuccess(true);
    // Simulating API call delay could be added here, but keep it snappy for prototype
  };

  return (
    <div className="bg-surface rounded-[28px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-border p-6 md:p-8 w-full max-w-[560px] mx-auto relative overflow-hidden" id="hero-booking">
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
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">{t('widget.success.title')}</h3>
            <p className="text-text-secondary mb-8">{t('widget.success.description')}</p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setIsExpanded(false);
              }}
              className="text-primary font-medium hover:underline"
            >
              {t('widget.success.again')}
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
              <h3 className="font-display font-bold text-lg">{t('widget.form.title')}</h3>
              <button onClick={() => setIsExpanded(false)} className="text-sm text-text-secondary hover:text-text-primary">
                {t('widget.form.back')}
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('widget.form.branchLabel')}</label>
                  <select {...register('branch')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="">{t('widget.form.branchPlaceholder')}</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{t(`locations.items.${loc.id}.name`)}</option>
                    ))}
                  </select>
                  {errors.branch && <span className="text-xs text-danger">{errors.branch.message}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('widget.form.vehicleTypeLabel')}</label>
                  <select {...register('vehicleType')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="">{t('widget.form.vehicleTypePlaceholder')}</option>
                    <option value="sedan">{t('widget.form.vehicleTypes.sedan')}</option>
                    <option value="suv">{t('widget.form.vehicleTypes.suv')}</option>
                    <option value="truck">{t('widget.form.vehicleTypes.truck')}</option>
                  </select>
                  {errors.vehicleType && <span className="text-xs text-danger">{errors.vehicleType.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('widget.form.dateLabel')}</label>
                  <input type="date" min={formatDayKey(todayStart())} {...register('date')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  {errors.date && <span className="text-xs text-danger">{errors.date.message}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('widget.form.timeLabel')}</label>
                  <select {...register('time')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                    <option value="">{t('widget.form.timePlaceholder')}</option>
                    {TIME_SLOTS.filter(slot => slot.status !== 'busy').map(slot => (
                      <option key={slot.time} value={slot.time}>{slot.time}</option>
                    ))}
                  </select>
                  {errors.time && <span className="text-xs text-danger">{errors.time.message}</span>}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-text-primary">{t('widget.form.fullNameLabel')}</label>
                <input placeholder={t('widget.form.fullNamePlaceholder')} {...register('fullName')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                {errors.fullName && <span className="text-xs text-danger">{errors.fullName.message}</span>}
              </div>

              <div className="space-y-1.5 pb-2">
                <label className="text-sm font-medium text-text-primary">{t('widget.form.phoneLabel')}</label>
                <input placeholder={t('widget.form.phonePlaceholder')} {...register('phone')} className="w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                {errors.phone && <span className="text-xs text-danger">{errors.phone.message}</span>}
              </div>

              <button type="submit" className="w-full primary-gradient text-white py-3.5 rounded-xl font-medium shadow-primary-btn hover:-translate-y-0.5 transition-transform">
                {t('widget.form.submit')}
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
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('widget.preview.bestSlotToday')}</p>
                <h3 className="text-xl font-display font-bold text-text-primary">{t(`packages.items.${selectedPackage.id}.name`)}</h3>
              </div>
              <div className="bg-primary-light/40 text-primary-dark font-semibold px-4 py-1.5 rounded-full text-sm">
                {t('widget.preview.currencyLabel')} {selectedPackage.price.toLocaleString()}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {TIME_SLOTS.map((slot) => {
                const isBusy = slot.status === 'busy';
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
                      isBusy ? "text-text-secondary bg-border" : "text-primary-dark bg-surface shadow-sm"
                    )}>
                      {t(`widget.preview.slotStatus.${slot.status}`)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-surface border border-border rounded-xl shadow-sm">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">{t('widget.preview.features.carsOnly')}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-surface border border-border rounded-xl shadow-sm">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">{t('widget.preview.features.standardizedProcess')}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 bg-surface border border-border rounded-xl shadow-sm">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">{t('widget.preview.features.premiumFinish')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/guest/booking')}
              className="w-full primary-gradient text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-primary-btn hover:-translate-y-0.5 transition-transform"
            >
              {t('widget.preview.cta')} <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
