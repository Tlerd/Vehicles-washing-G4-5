import React, { useEffect, useState } from 'react';
import { platformService } from '../../../services/platform.service';

interface VoucherShopProps {
  customerId: string;
  points: number;
  onChanged: () => void;
}

const voucherCatalog: Array<{
  type: 'DISCOUNT_50K'|'FREE_BASIC'|'FREE_DETAIL';
  title: string;
  pointsCost: number;
  description: string;
}> = [
  {
    type: 'DISCOUNT_50K',
    title: '50k Discount Voucher',
    pointsCost: 500,
    description: 'Use on any wash bill from 200k.',
  },
  {
    type: 'FREE_BASIC',
    title: 'Free Basic Wash',
    pointsCost: 1200,
    description: 'Redeem one standard exterior and interior basic wash.',
  },
  {
    type: 'FREE_DETAIL',
    title: 'Free Detail Upgrade',
    pointsCost: 2400,
    description: 'Upgrade a basic wash to detail wash at checkout.',
  },
];

export const VoucherShop: React.FC<VoucherShopProps> = ({ customerId, points, onChanged }) => {
  const [message, setMessage] = useState('');
  const [vouchers,setVouchers]=useState<Array<Record<string,unknown>>>([]);const load=()=>platformService.vouchers(customerId).then(setVouchers);useEffect(()=>{void load()},[customerId]);

  const handleRedeem = async (item: (typeof voucherCatalog)[number]) => {
    try { const voucher=await platformService.redeem(customerId,item.type,item.pointsCost);setMessage(`Redeemed ${item.title}. Code: ${voucher.voucherCode}`);await load();onChanged(); } catch { setMessage('Not enough points or voucher could not be redeemed.'); }
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Voucher Store</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>FR-008: exchange loyalty points for rewards.</p>
        </div>
        <strong style={{ color: '#ea580c', fontSize: 18 }}>{points.toLocaleString('vi-VN')} pts</strong>
      </div>

      {message && (
        <div style={{
          border: '1px solid #bae6fd',
          background: '#f0f9ff',
          color: '#0369a1',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 14,
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {voucherCatalog.map(item => {
          const disabled = points < item.pointsCost;
          return (
            <div key={item.type} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{item.title}</div>
              <p style={{ minHeight: 34, color: '#64748b', fontSize: 12, margin: '6px 0 12px' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <strong style={{ color: '#0f172a', fontSize: 13 }}>{item.pointsCost.toLocaleString('vi-VN')} pts</strong>
                <button
                  type="button"
                  onClick={() => handleRedeem(item)}
                  disabled={disabled}
                  style={{
                    border: 0,
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontWeight: 800,
                    color: disabled ? '#94a3b8' : '#ffffff',
                    background: disabled ? '#e2e8f0' : '#0284c7',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  Redeem
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>My vouchers</h4>
        {vouchers.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>No vouchers redeemed yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {vouchers.map(voucher => (
              <div key={String(voucher.voucherId)} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                border: '1px dashed #cbd5e1',
                borderRadius: 8,
                padding: '9px 10px',
                fontSize: 12,
              }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{String(voucher.voucherType)}</span>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>{String(voucher.voucherCode)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
