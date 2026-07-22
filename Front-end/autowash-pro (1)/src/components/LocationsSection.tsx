import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { LOCATIONS } from '../data/landingData';

export function LocationsSection() {
  const handleSelectBranch = (branchId: string) => {
    const element = document.querySelector('#hero-booking');
    if (element) {
      const navbarHeight = 80;
      const y = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section id="locations" className="py-24 bg-surface-soft relative">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            Find an AutoWash Pro near you
          </h2>
          <p className="text-text-secondary text-lg">
            Conveniently located branches across Ho Chi Minh City with standardized quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {LOCATIONS.map((loc) => (
            <div key={loc.id} className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group flex flex-col">
              {/* Abstract Map Placeholder */}
              <div className="h-48 w-full bg-primary-light/30 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwaXRoIGQ9Ik0wIDIwaDQwTTAgMTBoNDBNMCAzMGg0ME0yMCAwdjQwTTEwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSIjMDg4YmQxIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] bg-repeat"></div>
                <div className="absolute w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary z-10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                {/* Decorative map elements */}
                <div className="absolute top-1/2 left-1/4 w-32 h-2 bg-white/60 rounded-full -rotate-45 blur-[1px]"></div>
                <div className="absolute top-1/3 right-1/4 w-40 h-3 bg-white/60 rounded-full rotate-12 blur-[1px]"></div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-display font-bold text-text-primary mb-4">{loc.name}</h3>
                
                <div className="space-y-4 mb-8 flex-grow">
                  <div className="flex items-start gap-3 text-text-secondary">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{loc.address}</span>
                  </div>
                  <div className="flex items-start gap-3 text-text-secondary">
                    <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>Open daily: {loc.hours}</span>
                  </div>
                  <div className="flex items-start gap-3 text-text-secondary">
                    <div className="w-5 h-5 rounded bg-primary-light/50 text-primary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      {loc.services}
                    </div>
                    <span>Available service bays</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleSelectBranch(loc.id)}
                  className="w-full bg-surface-soft text-text-primary hover:bg-primary hover:text-white py-3.5 rounded-xl font-semibold transition-all border border-border group-hover:border-transparent flex items-center justify-center gap-2"
                >
                  Select branch <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
