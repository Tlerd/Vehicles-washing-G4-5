import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  MapPin, 
  Phone,
  Shield, 
  Sparkles 
} from 'lucide-react';
import styles from '../styles/LandingPage.module.css';

interface LandingPageProps {
  onNavigateToAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className={styles.landing}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles['header__logo']}>
          <Droplets size={24} />
          AutoWash Pro
        </div>
        <nav className={styles['header__nav']}>
          <a href="#services" className={styles['header__nav-link']}>Services</a>
          <a href="#features" className={styles['header__nav-link']}>Features</a>
          <a href="#testimonials" className={styles['header__nav-link']}>Testimonials</a>
        </nav>
        <div className={styles['header__actions']}>
          <button className={styles.button} onClick={onNavigateToAuth}>
            Book Now
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles['hero__title']}>
          Professional car wash with <span className={styles['hero__title-highlight']}>modern technology</span> in HCMC.
        </h1>
        <p className={styles['hero__subtitle']}>
          Book in 30 seconds. Skip the line. Premium finish, fully transparent.
        </p>
        <div className={styles['hero__actions']}>
          <button className={styles.button} onClick={onNavigateToAuth}>
            Get Started
            <ArrowRight size={18} />
          </button>
          <a href="#services" className={`${styles.button} ${styles['button--outline']}`}>
            View Services
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className={styles.services}>
        <div className={styles['section-header']}>
          <span className={styles['section-eyebrow']}>Our Services</span>
          <h2 className={styles['section-title']}>Clear pricing. Premium results.</h2>
        </div>
        <div className={styles['services__grid']}>
          <div className={styles['services__card']}>
            <div className={styles['services__card-icon']}>
              <Clock size={28} />
            </div>
            <h3 className={styles['services__card-title']}>Quick Wash</h3>
            <p className={styles['services__card-desc']}>
              Quick exterior wash in 15 mins. High-pressure rinse, foam bath, and hand dry.
            </p>
            <div className={styles['services__card-price']}>80,000 VND</div>
          </div>
          <div className={styles['services__card']}>
            <div className={styles['services__card-icon']}>
              <Sparkles size={28} />
            </div>
            <h3 className={styles['services__card-title']}>Premium Wash</h3>
            <p className={styles['services__card-desc']}>
              Full exterior hand wash, interior deep clean, tire shine, and wax coating.
            </p>
            <div className={styles['services__card-price']}>280,000 VND</div>
          </div>
          <div className={styles['services__card']}>
            <div className={styles['services__card-icon']}>
              <Shield size={28} />
            </div>
            <h3 className={styles['services__card-title']}>Ultimate Detailing</h3>
            <p className={styles['services__card-desc']}>
              Paint correction, ceramic coating, leather conditioning, and engine bay clean.
            </p>
            <div className={styles['services__card-price']}>650,000 VND</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles['section-header']}>
          <span className={styles['section-eyebrow']}>Why Choose Us</span>
          <h2 className={styles['section-title']}>German standard diagnostics & safety.</h2>
        </div>
        <div className={styles['features__grid']}>
          <div className={styles['features__item']}>
            <CheckCircle2 size={32} className={styles['features__icon']} />
            <div className={styles['features__content']}>
              <h3>Book in 30s</h3>
              <p>Select your time slot and get instant confirmation. No more waiting in line.</p>
            </div>
          </div>
          <div className={styles['features__item']}>
            <CheckCircle2 size={32} className={styles['features__icon']} />
            <div className={styles['features__content']}>
              <h3>Touchless Wash</h3>
              <p>Each vehicle is scanned automatically before washing to ensure safety.</p>
            </div>
          </div>
          <div className={styles['features__item']}>
            <CheckCircle2 size={32} className={styles['features__icon']} />
            <div className={styles['features__content']}>
              <h3>5-Star Lounge</h3>
              <p>Enjoy specialty coffee, free high-speed Wi-Fi, and air conditioning inside.</p>
            </div>
          </div>
          <div className={styles['features__item']}>
            <CheckCircle2 size={32} className={styles['features__icon']} />
            <div className={styles['features__content']}>
              <h3>100% Satisfaction</h3>
              <p>Satisfaction-first premium service promise. We guarantee top quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles['section-header']}>
          <span className={styles['section-eyebrow']}>Reviews</span>
          <h2 className={styles['section-title']}>Over 10,000 satisfied reviews.</h2>
        </div>
        <div className={styles['testimonials__grid']}>
          <div className={styles['testimonials__card']}>
            <p className={styles['testimonials__quote']}>
              "Very thorough washing, comfortable lounge, I will return. The best car wash experience in HCMC."
            </p>
            <div className={styles['testimonials__author']}>
              <div className={styles['testimonials__avatar']}>H</div>
              <div>
                <div className={styles['testimonials__name']}>Mr. Hung</div>
                <div className={styles['testimonials__role']}>Sedan Owner</div>
              </div>
            </div>
          </div>
          <div className={styles['testimonials__card']}>
            <p className={styles['testimonials__quote']}>
              "Booked in 30 seconds, no more waiting in line. They were ready as soon as I arrived."
            </p>
            <div className={styles['testimonials__author']}>
              <div className={styles['testimonials__avatar']}>L</div>
              <div>
                <div className={styles['testimonials__name']}>Mrs. Lan</div>
                <div className={styles['testimonials__role']}>SUV Owner</div>
              </div>
            </div>
          </div>
          <div className={styles['testimonials__card']}>
            <p className={styles['testimonials__quote']}>
              "Modern car wash technology, paint layer protected visibly. Great service!"
            </p>
            <div className={styles['testimonials__author']}>
              <div className={styles['testimonials__avatar']}>T</div>
              <div>
                <div className={styles['testimonials__name']}>Mr. Tuan</div>
                <div className={styles['testimonials__role']}>Hatchback Owner</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles['footer__grid']}>
          <div className={styles['footer__brand']}>
            <h3>
              <Droplets size={24} />
              AutoWash Pro
            </h3>
            <p>Automated touchless car wash system adhering to modern quality standards.</p>
          </div>
          <div>
            <h4 className={styles['footer__title']}>Quick Links</h4>
            <ul className={styles['footer__links']}>
              <li><a href="#services">Services</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#testimonials">Reviews</a></li>
            </ul>
          </div>
          <div>
            <h4 className={styles['footer__title']}>Contact</h4>
            <ul className={styles['footer__links']}>
              <li><MapPin size={18} /> 123 Nguyen Van Linh, D7, HCMC</li>
              <li><Phone size={18} /> 0901 234 567</li>
              <li><Droplets size={18} /> Mon - Sun: 7:00 AM - 8:00 PM</li>
            </ul>
          </div>
        </div>
        <div className={styles['footer__bottom']}>
          <p>© {new Date().getFullYear()} AutoWash Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
