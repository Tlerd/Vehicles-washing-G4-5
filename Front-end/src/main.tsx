import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { CustomerBookingProvider } from './context/CustomerBookingContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CustomerBookingProvider>
        <App />
      </CustomerBookingProvider>
    </AuthProvider>
  </React.StrictMode>,
);
