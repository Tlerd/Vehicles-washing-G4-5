import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '@/data/landingData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function FAQSection() {
  const { t } = useTranslation('landing');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-surface-soft relative">
      <div className="max-w-[800px] mx-auto px-5 md:px-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            {t('faq.title')}
          </h2>
          <p className="text-text-secondary text-lg">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className={cn(
                  "bg-surface rounded-2xl border transition-all overflow-hidden",
                  isOpen ? "border-primary shadow-md" : "border-border shadow-sm hover:border-primary/50"
                )}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-semibold text-lg text-text-primary pr-8">{t(`faq.items.${faq.id}.question`)}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-text-secondary transition-transform duration-300 shrink-0",
                      isOpen && "transform rotate-180 text-primary"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 text-text-secondary leading-relaxed border-t border-border/50 mx-6">
                        {t(`faq.items.${faq.id}.answer`)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
