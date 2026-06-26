import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
      <h1 style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}>403 - Unauthorized</h1>
      <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '32px' }}>You do not have permission to access this area.</p>
      <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
        Go to Home
      </Link>
    </div>
  );
};
