import { Droplets } from 'lucide-react';
import { NAV_LINKS, PACKAGES } from '../data/landingData';

export function Footer() {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const navbarHeight = 80;
      const y = element.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-border pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4" onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Droplets className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-xl text-text-primary tracking-tight">AutoWash Pro</span>
            </a>
            <p className="text-text-secondary leading-relaxed mb-6">
              Professional car care with simple online booking. Quality guaranteed.
            </p>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-text-primary mb-4 uppercase tracking-wider text-sm">Services</h4>
            <ul className="space-y-3">
              {PACKAGES.map(pkg => (
                <li key={pkg.id}>
                  <a href="#packages" onClick={(e) => handleScrollTo(e, '#packages')} className="text-text-secondary hover:text-primary transition-colors">
                    {pkg.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-display font-bold text-text-primary mb-4 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-3">
              {NAV_LINKS.filter(l => l.name !== 'Packages').map(link => (
                <li key={link.name}>
                  <a href={link.href} onClick={(e) => handleScrollTo(e, link.href)} className="text-text-secondary hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-text-primary mb-4 uppercase tracking-wider text-sm">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hello@autowashpro.vn" className="text-text-secondary hover:text-primary transition-colors">
                  hello@autowashpro.vn
                </a>
              </li>
              <li>
                <a href="tel:+842800000000" className="text-text-secondary hover:text-primary transition-colors">
                  +84 28 0000 0000
                </a>
              </li>
              <li className="text-text-secondary">
                Ho Chi Minh City, Vietnam
              </li>
            </ul>
          </div>
          
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} AutoWash Pro. All rights reserved.
          </p>
          <p className="text-sm font-medium text-text-secondary bg-surface-soft px-4 py-2 rounded-full">
            Open daily from 07:00 to 21:00
          </p>
        </div>
      </div>
    </footer>
  );
}
