import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Combo, Service, ServiceCategory } from '@/types';
import { formatVND } from '@/lib/money';
import { cn } from '@/lib/utils';

interface ServicePickerSheetProps {
  category: ServiceCategory | null;
  services: Service[];
  combos: Combo[];
  selectedServiceIds: string[];
  selectedComboIds: string[];
  onToggleService: (id: string) => void;
  onToggleCombo: (id: string) => void;
  onClose: () => void;
}

export function ServicePickerSheet({
  category,
  services,
  combos,
  selectedServiceIds,
  selectedComboIds,
  onToggleService,
  onToggleCombo,
  onClose,
}: ServicePickerSheetProps) {
  const { t } = useTranslation('booking');
  const isCombo = category?.kind === 'COMBO';
  const rows = category
    ? isCombo
      ? combos.filter((c) => c.categoryId === category.id)
      : services.filter((s) => s.categoryId === category.id)
    : [];

  return (
    <AnimatePresence>
      {category && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-text-primary">{category.name}</h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-text-secondary hover:bg-surface-soft"
                aria-label={t('picker.closeAriaLabel')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {rows.map((row) => {
                const selected = isCombo
                  ? selectedComboIds.includes(row.id)
                  : selectedServiceIds.includes(row.id);
                const price = isCombo ? (row as Combo).price : (row as Service).basePrice;
                const sizeDependent = !isCombo && (row as Service).isSizeDependent;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() =>
                      isCombo ? onToggleCombo(row.id) : onToggleService(row.id)
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                      selected ? 'border-primary bg-primary-light/20' : 'border-border hover:border-primary/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        selected ? 'bg-primary text-white' : 'bg-surface-soft text-text-muted',
                      )}
                    >
                      {selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-text-primary">{row.name}</span>
                      {row.description && (
                        <span className="mt-0.5 block text-xs text-text-secondary">{row.description}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-primary-dark">
                      {sizeDependent ? `${t('picker.fromPrefix')} ` : ''}
                      {formatVND(price)}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full primary-gradient rounded-xl py-3 font-semibold text-white shadow-primary-btn"
            >
              {t('picker.doneButton')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
