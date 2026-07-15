import React from 'react';
import styles from './Sidebar.module.css';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeId,
  onSelect,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const handleSelect = (id: string) => {
    onSelect(id);
    onCloseMobile?.();
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.overlayVisible : ''}`}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`.trim()}
      >
        <div className={styles.logo}>
          <div className={styles.brand}>
            <span className={styles.logoIcon}>AW</span>
            {!collapsed && (
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>AutoWash</span>
                <span className={styles.logoPro}>PRO</span>
              </div>
            )}
          </div>

          <div className={styles.logoActions}>
            {onToggle && (
              <button type="button" className={styles.toggleBtn} onClick={onToggle} aria-label="Collapse menu">
                {collapsed ? '>' : '<'}
              </button>
            )}
            {onCloseMobile && (
              <button type="button" className={styles.mobileCloseBtn} onClick={onCloseMobile} aria-label="Close menu">
                X
              </button>
            )}
          </div>
        </div>

        <div className={styles.sidebarIntro}>
          {!collapsed ? (
            <>
              <strong>Premium care, clear journey</strong>
              <span>Quick access to bookings, saved vehicles, and member benefits.</span>
            </>
          ) : (
            <span className={styles.sidebarIntroMini}>PRO</span>
          )}
        </div>

        <nav className={styles.nav}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${activeId === item.id ? styles.navItemActive : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
