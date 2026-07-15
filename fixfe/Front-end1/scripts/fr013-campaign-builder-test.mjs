import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function importTypeScriptModule(path) {
  const source = await readFile(path, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`;
  return import(moduleUrl);
}

const campaignBuilder = await importTypeScriptModule(new URL('../src/features/admin/campaignBuilder.ts', import.meta.url));

const draft = campaignBuilder.generateCampaignDraft({
  goal: 'Increase weekday repeat visits',
  targetTier: 'Gold',
  discountPercent: 18,
  validUntil: '2026-07-31',
});

assert.equal(draft.title.includes('Gold'), true, 'draft title should include selected target tier');
assert.equal(draft.kmMultiplier, 1.18, 'draft should convert discount percent into K_km multiplier');
assert.equal(draft.description.includes('weekday repeat visits'), true, 'draft should reflect the marketing goal');
assert.equal(draft.isActive, false, 'AI draft should not be active before publish');

const published = campaignBuilder.publishCampaign({
  ...draft,
  id: 'draft-1',
  isActive: false,
});

assert.equal(published.isActive, true, 'published campaigns should be active');
assert.equal(published.id, 'draft-1', 'publish should preserve campaign identity');

const promotions = [
  { id: 'p1', title: 'Gold Repeat Wash', description: '18% off weekday washes', discount: '18% OFF', validUntil: '2026-07-31', bgGradient: 'linear-gradient(135deg, #0b7f86, #18344f)', icon: 'sparkles', targetTier: 'Gold', kmMultiplier: 1.18, isActive: true, createdAt: '2026-06-26T09:00:00Z' },
  { id: 'p2', title: 'All Member Rain Check', description: '10% off after rainy days', discount: '10% OFF', validUntil: '2026-07-15', bgGradient: 'linear-gradient(135deg, #c8553d, #f4a261)', icon: 'ticket', targetTier: 'ALL', kmMultiplier: 1.1, isActive: true, createdAt: '2026-06-25T09:00:00Z' },
  { id: 'p3', title: 'Expired Draft', description: 'Inactive test', discount: '8% OFF', validUntil: '2026-06-10', bgGradient: 'linear-gradient(135deg, #64748b, #334155)', icon: 'ticket', targetTier: 'Silver', kmMultiplier: 1.08, isActive: false, createdAt: '2026-06-20T09:00:00Z' },
];

assert.deepEqual(
  campaignBuilder.getActivePromotionsForTier(promotions, 'Gold', '2026-06-26').map(promotion => promotion.id),
  ['p1', 'p2'],
  'Gold customers should see active Gold and all-tier promotions',
);

assert.deepEqual(
  campaignBuilder.getActivePromotionsForTier(promotions, 'Silver', '2026-06-26').map(promotion => promotion.id),
  ['p2'],
  'Silver customers should not see Gold-only promotions',
);

console.log('FR013 campaign builder tests passed');
