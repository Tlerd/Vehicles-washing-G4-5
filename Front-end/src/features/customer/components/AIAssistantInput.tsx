import React, { useState } from 'react';
import styles from '../styles/AIAssistantInput.module.css';

export const AIAssistantInput: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className={styles.container}>
      <div className={styles.icon}>🤖</div>
      <div className={styles.content}>
        <div className={styles.label}>
          Trợ lý Đặt lịch AI
          <span className={styles.badge}>BETA</span>
        </div>
        <div className={styles.inputWrapper}>
          <input
            className={styles.input}
            placeholder="Thử: 'Đặt rửa xe cao cấp cho xe sedan của tôi vào 10h sáng mai'"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className={styles.sendBtn}>→</button>
        </div>
      </div>
    </div>
  );
};
