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
}

export const Sidebar: React.FC<SidebarProps> = ({ items, activeId, onSelect, collapsed = false, onToggle }) => {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🚗</span>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>AutoWash</span>
            <span className={styles.logoPro}>PRO</span>
          </div>
        )}
        {onToggle && (
          <button className={styles.toggleBtn} onClick={onToggle}>
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {items.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeId === item.id ? styles.navItemActive : ''}`}
            onClick={() => onSelect(item.id)}
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
  );
};
