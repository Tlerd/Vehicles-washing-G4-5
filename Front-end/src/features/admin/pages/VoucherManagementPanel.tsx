import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { mockStore } from '../../../services/mockStore';
import { VoucherCatalogItem } from '../../../types';

export const VoucherManagementPanel: React.FC = () => {
  const [voucherCatalog, setVoucherCatalog] = useState<VoucherCatalogItem[]>([]);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [vcForm, setVcForm] = useState<Partial<VoucherCatalogItem>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setVoucherCatalog(mockStore.getVoucherCatalog());
  }, []);

  const handleSaveVoucher = () => {
    if (!vcForm.type || !vcForm.title || !vcForm.pointsCost || !vcForm.description) return;
    if (editingVoucherId) {
      mockStore.updateVoucherCatalogItem(editingVoucherId, vcForm);
    } else {
      mockStore.addVoucherCatalogItem(vcForm as any);
    }
    setVoucherCatalog(mockStore.getVoucherCatalog());
    setIsModalOpen(false);
    setEditingVoucherId(null);
    setVcForm({});
  };

  const handleDeleteVoucher = (id: string) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      mockStore.deleteVoucherCatalogItem(id);
      setVoucherCatalog(mockStore.getVoucherCatalog());
    }
  };

  const openAddModal = () => {
    setEditingVoucherId(null);
    setVcForm({ type: 'discount_50k' });
    setIsModalOpen(true);
  };

  const openEditModal = (vc: VoucherCatalogItem) => {
    setEditingVoucherId(vc.id);
    setVcForm(vc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVoucherId(null);
    setVcForm({});
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Voucher Management</h1>
          <p style={{ color: '#64748b' }}>Manage the rewards catalog where customers can exchange points for vouchers.</p>
        </div>
        <button 
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)' }}
        >
          <Plus size={18} /> Add Voucher
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {voucherCatalog.map(vc => (
          <div key={vc.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                {vc.type}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEditModal(vc)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteVoucher(vc.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{vc.title}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, flex: 1, marginBottom: '16px' }}>{vc.description}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{vc.pointsCost} <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>pts</span></span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
              {editingVoucherId ? 'Edit Voucher' : 'Add New Voucher'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Type</label>
                <select 
                  value={vcForm.type} 
                  onChange={e => setVcForm({...vcForm, type: e.target.value as any})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                >
                  <option value="discount_50k">50k Discount</option>
                  <option value="free_basic">Free Basic Wash</option>
                  <option value="free_detail">Free Detail Upgrade</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Title</label>
                <input 
                  type="text" 
                  value={vcForm.title || ''} 
                  onChange={e => setVcForm({...vcForm, title: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cost (Points)</label>
                <input 
                  type="number" 
                  value={vcForm.pointsCost || 0} 
                  onChange={e => setVcForm({...vcForm, pointsCost: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Description</label>
                <textarea 
                  rows={3}
                  value={vcForm.description || ''} 
                  onChange={e => setVcForm({...vcForm, description: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={closeModal}
                style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveVoucher}
                style={{ padding: '10px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
