import { Calendar, DollarSign, Clock, Award } from 'lucide-react';
import { BENEFITS } from '../data/landingData';

const getIcon = (name: string) => {
  switch (name) {
    case 'calendar': return <Calendar className="w-6 h-6" />;
    case 'dollar': return <DollarSign className="w-6 h-6" />;
    case 'clock': return <Clock className="w-6 h-6" />;
    case 'award': return <Award className="w-6 h-6" />;
    default: return <Calendar className="w-6 h-6" />;
  }
};

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 bg-white relative">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            Everything you need for a better wash
          </h2>
          <p className="text-text-secondary text-lg">
            Designed to make professional car care faster, clearer, and more convenient.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((benefit) => (
            <div 
              key={benefit.id} 
              className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm hover:shadow-md hover:border-primary transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light/50 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                {getIcon(benefit.icon)}
              </div>
              <h3 className="text-xl font-display font-bold text-text-primary mb-3">
                {benefit.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
