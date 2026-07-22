import { motion } from 'framer-motion';
import { PROCESS_STEPS } from '../data/landingData';

export function ProcessSection() {
  return (
    <section id="process" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            Book your wash in four simple steps
          </h2>
          <p className="text-text-secondary text-lg">
            Our streamlined process gets your car in and out quickly and efficiently.
          </p>
        </div>

        {/* Desktop Layout (Horizontal) */}
        <div className="hidden md:block relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute top-8 left-[10%] right-[10%] h-[2px] bg-border z-0">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-primary z-0"
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4 relative z-10">
            {PROCESS_STEPS.map((step, index) => (
              <motion.div 
                key={step.step}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="w-16 h-16 rounded-full bg-white border-4 border-primary-light flex items-center justify-center shadow-md mb-6 transition-all duration-300 hover:border-primary">
                  <span className="font-display font-bold text-xl text-primary">{step.step}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-text-primary">{step.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Layout (Vertical) */}
        <div className="md:hidden relative ml-4 border-l-2 border-border pl-8 space-y-12 py-4">
          <motion.div 
            className="absolute top-0 bottom-0 left-[-2px] w-[2px] bg-primary origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {PROCESS_STEPS.map((step, index) => (
            <motion.div 
              key={step.step}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className="absolute top-0 -left-[49px] w-10 h-10 rounded-full bg-white border-4 border-primary-light flex items-center justify-center shadow-sm">
                <span className="font-display font-bold text-sm text-primary">{step.step}</span>
              </div>
              <div className="bg-surface-soft p-5 rounded-2xl border border-border">
                <h3 className="font-display font-bold text-lg text-text-primary">{step.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
