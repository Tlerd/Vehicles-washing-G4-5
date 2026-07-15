import { useEffect, useState } from 'react';
import { BrainCircuit, LoaderCircle, Sparkles, TicketPercent } from 'lucide-react';
import { platformService } from '../../../services/platform.service';
import {
  type AdminCampaignRecord,
  getAdminErrorMessage,
  parseAdminCampaigns,
} from '../adminApi';
import styles from './CampaignBuilderPanel.module.css';

type PromotionTargetTier = 'ALL' | 'MEMBER' | 'SILVER' | 'GOLD' | 'PLATINUM';

interface CampaignFormState {
  goal: string;
  targetTier: PromotionTargetTier;
  multiplier: number;
  startDate: string;
  endDate: string;
}

interface CampaignDraft extends CampaignFormState {
  name: string;
  description: string;
}

const campaignTiers: PromotionTargetTier[] = ['ALL', 'MEMBER', 'SILVER', 'GOLD', 'PLATINUM'];
const today = () => new Date().toISOString().slice(0, 10);
const inThirtyDays = () => {
  const value = new Date();
  value.setDate(value.getDate() + 30);
  return value.toISOString().slice(0, 10);
};

const tierLabel = (tier: PromotionTargetTier) => {
  if (tier === 'ALL') return 'All Tiers';
  return tier.charAt(0) + tier.slice(1).toLowerCase();
};

export function CampaignBuilderPanel() {
  const [promotions, setPromotions] = useState<AdminCampaignRecord[]>([]);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>({
    goal: '',
    targetTier: 'ALL',
    multiplier: 1.2,
    startDate: today(),
    endDate: inThirtyDays(),
  });
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft | null>(null);
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignError, setCampaignError] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const loadCampaigns = async () => {
    const payload = await platformService.campaigns();
    setPromotions(parseAdminCampaigns(payload));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCampaignError('');
    platformService.campaigns()
      .then(payload => {
        if (active) setPromotions(parseAdminCampaigns(payload));
      })
      .catch(error => {
        if (active) {
          setCampaignError(getAdminErrorMessage(error, 'Campaigns could not be loaded from the API.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateCampaignField = <Key extends keyof CampaignFormState>(
    field: Key,
    value: CampaignFormState[Key],
  ) => {
    setCampaignForm(current => ({ ...current, [field]: value }));
    setCampaignMessage('');
    setCampaignError('');
  };

  const draftCampaign = () => {
    const goal = campaignForm.goal.trim();
    if (!goal) {
      setCampaignError('Enter a campaign goal before preparing the preview.');
      return;
    }
    if (campaignForm.multiplier < 1 || campaignForm.multiplier > 5) {
      setCampaignError('Reward multiplier must be between 1.0 and 5.0.');
      return;
    }
    if (!campaignForm.startDate || !campaignForm.endDate || campaignForm.endDate < campaignForm.startDate) {
      setCampaignError('End date must be on or after the start date.');
      return;
    }

    const label = tierLabel(campaignForm.targetTier);
    setCampaignDraft({
      ...campaignForm,
      goal,
      name: `${label} Care Sprint`,
      description: `AutoWash campaign focused on ${goal.toLowerCase()}.`,
    });
    setCampaignMessage('Preview prepared locally. Publishing will call the Back-end campaign API.');
  };

  const publishDraftCampaign = async () => {
    if (!campaignDraft) {
      setCampaignError('Prepare a campaign preview before publishing.');
      return;
    }

    setPublishing(true);
    setCampaignError('');
    setCampaignMessage('');
    try {
      await platformService.createCampaign({
        name: campaignDraft.name,
        goal: campaignDraft.goal,
        multiplier: campaignDraft.multiplier,
        targetTier: campaignDraft.targetTier,
        startDate: campaignDraft.startDate,
        endDate: campaignDraft.endDate,
      });
      await loadCampaigns();
      setCampaignDraft(null);
      setCampaignForm(current => ({ ...current, goal: '' }));
      setCampaignMessage('Campaign published successfully and refreshed from the Back-end.');
    } catch (error) {
      setCampaignError(getAdminErrorMessage(error, 'The campaign could not be published.'));
    } finally {
      setPublishing(false);
    }
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
                {campaignTiers.map(option => <option key={option} value={option}>{tierLabel(option)}</option>)}
              </select>
            </label>
            <label>
              Multiplier
              <input
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={campaignForm.multiplier}
                onChange={event => updateCampaignField('multiplier', Number(event.target.value))}
              />
            </label>
            <label>
              Starts
              <input type="date" value={campaignForm.startDate} onChange={event => updateCampaignField('startDate', event.target.value)} />
            </label>
            <label>
              Ends
              <input type="date" value={campaignForm.endDate} onChange={event => updateCampaignField('endDate', event.target.value)} />
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.secondaryButton} type="button" onClick={draftCampaign} disabled={publishing}>
              Prepare preview
            </button>
            <button className={styles.primaryButton} type="button" onClick={publishDraftCampaign} disabled={!campaignDraft || publishing}>
              {publishing ? <LoaderCircle className={styles.spinner} size={16} aria-hidden="true" /> : null}
              {publishing ? 'Publishing…' : 'Publish campaign'}
            </button>
          </div>
          {campaignMessage && <p className={styles.helperMessage}>{campaignMessage}</p>}
          {campaignError && <p className={styles.errorMessage} role="alert">{campaignError}</p>}
        </div>

        <aside className={styles.campaignPreview}>
          <span className={styles.kicker}>Campaign preview</span>
          {campaignDraft ? (
            <article className={styles.promotionCard}>
              <Sparkles size={28} aria-hidden="true" />
              <div>
                <strong>{campaignDraft.name}</strong>
                <span>{campaignDraft.description}</span>
                <small>{campaignDraft.multiplier.toFixed(1)}x / {tierLabel(campaignDraft.targetTier)} / until {campaignDraft.endDate}</small>
              </div>
              <b>{campaignDraft.multiplier.toFixed(1)}x</b>
            </article>
          ) : (
            <div className={styles.emptyState}>
              <BrainCircuit size={28} aria-hidden="true" />
              <strong>No preview yet</strong>
              <span>Enter an objective and prepare the campaign before publishing.</span>
            </div>
          )}
        </aside>
      </div>

      <div className={styles.publishedList}>
        <div className={styles.listHeading}>
          <h2>Published promotions</h2>
          <span>Loaded from `/admin/campaigns`</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}><LoaderCircle className={styles.spinner} size={28} aria-hidden="true" /><strong>Loading campaigns…</strong></div>
        ) : promotions.length > 0 ? (
          <div className={styles.promotionGrid}>
            {promotions.map(promotion => (
              <article key={promotion.id} className={styles.publishedPromotion}>
                <TicketPercent size={18} aria-hidden="true" />
                <div>
                  <strong>{promotion.title}</strong>
                  <span>{promotion.description || 'No campaign description'}</span>
                </div>
                <small>{promotion.targetTier} / {promotion.multiplier.toFixed(1)}x / {promotion.status}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}><TicketPercent size={28} aria-hidden="true" /><strong>No campaigns returned</strong><span>Publish the first campaign when the API is available.</span></div>
        )}
      </div>
    </section>
  );
}
