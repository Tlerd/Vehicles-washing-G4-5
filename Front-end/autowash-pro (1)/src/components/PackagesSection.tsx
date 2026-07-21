import { Check } from 'lucide-react';
import { PACKAGES } from '../data/landingData';
import { cn } from '../lib/utils';

export function PackagesSection() {
  const handleSelectPackage = (packageId: string) => {
    // We could emit an event or update global state, but for this prototype,
    // we'll scroll back to the booking widget.
    const element = document.querySelector('#hero-booking');
    if (element) {
      // In a real app with global state, we would also set the selected package ID
      const navbarHeight = 80;
      const y = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section id="packages" className="py-24 bg-surface-soft relative">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            Choose the right wash for your car
          </h2>
          <p className="text-text-secondary text-lg">
            Transparent pricing with no hidden fees. Select the package that fits your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id} 
              className={cn(
                "bg-white rounded-3xl p-8 border transition-all relative",
                pkg.popular 
                  ? "border-primary shadow-xl shadow-primary/5 md:scale-105 z-10" 
                  : "border-border shadow-sm hover:border-primary/50"
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 primary-gradient text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md whitespace-nowrap">
                  Most popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-display font-bold text-text-primary mb-2">{pkg.name}</h3>
                <p className="text-text-secondary text-sm font-medium">{pkg.duration}</p>
              </div>
              
              <div className="mb-8">
                <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">VND</span>
                <div className="text-4xl font-display font-extrabold text-text-primary tracking-tight mt-1">
                  {pkg.price.toLocaleString()}
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 min-w-[20px]">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-text-primary">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleSelectPackage(pkg.id)}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2",
                  pkg.popular
                    ? "primary-gradient text-white shadow-primary-btn hover:-translate-y-0.5"
                    : "bg-surface-soft text-text-primary hover:bg-primary hover:text-white"
                )}
              >
                Select package
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
