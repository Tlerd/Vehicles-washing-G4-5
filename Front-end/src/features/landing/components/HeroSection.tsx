import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingWidget } from './BookingWidget';

export function HeroSection() {
  const { t } = useTranslation('landing');
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) return; // Allow CSS animations to handle mobile for simplicity

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      tl.fromTo('.hero-eyebrow', 
        { opacity: 0, y: 18 }, 
        { opacity: 1, y: 0, duration: 0.7 }
      )
      .fromTo('.hero-heading',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 },
        '-=0.5'
      )
      .fromTo('.hero-desc-btn',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
        '-=0.6'
      )
      .fromTo('.hero-widget',
        { opacity: 0, x: 50, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 1 },
        '-=0.8'
      );
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[calc(100vh-80px)] flex items-center pt-10 pb-20 overflow-hidden"
    >
      {/* Background with bubbles */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-light/40 via-background to-primary-light/20" />
      
      {/* Decorative Bubbles */}
      <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-float-bubble" aria-hidden="true" />
      <div className="absolute bottom-[20%] right-[15%] w-48 h-48 bg-primary-dark/5 rounded-full blur-3xl animate-float-bubble" style={{ animationDelay: '1s' }} aria-hidden="true" />
      <div className="absolute top-[40%] right-[40%] w-20 h-20 bg-primary/10 rounded-full blur-xl animate-soft-pulse hidden md:block" aria-hidden="true" />

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start pt-8 lg:pt-0">
            <p className="hero-eyebrow mobile-animate text-sm font-bold text-primary uppercase tracking-[0.1em] mb-4">
              {t('hero.eyebrow')}
            </p>
            <h1 className="hero-heading mobile-animate text-5xl md:text-6xl xl:text-7xl font-display font-extrabold text-text-primary leading-[1.05] tracking-tight mb-6 max-w-[700px]">
              {t('hero.titleLine1')} <br className="hidden md:block" />{t('hero.titleLine2')}
            </h1>
            <p className="hero-desc-btn mobile-animate text-lg md:text-xl text-text-secondary leading-relaxed mb-8 max-w-[650px]">
              {t('hero.description')}
            </p>

            <div className="hero-desc-btn mobile-animate flex flex-wrap items-center gap-4 mb-12">
              <button
                onClick={() => navigate('/guest/booking')}
                className="primary-gradient text-white px-7 py-3.5 rounded-xl font-semibold shadow-primary-btn hover:-translate-y-0.5 transition-transform flex items-center gap-2 text-lg"
              >
                {t('hero.startBooking')} <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#packages')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-7 py-3.5 rounded-xl font-semibold text-text-primary hover:bg-surface-soft border border-transparent hover:border-border transition-all text-lg"
              >
                {t('hero.explorePackages')}
              </button>
            </div>

            {/* Statistics */}
            <div className="hero-desc-btn mobile-animate grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 pt-8 border-t border-border/60 w-full max-w-[650px]">
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-1">{t('hero.stats.washes.value')}</p>
                <p className="text-sm text-text-secondary font-medium">{t('hero.stats.washes.label')}</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-1">{t('hero.stats.turnaround.value')}<span className="text-xl md:text-2xl text-text-secondary font-medium ml-1">{t('hero.stats.turnaround.unit')}</span></p>
                <p className="text-sm text-text-secondary font-medium">{t('hero.stats.turnaround.label')}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-1">{t('hero.stats.branches.value')}</p>
                <p className="text-sm text-text-secondary font-medium">{t('hero.stats.branches.label')}</p>
              </div>
            </div>
          </div>

          {/* Right Content - Booking Widget */}
          <div className="hero-widget mobile-animate lg:ml-auto w-full z-10 flex justify-center lg:justify-end">
            <BookingWidget />
          </div>

        </div>
      </div>
      
      <style>{`
        @media (max-width: 767px) {
          .mobile-animate {
            animation: fade-up 0.7s ease-out forwards;
            opacity: 0;
          }
          .hero-heading { animation-delay: 0.1s; }
          .hero-desc-btn:nth-of-type(1) { animation-delay: 0.2s; }
          .hero-desc-btn:nth-of-type(2) { animation-delay: 0.3s; }
          .hero-desc-btn:nth-of-type(3) { animation-delay: 0.4s; }
          .hero-widget { animation-delay: 0.5s; }
        }
      `}</style>
    </section>
  );
}
