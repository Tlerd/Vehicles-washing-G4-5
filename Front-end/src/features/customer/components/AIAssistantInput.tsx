import React, { useState } from 'react';
import styles from '../styles/AIAssistantInput.module.css';

export const AIAssistantInput: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className={styles.container}>
      <div className={styles.icon}>🤖</div>
      <div className={styles.content}>
        <div className={styles.label}>
          AI Booking Assistant
          <span className={styles.badge}>BETA</span>
        </div>
        <div className={styles.inputWrapper}>
          <input
            className={styles.input}
            placeholder="Try: 'Book a premium wash for my sedan tomorrow at 10am'"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className={styles.sendBtn}>→</button>
        </div>
      </div>
    </div>
  );
};
