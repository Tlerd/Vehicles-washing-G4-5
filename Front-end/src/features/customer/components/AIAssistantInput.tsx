import React from 'react';
import styles from '../styles/AIAssistantInput.module.css';

export const AIAssistantInput: React.FC = () => (
  <div className={styles.container} title="AI booking API is not available in the backend">
    <div className={styles.icon} aria-hidden="true">✦</div>
    <div className={styles.content}>
      <div className={styles.label}>
        AI Booking Assistant
        <span className={styles.badge}>API REQUIRED</span>
      </div>
      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          placeholder="The backend does not expose an AI booking endpoint yet."
          disabled
          aria-label="AI booking assistant unavailable"
        />
        <button className={styles.sendBtn} type="button" disabled aria-label="AI assistant unavailable">→</button>
      </div>
    </div>
  </div>
);
