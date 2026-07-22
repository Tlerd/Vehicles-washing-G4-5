import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';
import { REVIEWS } from '@/data/landingData';

export function TestimonialsSection() {
  const { t } = useTranslation('landing');

  return (
    <section id="reviews" className="py-24 bg-surface relative">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            {t('testimonials.title')}
          </h2>
          <p className="text-text-secondary text-lg">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-6 pb-8 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0 hide-scrollbar">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="snap-center min-w-[280px] md:min-w-0 w-[85vw] md:w-auto flex-shrink-0 bg-surface-soft p-8 rounded-3xl border border-border flex flex-col relative"
            >
              <Quote className="absolute top-8 right-8 w-10 h-10 text-primary-light/40" />

              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-text-primary font-medium text-lg leading-relaxed mb-8 flex-grow">
                {t(`testimonials.items.${review.id}.quote`)}
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-light text-primary font-display font-bold flex items-center justify-center shrink-0">
                  {review.initials}
                </div>
                <div>
                  <p className="font-bold text-text-primary">{t(`testimonials.items.${review.id}.name`)}</p>
                  <p className="text-sm text-text-secondary">{t(`testimonials.items.${review.id}.service`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
