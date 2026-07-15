import React from 'react';
import {
  ArrowRight,
  Award,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Droplets,
  Gauge,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import styles from '../styles/LandingPage.module.css';

interface LandingPageProps {
  onNavigateToAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const highlights = [
    {
      icon: CalendarClock,
      title: 'Book In Under A Minute',
      description: 'Pick your car, branch, and preferred time slot in a few quick steps with less waiting and better certainty.'
    },
    {
      icon: ShieldCheck,
      title: 'Car-Only Care Standards',
      description: 'Every wash follows a clearly defined process tailored for sedans, SUVs, and premium vehicle finishes.'
    },
    {
      icon: Award,
      title: 'Rewards That Feel Valuable',
      description: 'Customers earn points on every visit, unlock higher tiers, and redeem vouchers directly from their account.'
    }
  ];

  const packages = [
    {
      name: 'Quick Wash',
      price: 'VND 80,000',
      duration: '15 min',
      description: 'Ideal for drivers who need a fast refresh before work, meetings, or a busy city schedule.',
      features: ['High-pressure exterior wash', 'Hand-dried finish', 'Surface condition check'],
      featured: false
    },
    {
      name: 'Premium Wash',
      price: 'VND 280,000',
      duration: '35 min',
      description: 'Our most popular package, balancing a deeper clean, efficient turnaround, and a polished premium experience.',
      features: ['Exterior wash and interior clean-up', 'Tyre dressing and dashboard care', 'Final quality check before handover'],
      featured: true
    },
    {
      name: 'Ultimate Detailing',
      price: 'VND 650,000',
      duration: '90 min',
      description: 'For owners who want a more complete detailing treatment, deeper finish correction, and longer-lasting protection.',
      features: ['Light engine-bay cleaning', 'Surface correction and protection', 'Leather and interior trim care'],
      featured: false
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Pick Your Car And Branch',
      description: 'The journey is optimized for car owners, so sedans, SUVs, and larger vehicles all get the right service fit.'
    },
    {
      number: '02',
      title: 'Choose The Best Time Slot',
      description: 'See real-time availability, lock in a convenient schedule, and reduce uncertainty before you arrive.'
    },
    {
      number: '03',
      title: 'Arrive, Wash, And Drive Away',
      description: 'Customers are checked in quickly, service progress stays clear, and payment is completed with minimal friction.'
    }
  ];

  const testimonials = [
    {
      name: 'Minh Tran',
      role: 'Sedan owner',
      quote: 'Booking takes almost no time now. I can see the package, the slot, and what I am paying for immediately.'
    },
    {
      name: 'Sophia Nguyen',
      role: 'Silver member',
      quote: 'The package layout and loyalty benefits are much clearer. It feels premium, but still easy for everyday use.'
    },
    {
      name: 'Daniel Ho',
      role: 'SUV owner',
      quote: 'The new landing page explains the process and service quality better. It finally feels like a modern car-care brand.'
    }
  ];

  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <div className={styles['header__logo']}>
          <Droplets size={24} />
          AutoWash Pro
        </div>
        <nav className={styles['header__nav']}>
          <a href="#features" className={styles['header__nav-link']}>Benefits</a>
          <a href="#services" className={styles['header__nav-link']}>Packages</a>
          <a href="#process" className={styles['header__nav-link']}>Process</a>
          <a href="#testimonials" className={styles['header__nav-link']}>Reviews</a>
        </nav>
        <div className={styles['header__actions']}>
          <button className={styles.button} onClick={onNavigateToAuth}>
            Book now
          </button>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles['hero__background']} />
          <div className={styles['hero__grid']}>
            <div className={styles['hero__content']}>
              <span className={styles['hero__eyebrow']}>Premium car care, booked in minutes</span>
              <h1 className={styles['hero__title']}>
                The smarter way to book a premium car wash
                {' '}
                <span className={styles['hero__title-highlight']}>with clearer pricing, faster trust, and stronger conversion</span>
              </h1>
              <p className={styles['hero__subtitle']}>
                AutoWash Pro is built for car owners who want instant booking, transparent service packages,
                real-time availability, and a loyalty experience that feels modern from the first click.
              </p>

              <div className={styles['hero__actions']}>
                <button className={styles.button} onClick={onNavigateToAuth}>
                  Start booking
                  <ArrowRight size={18} />
                </button>
                <a href="#services" className={`${styles.button} ${styles['button--outline']}`}>
                  Explore packages
                </a>
              </div>

              <div className={styles['hero__proof']}>
                <div className={styles['hero__proof-item']}>
                  <CheckCircle2 size={18} />
                  <span>Real-time slots that reduce hesitation</span>
                </div>
                <div className={styles['hero__proof-item']}>
                  <CheckCircle2 size={18} />
                  <span>Clear packages and trust signals above the fold</span>
                </div>
                <div className={styles['hero__proof-item']}>
                  <CheckCircle2 size={18} />
                  <span>A brighter premium UI designed to move visitors into booking</span>
                </div>
              </div>

              <div className={styles['hero__stats']}>
                <div className={styles['hero__stat']}>
                  <strong>10.000+</strong>
                  <span>Happy wash sessions</span>
                </div>
                <div className={styles['hero__stat']}>
                  <strong>15-35'</strong>
                  <span>Average turnaround</span>
                </div>
                <div className={styles['hero__stat']}>
                  <strong>2</strong>
                  <span>Branches in Ho Chi Minh City</span>
                </div>
              </div>
            </div>

            <div className={styles['hero__visual']}>
              <div className={styles['hero__glow']} />
              <div className={styles['hero__card']}>
                <div className={styles['hero__card-top']}>
                  <div>
                    <span className={styles['hero__card-label']}>Best slot today</span>
                    <h3>Premium Wash</h3>
                  </div>
                  <span className={styles['hero__card-price']}>VND 280,000</span>
                </div>

                <div className={styles['hero__slot-list']}>
                  <div className={styles['hero__slot-item']}>
                    <span>09:30</span>
                    <span>Available</span>
                  </div>
                  <div className={styles['hero__slot-item']}>
                    <span>11:00</span>
                    <span>Fast lane</span>
                  </div>
                  <div className={styles['hero__slot-item']}>
                    <span>14:30</span>
                    <span>Busy</span>
                  </div>
                </div>

                <div className={styles['hero__mini-grid']}>
                  <div className={styles['hero__mini-card']}>
                    <Car size={20} />
                    <div>
                      <strong>Cars only</strong>
                      <span>Focused on the right customer segment</span>
                    </div>
                  </div>
                  <div className={styles['hero__mini-card']}>
                    <Gauge size={20} />
                    <div>
                      <strong>Standardized process</strong>
                      <span>Lower uncertainty while customers wait</span>
                    </div>
                  </div>
                  <div className={styles['hero__mini-card']}>
                    <Sparkles size={20} />
                    <div>
                      <strong>Premium finish</strong>
                      <span>Cleaner, brighter, more elevated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={styles.features}>
          <div className={styles['section-header']}>
            <span className={styles['section-eyebrow']}>Key benefits</span>
            <h2 className={styles['section-title']}>Designed to explain value quickly and build trust from the very first screen</h2>
          </div>
          <div className={styles['features__grid']}>
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className={styles['feature-card']}>
                  <div className={styles['feature-card__icon']}>
                    <Icon size={22} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="services" className={styles.services}>
          <div className={styles['section-header']}>
            <span className={styles['section-eyebrow']}>Service packages</span>
            <h2 className={styles['section-title']}>A clearer package layout helps customers compare faster and commit with less friction</h2>
          </div>
          <div className={styles['services__grid']}>
            {packages.map((item) => (
              <article
                key={item.name}
                className={`${styles['services__card']} ${item.featured ? styles['services__card--featured'] : ''}`}
              >
                {item.featured && <span className={styles['services__badge']}>Most popular</span>}
                <div className={styles['services__card-meta']}>
                  <span className={styles['services__card-time']}>
                    <Clock size={16} />
                    {item.duration}
                  </span>
                </div>
                <h3 className={styles['services__card-title']}>{item.name}</h3>
                <div className={styles['services__card-price']}>{item.price}</div>
                <p className={styles['services__card-desc']}>{item.description}</p>
                <div className={styles['services__card-list']}>
                  {item.features.map((feature) => (
                    <div key={feature} className={styles['services__card-item']}>
                      <CheckCircle2 size={18} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className={styles.process}>
          <div className={styles['section-header']}>
            <span className={styles['section-eyebrow']}>Booking flow</span>
            <h2 className={styles['section-title']}>A short, confident journey that mirrors the actual product flow and removes booking anxiety</h2>
          </div>
          <div className={styles['process__grid']}>
            {steps.map((step) => (
              <article key={step.number} className={styles['process__card']}>
                <span className={styles['process__number']}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.experience}>
          <div className={styles['experience__content']}>
            <span className={styles['section-eyebrow']}>Branch experience</span>
            <h2 className={styles['section-title']}>More than a clean car, it feels like a service experience worth coming back for</h2>
            <p className={styles['experience__description']}>
              The messaging now reinforces the brand promise more clearly: comfortable waiting zones,
              car-safe procedures, faster confirmation, and a more consistent premium service standard.
            </p>
            <div className={styles['experience__list']}>
              <div className={styles['experience__item']}>
                <MapPin size={18} />
                <span>District 1 and District 7 branches, convenient for urban drivers</span>
              </div>
              <div className={styles['experience__item']}>
                <Phone size={18} />
                <span>A responsive hotline for urgent slots and special requests</span>
              </div>
              <div className={styles['experience__item']}>
                <Droplets size={18} />
                <span>Visual language and copy focused on premium car care</span>
              </div>
            </div>
          </div>

          <div className={styles['experience__panel']}>
            <div className={styles['experience__panel-card']}>
              <h3>Why it converts</h3>
              <div className={styles['experience__panel-list']}>
                <div>
                  <strong>Hero section</strong>
                  <span>Sharper value proposition, stronger CTA, more premium feel</span>
                </div>
                <div>
                  <strong>Service comparison</strong>
                  <span>Quicker package comparison by price, time, and included value</span>
                </div>
                <div>
                  <strong>Social proof</strong>
                  <span>Reviews and performance signals placed where trust matters most</span>
                </div>
              </div>
            </div>
            <div className={styles['experience__panel-card']}>
              <h3>Opening hours</h3>
              <div className={styles['experience__hours']}>
                <span>Monday - Sunday</span>
                <strong>07:00 - 20:00</strong>
              </div>
              <div className={styles['experience__hours']}>
                <span>Recommended slot</span>
                <strong>09:30 - 11:00</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className={styles.testimonials}>
          <div className={styles['section-header']}>
            <span className={styles['section-eyebrow']}>Customer reviews</span>
            <h2 className={styles['section-title']}>Short, warm proof that supports conversion without making the page feel crowded</h2>
          </div>
          <div className={styles['testimonials__grid']}>
            {testimonials.map((item) => (
              <article key={item.name} className={styles['testimonials__card']}>
                <p className={styles['testimonials__quote']}>"{item.quote}"</p>
                <div className={styles['testimonials__author']}>
                  <div className={styles['testimonials__avatar']}>{item.name.charAt(0)}</div>
                  <div>
                    <div className={styles['testimonials__name']}>{item.name}</div>
                    <div className={styles['testimonials__role']}>{item.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles['cta-banner']}>
          <div>
            <span className={styles['cta-banner__eyebrow']}>Ready to upgrade the booking journey?</span>
            <h2>Turn interested visitors into confirmed bookings.</h2>
          </div>
          <button className={styles.button} onClick={onNavigateToAuth}>
            Go to sign in
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles['footer__grid']}>
          <div className={styles['footer__brand']}>
            <h3>
              <Droplets size={24} />
              AutoWash Pro
            </h3>
            <p>A smarter car wash booking platform with a cleaner, brighter, and more premium experience for modern drivers.</p>
          </div>
          <div>
            <h4 className={styles['footer__title']}>Explore</h4>
            <ul className={styles['footer__links']}>
              <li><a href="#features">Benefits</a></li>
              <li><a href="#services">Packages</a></li>
              <li><a href="#process">Process</a></li>
            </ul>
          </div>
          <div>
            <h4 className={styles['footer__title']}>Contact</h4>
            <ul className={styles['footer__links']}>
              <li><MapPin size={18} /> 123 Nguyen Van Linh, District 7, Ho Chi Minh City</li>
              <li><Phone size={18} /> 0901 234 567</li>
              <li><CalendarClock size={18} /> Open daily from 07:00 - 20:00</li>
            </ul>
          </div>
        </div>
        <div className={styles['footer__bottom']}>
          <p>© {new Date().getFullYear()} AutoWash Pro. Premium car wash booking experience.</p>
        </div>
      </footer>
    </div>
  );
};
