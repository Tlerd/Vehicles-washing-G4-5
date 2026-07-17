import React, { useState, useEffect } from 'react';
import { Coins, Edit, Gift, Plus, Sparkles, TicketPercent, Trash2, X } from 'lucide-react';
import { mockStore } from '../../../services/mockStore';
import { VoucherCatalogItem } from '../../../types';
import styles from './VoucherManagementPanel.module.css';

type VoucherType = VoucherCatalogItem['type'];

const voucherTypeLabel: Record<VoucherType, string> = {
  discount_50k: '50k Discount',
  free_basic: 'Free Basic Wash',
  free_detail: 'Detail Upgrade',
};

const voucherTypeDetail: Record<VoucherType, string> = {
  discount_50k: 'Direct bill discount for high-conversion redemptions.',
  free_basic: 'Entry reward to keep basic wash visits repeating.',
  free_detail: 'Premium upsell reward for higher-tier customers.',
};

const voucherTypeClassName: Record<VoucherType, string> = {
  discount_50k: styles.typeDiscount,
  free_basic: styles.typeBasic,
  free_detail: styles.typeDetail,
};

export const VoucherManagementPanel: React.FC = () => {
  const [voucherCatalog, setVoucherCatalog] = useState<VoucherCatalogItem[]>([]);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [vcForm, setVcForm] = useState<Partial<VoucherCatalogItem>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setVoucherCatalog(mockStore.getVoucherCatalog());
  }, []);

  const handleSaveVoucher = () => {
    const type = vcForm.type;
    const title = vcForm.title?.trim() ?? '';
    const pointsCost = typeof vcForm.pointsCost === 'number' ? vcForm.pointsCost : Number(vcForm.pointsCost ?? 0);
    const description = vcForm.description?.trim() ?? '';

    if (!type || !title || !pointsCost || !description) return;

    const voucherPayload: Omit<VoucherCatalogItem, 'id'> = {
      type,
      title,
      pointsCost,
      description,
    };

    if (editingVoucherId) {
      mockStore.updateVoucherCatalogItem(editingVoucherId, voucherPayload);
    } else {
      mockStore.addVoucherCatalogItem(voucherPayload);
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

  const modalTitle = editingVoucherId ? 'Edit voucher' : 'Add new voucher';
  const selectedType = (vcForm.type ?? 'discount_50k') as VoucherType;

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.headerBlock}>
          <span className={styles.kicker}>Rewards catalog</span>
          <div className={styles.titleRow}>
            <h1>Voucher Management</h1>
            <p>Manage the points redemption catalog with the same polished card system, toolbar rhythm, and modal language used in the rest of Admin.</p>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaPill}>
              <Gift size={14} aria-hidden="true" />
              {voucherCatalog.length} reward items
            </span>
            <span className={styles.metaPill}>
              <Sparkles size={14} aria-hidden="true" />
              Premium bright surface
            </span>
          </div>
        </div>

        <button className={styles.primaryButton} type="button" onClick={openAddModal}>
          <Plus size={18} aria-hidden="true" />
          Add voucher
        </button>
      </div>

      <div className={styles.content}>
        {voucherCatalog.length > 0 ? (
          <div className={styles.cardGrid}>
            {voucherCatalog.map(vc => (
              <article key={vc.id} className={styles.voucherCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderMain}>
                    <span className={`${styles.typeBadge} ${voucherTypeClassName[vc.type]}`}>
                      {voucherTypeLabel[vc.type]}
                    </span>
                    <div className={styles.cardMeta}>{voucherTypeDetail[vc.type]}</div>
                  </div>

                  <div className={styles.actionRow}>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => openEditModal(vc)}
                      aria-label={`Edit ${vc.title}`}
                    >
                      <Edit size={16} aria-hidden="true" />
                    </button>
                    <button
                      className={`${styles.iconButton} ${styles.dangerButton}`}
                      type="button"
                      onClick={() => handleDeleteVoucher(vc.id)}
                      aria-label={`Delete ${vc.title}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className={styles.cardTitle}>{vc.title}</h3>
                  <p className={styles.cardDescription}>{vc.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.pointsValue}>
                    <strong>{vc.pointsCost}</strong>
                    <span>points required</span>
                  </span>
                  <span className={styles.cardHint}>Visible in customer rewards exchange.</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <TicketPercent size={28} aria-hidden="true" />
            <strong>No vouchers yet</strong>
            <span>Add the first catalog item to start point redemptions.</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeModal}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-management-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={`${styles.typeBadge} ${voucherTypeClassName[selectedType]}`}>
                  {voucherTypeLabel[selectedType]}
                </span>
                <h2 id="voucher-management-title">{modalTitle}</h2>
                <p>Use the standard Admin form styling so voucher rules remain easy to scan and quick to maintain.</p>
              </div>

              <button className={styles.closeButton} type="button" onClick={closeModal} aria-label="Close voucher modal">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                Type
                <select
                  value={selectedType}
                  onChange={event => setVcForm({ ...vcForm, type: event.target.value as VoucherType })}
                >
                  <option value="discount_50k">50k Discount</option>
                  <option value="free_basic">Free Basic Wash</option>
                  <option value="free_detail">Free Detail Upgrade</option>
                </select>
              </label>

              <label className={styles.field}>
                Title
                <input
                  type="text"
                  value={vcForm.title || ''}
                  onChange={event => setVcForm({ ...vcForm, title: event.target.value })}
                />
              </label>

              <label className={styles.field}>
                Cost (Points)
                <input
                  type="number"
                  min={0}
                  value={vcForm.pointsCost || 0}
                  onChange={event => setVcForm({ ...vcForm, pointsCost: parseInt(event.target.value, 10) || 0 })}
                />
              </label>

              <label className={styles.field}>
                Description
                <textarea
                  rows={3}
                  value={vcForm.description || ''}
                  onChange={event => setVcForm({ ...vcForm, description: event.target.value })}
                />
              </label>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} type="button" onClick={closeModal}>
                Cancel
              </button>
              <button className={styles.primaryButton} type="button" onClick={handleSaveVoucher}>
                <Coins size={16} aria-hidden="true" />
                Save voucher
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};
