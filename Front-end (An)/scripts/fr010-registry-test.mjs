import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
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

const registry = await importTypeScriptModule(new URL('../src/features/admin/customerRegistry.ts', import.meta.url));

const customers = [
  { id: 'c1', name: 'Nguyen Van A', phone: '0901000001', tier: 'Gold', accumulatedPoints: 900, totalSpend: 6000000, createdAt: '2026-01-10T00:00:00Z' },
  { id: 'c2', name: 'Tran Thi B', phone: '0902000002', tier: 'Silver', accumulatedPoints: 150, totalSpend: 1200000, createdAt: '2026-03-12T00:00:00Z' },
  { id: 'c3', name: 'Le Minh C', phone: '0903000003', tier: 'Platinum', accumulatedPoints: 2500, totalSpend: 14000000, createdAt: '2026-02-01T00:00:00Z' },
];

const vehicles = [
  { id: 'v1', customerId: 'c1', licensePlate: '51G-123.45', brand: 'Toyota Camry', size: 'sedan', isDefault: true },
  { id: 'v2', customerId: 'c2', licensePlate: '51A-999.99', brand: 'Mazda 3', size: 'hatchback', isDefault: true },
  { id: 'v3', customerId: 'c3', licensePlate: '30F-888.88', brand: 'Ford Ranger', size: 'pickup', isDefault: true },
];

assert.deepEqual(
  registry.getFilteredCustomers({
    customers,
    vehicles,
    search: '51g',
    tier: 'ALL',
    sortBy: 'createdAt',
  }).map(customer => customer.id),
  ['c1'],
  'search should match customer vehicle plates case-insensitively',
);

assert.deepEqual(
  registry.getFilteredCustomers({
    customers,
    vehicles,
    search: '',
    tier: 'Gold',
    sortBy: 'createdAt',
  }).map(customer => customer.id),
  ['c1'],
  'tier filter should only include the selected loyalty tier',
);

assert.deepEqual(
  registry.getFilteredCustomers({
    customers,
    vehicles,
    search: '',
    tier: 'ALL',
    sortBy: 'totalSpend',
  }).map(customer => customer.id),
  ['c3', 'c1', 'c2'],
  'total spend sorting should order highest spend first',
);

assert.equal(registry.isValidOptionalEmail('admin@autowash.vn'), true);
assert.equal(registry.isValidOptionalEmail(''), true);
assert.equal(registry.isValidOptionalEmail('admin-autowash.vn'), false);

console.log('FR010 registry tests passed');
