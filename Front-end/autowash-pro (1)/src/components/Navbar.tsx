import { useState, useEffect } from 'react';
import { Menu, X, Droplets } from 'lucide-react';
import { NAV_LINKS } from '../data/landingData';
import { cn } from '../lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const navbarHeight = 80; // approximate height
      const y = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 w-full',
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-border shadow-sm py-3'
          : 'bg-white/50 border-b border-transparent py-5'
      )}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 z-10" onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }}>
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Droplets className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl text-text-primary tracking-tight">AutoWash Pro</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-full border border-border/50">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-primary-light/50 rounded-full transition-all"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center z-10">
          <button 
            onClick={(e) => scrollToSection(e as any, '#hero-booking')}
            className="primary-gradient text-white px-6 py-2.5 rounded-xl font-medium shadow-primary-btn hover:-translate-y-0.5 transition-transform"
          >
            Book now
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-10 p-2 text-text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-border shadow-lg md:hidden animate-fade-up origin-top">
          <nav className="flex flex-col p-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="px-4 py-3 text-base font-medium text-text-primary hover:bg-surface-soft rounded-xl transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
