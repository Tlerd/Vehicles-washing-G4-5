import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CustomerBookingProvider } from './context/CustomerBookingContext';
import { RootRouter } from './routes/RootRouter';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CustomerBookingProvider>
        <RootRouter />
      </CustomerBookingProvider>
    </AuthProvider>
  </React.StrictMode>,
);
