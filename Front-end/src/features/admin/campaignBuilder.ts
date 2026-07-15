import type { CustomerTier, Promotion } from '../../types';

export type PromotionTargetTier = CustomerTier | 'ALL';

export interface CampaignDraftInput {
  goal: string;
  targetTier: PromotionTargetTier;
  discountPercent: number;
  validUntil: string;
}

export interface CampaignDraft extends Promotion {
  targetTier: PromotionTargetTier;
  kmMultiplier: number;
  isActive: boolean;
  createdAt: string;
}

const normalizeDiscount = (discountPercent: number) => Math.max(0, Math.min(100, discountPercent));

export function generateCampaignDraft({
  goal,
  targetTier,
  discountPercent,
  validUntil,
}: CampaignDraftInput): CampaignDraft {
  const cleanGoal = goal.trim();
  const discount = normalizeDiscount(discountPercent);
  const tierLabel = targetTier === 'ALL' ? 'All Tiers' : targetTier;
  const kmMultiplier = Number((1 + discount / 100).toFixed(2));

  return {
    id: `draft-${Date.now()}`,
    title: `${tierLabel} Care Sprint`,
    description: `Mock-AI proposal to ${cleanGoal.toLowerCase()} with a ${discount}% wash incentive.`,
    discount: `${discount}% OFF`,
    validUntil,
    bgGradient: 'linear-gradient(135deg, #0b7f86, #18344f)',
    icon: 'Sparkles',
    targetTier,
    kmMultiplier,
    isActive: false,
    createdAt: new Date().toISOString(),
  };
}

export function publishCampaign(campaign: CampaignDraft): CampaignDraft {
  return {
    ...campaign,
    isActive: true,
  };
}

export function getActivePromotionsForTier(
  promotions: Promotion[],
  tier: CustomerTier,
  today: string,
): Promotion[] {
  return promotions
    .filter(promotion => promotion.isActive !== false)
    .filter(promotion => promotion.validUntil >= today)
    .filter(promotion => !promotion.targetTier || promotion.targetTier === 'ALL' || promotion.targetTier === tier)
    .sort((left, right) => new Date(right.createdAt ?? '').getTime() - new Date(left.createdAt ?? '').getTime());
}
