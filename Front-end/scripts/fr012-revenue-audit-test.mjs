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

const revenueAudit = await importTypeScriptModule(new URL('../src/features/admin/revenueAudit.ts', import.meta.url));

const bookings = [
  { id: 'b1', customerId: 'c1', vehicleId: 'v1', services: ['s1'], carSize: 'sedan', branchId: 'D1', date: '2026-06-26', time: '09:00', totalPrice: 180000, status: 'COMPLETED', pointsEarned: 180, createdAt: '2026-06-26T09:00:00Z' },
  { id: 'b2', customerId: 'c2', vehicleId: 'v2', services: ['s1'], carSize: 'suv', branchId: 'D7', date: '2026-06-26', time: '10:00', totalPrice: 250000, status: 'COMPLETED', pointsEarned: 250, createdAt: '2026-06-26T10:00:00Z' },
  { id: 'b3', customerId: 'c1', vehicleId: 'v1', services: ['s1'], carSize: 'sedan', branchId: 'D1', date: '2026-06-15', time: '11:00', totalPrice: 300000, status: 'COMPLETED', pointsEarned: 300, createdAt: '2026-06-15T11:00:00Z' },
  { id: 'b4', customerId: 'c3', vehicleId: 'v3', services: ['s1'], carSize: 'pickup', branchId: 'D1', date: '2026-05-10', time: '12:00', totalPrice: 400000, status: 'COMPLETED', pointsEarned: 400, createdAt: '2026-05-10T12:00:00Z' },
  { id: 'b5', customerId: 'c3', vehicleId: 'v3', services: ['s1'], carSize: 'pickup', branchId: 'D1', date: '2026-06-26', time: '13:00', totalPrice: 500000, status: 'PENDING', pointsEarned: 0, createdAt: '2026-06-26T13:00:00Z' },
];

assert.deepEqual(
  revenueAudit.getRevenueSummary({
    bookings,
    period: 'day',
    anchorDate: '2026-06-26',
    branch: 'ALL',
  }),
  { revenue: 430000, completedWashes: 2, averageTicket: 215000 },
  'day summary should include only completed bookings for the anchor date',
);

assert.deepEqual(
  revenueAudit.getRevenueSummary({
    bookings,
    period: 'month',
    anchorDate: '2026-06-26',
    branch: 'D1',
  }),
  { revenue: 480000, completedWashes: 2, averageTicket: 240000 },
  'month summary should filter by selected branch',
);

assert.deepEqual(
  revenueAudit.getRevenueSummary({
    bookings,
    period: 'year',
    anchorDate: '2026-06-26',
    branch: 'ALL',
  }),
  { revenue: 1130000, completedWashes: 4, averageTicket: 282500 },
  'year summary should aggregate completed bookings across all months',
);

const transactions = [
  { id: 't1', customerId: 'c1', type: 'earn', points: 180, description: 'Earned points', createdAt: '2026-06-26T10:00:00Z' },
  { id: 't2', customerId: 'c2', type: 'redeem', points: -500, description: 'Redeemed voucher', createdAt: '2026-06-25T10:00:00Z' },
  { id: 't3', customerId: 'c1', type: 'tier_change', points: 0, description: 'Promoted to Gold', createdAt: '2026-06-24T10:00:00Z' },
];

assert.deepEqual(
  revenueAudit.getPointAuditRows(transactions, 'ALL').map(row => row.id),
  ['t1', 't2', 't3'],
  'audit rows should default to newest first',
);

assert.deepEqual(
  revenueAudit.getPointAuditRows(transactions, 'redeem').map(row => row.id),
  ['t2'],
  'audit rows should filter by point transaction type',
);

console.log('FR012 revenue audit tests passed');
