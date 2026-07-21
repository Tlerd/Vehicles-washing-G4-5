import { ArrowRight } from 'lucide-react';

export function FinalCTASection() {
  const handleBookNow = () => {
    const element = document.querySelector('#hero-booking');
    if (element) {
      const navbarHeight = 80;
      const y = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
      // Focus could be done here if we attached a ref to the branch select, 
      // but scrolling is generally sufficient for a prototype
    }
  };

  return (
    <section className="py-24 bg-white relative px-5 md:px-10 lg:px-16">
      <div className="max-w-[1200px] mx-auto primary-gradient rounded-[40px] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-dark/20 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" aria-hidden="true" />
        
        {/* Subtle Water drops decoration */}
        <div className="absolute top-[20%] left-[15%] w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm shadow-sm" aria-hidden="true" />
        <div className="absolute top-[40%] right-[20%] w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm shadow-sm" aria-hidden="true" />
        <div className="absolute bottom-[30%] left-[30%] w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm shadow-sm" aria-hidden="true" />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6 tracking-tight leading-tight">
            Your car deserves a better wash
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-10 leading-relaxed font-medium">
            Reserve your preferred package and time slot in less than two minutes.
          </p>
          
          <button 
            onClick={handleBookNow}
            className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:-translate-y-1 transition-transform shadow-lg shadow-black/5 flex items-center justify-center gap-2 mx-auto"
          >
            Book your wash now <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="mt-8 text-white/80 text-sm font-medium tracking-wide">
            No hidden fees • Real-time availability • Fast confirmation
          </p>
        </div>
      </div>
    </section>
  );
}
