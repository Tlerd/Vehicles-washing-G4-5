import { useState } from 'react';
import { BrainCircuit, Sparkles, TicketPercent } from 'lucide-react';
import { mockStore } from '../../../services/mockStore';
import type { Promotion } from '../../../types';
import {
  generateCampaignDraft,
  publishCampaign,
  PromotionTargetTier,
  type CampaignDraft,
} from '../campaignBuilder';
import styles from './CampaignBuilderPanel.module.css';

const campaignTiers: PromotionTargetTier[] = ['ALL', 'Member', 'Silver', 'Gold', 'Platinum'];

interface CampaignFormState {
  goal: string;
  targetTier: PromotionTargetTier;
  discountPercent: number;
  validUntil: string;
}

export function CampaignBuilderPanel() {
  const [promotions, setPromotions] = useState<Promotion[]>(() => mockStore.getPromotions());
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>({
    goal: '',
    targetTier: 'ALL',
    discountPercent: 12,
    validUntil: '2026-07-31',
  });
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft | null>(null);
  const [campaignMessage, setCampaignMessage] = useState('');

  const updateCampaignField = <Key extends keyof CampaignFormState>(
    field: Key,
    value: CampaignFormState[Key],
  ) => {
    setCampaignForm(current => ({ ...current, [field]: value }));
    setCampaignMessage('');
  };

  const draftCampaign = () => {
    if (!campaignForm.goal.trim()) {
      setCampaignMessage('Enter a campaign goal before drafting.');
      return;
    }

    const draft = generateCampaignDraft(campaignForm);
    setCampaignDraft(draft);
    setCampaignMessage('AI draft prepared. Review it before publishing.');
  };

  const publishDraftCampaign = () => {
    if (!campaignDraft) {
      setCampaignMessage('Draft a campaign first.');
      return;
    }

    const published = publishCampaign(campaignDraft);
    mockStore.addPromotion(published);
    setPromotions(mockStore.getPromotions());
    setCampaignDraft(null);
    setCampaignForm(current => ({ ...current, goal: '' }));
    setCampaignMessage('Campaign published to customer promotions.');
  };

  return (
    <section className={styles.panel}>
      <div className={styles.campaignLayout}>
        <div className={styles.campaignForm}>
          <label>
            Campaign goal
            <textarea
              value={campaignForm.goal}
              onChange={event => updateCampaignField('goal', event.target.value)}
              placeholder="Increase weekday repeat visits for premium tiers"
            />
          </label>

          <div className={styles.campaignControls}>
            <label>
              Target tier
              <select
                value={campaignForm.targetTier}
                onChange={event => updateCampaignField('targetTier', event.target.value as PromotionTargetTier)}
              >
                {campaignTiers.map(tierOption => (
                  <option key={tierOption} value={tierOption}>
                    {tierOption === 'ALL' ? 'All tiers' : tierOption}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Discount
              <input
                type="number"
                min={0}
                max={100}
                value={campaignForm.discountPercent}
                onChange={event => updateCampaignField('discountPercent', Number(event.target.value))}
              />
            </label>
            <label>
              Valid until
              <input
                type="date"
                value={campaignForm.validUntil}
                onChange={event => updateCampaignField('validUntil', event.target.value)}
              />
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.secondaryButton} type="button" onClick={draftCampaign}>
              Draft with AI
            </button>
            <button className={styles.primaryButton} type="button" onClick={publishDraftCampaign}>
              Publish campaign
            </button>
          </div>
          {campaignMessage && <p className={styles.helperMessage}>{campaignMessage}</p>}
        </div>

        <aside className={styles.campaignPreview}>
          <span className={styles.kicker}>Generated result</span>
          {campaignDraft ? (
            <article className={styles.promotionCard} style={{ background: campaignDraft.bgGradient }}>
              <Sparkles size={28} aria-hidden="true" />
              <div>
                <strong>{campaignDraft.title}</strong>
                <span>{campaignDraft.description}</span>
                <small>
                  K_km {campaignDraft.kmMultiplier.toFixed(2)} / {campaignDraft.targetTier}
                </small>
              </div>
              <b>{campaignDraft.discount}</b>
            </article>
          ) : (
            <div className={styles.emptyState}>
              <BrainCircuit size={28} aria-hidden="true" />
              <strong>No draft yet</strong>
              <span>Enter a goal and generate a mock-AI campaign.</span>
            </div>
          )}
        </aside>
      </div>

      <div className={styles.publishedList}>
        <h2>Published promotions</h2>
        <div className={styles.promotionGrid}>
          {promotions.map(promotion => (
            <article key={promotion.id} className={styles.publishedPromotion}>
              <TicketPercent size={18} aria-hidden="true" />
              <div>
                <strong>{promotion.title}</strong>
                <span>{promotion.description}</span>
              </div>
              <small>{promotion.targetTier ?? 'ALL'} / {promotion.discount}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
