import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';
import styles from './CustomerLayout.module.css';

interface CustomerLayoutProps {
  children: React.ReactNode;
  activeNav: string;
  onNavChange: (id: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: '📊', description: 'Track upcoming visits, rewards, and recent activity.' },
  { id: 'booking', label: 'New Booking', icon: '📅', description: 'Create a new appointment in a few guided steps.' },
  { id: 'vehicles', label: 'My Vehicles', icon: '🚗', description: 'Manage saved vehicles for faster future bookings.' },
  { id: 'history', label: 'History', icon: '📋', description: 'Review completed, pending, and cancelled bookings.' },
  { id: 'promotions', label: 'Promotions', icon: '🎉', description: 'See active offers and seasonal car-care campaigns.' },
  { id: 'points', label: 'Rewards', icon: '⭐', description: 'Check points, vouchers, and your loyalty tier progress.' },
];

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, activeNav, onNavChange }) => {
  const { currentUser, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeItem = NAV_ITEMS.find((i) => i.id === activeNav) || NAV_ITEMS[0];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeNav]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar
        items={NAV_ITEMS}
        activeId={activeNav}
        onSelect={onNavChange}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              ☰
            </button>

            <div className={styles.headingBlock}>
              <span className={styles.eyebrow}>Customer portal</span>
              <h2 className={styles.pageTitle}>{activeItem.label}</h2>
              <p className={styles.pageSubtitle}>{activeItem.description}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {currentUser?.name?.charAt(0) || 'G'}
              </div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{currentUser?.name || 'Guest'}</span>
                <span className={styles.userTier}>{currentUser?.tier || 'Member'} member</span>
              </div>
            </div>
            <span className={styles.tierPill}>{currentUser?.tier || 'Member'}</span>
            <button className={styles.logoutBtn} onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};
