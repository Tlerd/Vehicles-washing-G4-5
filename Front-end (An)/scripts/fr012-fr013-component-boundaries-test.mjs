import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const files = [
  '../src/features/admin/pages/RevenueAuditPanel.tsx',
  '../src/features/admin/pages/RevenueAuditPanel.module.css',
  '../src/features/admin/pages/CampaignBuilderPanel.tsx',
  '../src/features/admin/pages/CampaignBuilderPanel.module.css',
];

await Promise.all(files.map(file => access(new URL(file, import.meta.url))));

const adminPage = await readFile(
  new URL('../src/features/admin/pages/AdminCustomerRegistryPage.tsx', import.meta.url),
  'utf8',
);
const adminStyles = await readFile(
  new URL('../src/features/admin/pages/AdminCustomerRegistryPage.module.css', import.meta.url),
  'utf8',
);

assert.equal(
  adminPage.includes("import { RevenueAuditPanel } from './RevenueAuditPanel'"),
  true,
  'admin page should render FR012 from a separate TSX file',
);
assert.equal(
  adminPage.includes("import { CampaignBuilderPanel } from './CampaignBuilderPanel'"),
  true,
  'admin page should render FR013 from a separate TSX file',
);
assert.equal(adminPage.includes('campaignForm'), false, 'FR013 form state should not live in admin page');
assert.equal(adminPage.includes('revenueSummary'), false, 'FR012 revenue state should not live in admin page');
assert.equal(adminStyles.includes('.campaignLayout'), false, 'FR013 styles should not live in admin page CSS');
assert.equal(adminStyles.includes('.revenueGrid'), false, 'FR012 styles should not live in admin page CSS');

console.log('FR012/FR013 component boundary tests passed');
