import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminCustomerRegistryPage } from '../features/admin/pages/AdminCustomerRegistryPage';
import { CampaignBuilderPanel } from '../features/admin/pages/CampaignBuilderPanel';
import { RevenueAuditPanel } from '../features/admin/pages/RevenueAuditPanel';
import { TierManagementPanel } from '../features/admin/pages/TierManagementPanel';
import { VoucherManagementPanel } from '../features/admin/pages/VoucherManagementPanel';
import { LogOut, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockStore } from '../services/mockStore';

type AdminPageId = 'customers' | 'campaigns' | 'revenue' | 'tiers' | 'vouchers';

export const AdminRouter: React.FC = () => {
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState<AdminPageId>('customers');

  const renderPage = () => {
    switch (activePage) {
      case 'customers': return <AdminCustomerRegistryPage onBackToCustomerPortal={logout} />;
      case 'campaigns': return <CampaignBuilderPanel />;
      case 'revenue': return <RevenueAuditPanel bookings={mockStore.getBookings()} transactions={mockStore.getTransactions()} getCustomerName={(id) => mockStore.getCustomerById(id)?.name || 'Unknown'} />;
      case 'tiers': return <TierManagementPanel />;
      case 'vouchers': return <VoucherManagementPanel />;
      default: return <AdminCustomerRegistryPage onBackToCustomerPortal={logout} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Premium Light Sidebar for Admin */}
      <div style={{ width: '250px', backgroundColor: '#ffffff', color: '#0f172a', padding: '24px 20px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 32px 10px', color: '#0ea5e9' }}>
          AutoWash <span style={{ color: '#0f172a' }}>Admin</span>
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
             onClick={() => setActivePage('customers')}
             style={{ padding: '12px 16px', textAlign: 'left', background: activePage === 'customers' ? '#f0f9ff' : 'transparent', color: activePage === 'customers' ? '#0284c7' : '#475569', fontWeight: activePage === 'customers' ? 600 : 500, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Customer Registry
          </button>
          <button 
             onClick={() => setActivePage('campaigns')}
             style={{ padding: '12px 16px', textAlign: 'left', background: activePage === 'campaigns' ? '#f0f9ff' : 'transparent', color: activePage === 'campaigns' ? '#0284c7' : '#475569', fontWeight: activePage === 'campaigns' ? 600 : 500, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Campaign Builder
          </button>
          <button 
             onClick={() => setActivePage('revenue')}
             style={{ padding: '12px 16px', textAlign: 'left', background: activePage === 'revenue' ? '#f0f9ff' : 'transparent', color: activePage === 'revenue' ? '#0284c7' : '#475569', fontWeight: activePage === 'revenue' ? 600 : 500, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Revenue & Audit
          </button>
          <button 
             onClick={() => setActivePage('tiers')}
             style={{ padding: '12px 16px', textAlign: 'left', background: activePage === 'tiers' ? '#f0f9ff' : 'transparent', color: activePage === 'tiers' ? '#0284c7' : '#475569', fontWeight: activePage === 'tiers' ? 600 : 500, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Tier Management
          </button>
          <button 
             onClick={() => setActivePage('vouchers')}
             style={{ padding: '12px 16px', textAlign: 'left', background: activePage === 'vouchers' ? '#f0f9ff' : 'transparent', color: activePage === 'vouchers' ? '#0284c7' : '#475569', fontWeight: activePage === 'vouchers' ? 600 : 500, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Gift size={18} /> Voucher Catalog
          </button>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
             <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 500, width: '100%' }}>
                <LogOut size={18} /> Logout
             </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <Routes>
           <Route path="/*" element={renderPage()} />
        </Routes>
      </div>
    </div>
  );
};
