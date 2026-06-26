import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';
import styles from './CustomerLayout.module.css';

interface CustomerLayoutProps {
  children: React.ReactNode;
  activeNav: string;
  onNavChange: (id: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
  { id: 'booking', label: 'Đặt lịch mới', icon: '📅' },
  { id: 'vehicles', label: 'Xe của tôi', icon: '🚗' },
  { id: 'history', label: 'Lịch sử', icon: '📋' },
  { id: 'promotions', label: 'Khuyến mãi', icon: '🎉' },
  { id: 'points', label: 'Điểm thưởng', icon: '⭐' },
];

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, activeNav, onNavChange }) => {
  const { currentUser, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        items={NAV_ITEMS}
        activeId={activeNav}
        onSelect={onNavChange}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.pageTitle}>
              {NAV_ITEMS.find(i => i.id === activeNav)?.label || 'Tổng quan'}
            </h2>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {currentUser?.name?.charAt(0) || 'G'}
              </div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{currentUser?.name || 'Khách vãng lai'}</span>
                <span className={styles.userTier}>{currentUser?.tier || 'Thành viên'}</span>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={logout}>
              ↪ Đăng xuất
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
