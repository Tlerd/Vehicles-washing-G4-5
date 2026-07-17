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

const bookingLog = await importTypeScriptModule(new URL('../src/features/admin/bookingLog.ts', import.meta.url));

const bookings = Array.from({ length: 24 }, (_, index) => ({
  id: `b${index + 1}`,
  bookingRef: `AWP-${index + 1}`,
  customerId: index % 2 === 0 ? 'c1' : 'c2',
  vehicleId: index % 2 === 0 ? 'v1' : 'v2',
  services: ['s1'],
  carSize: 'sedan',
  branchId: index % 2 === 0 ? 'D1' : 'D7',
  date: index < 22 ? '2026-06-26' : '2026-06-25',
  time: `${String(8 + (index % 10)).padStart(2, '0')}:00`,
  totalPrice: 100000 + index * 10000,
  status: index % 3 === 0 ? 'PENDING' : 'CONFIRMED',
  pointsEarned: 100 + index,
  createdAt: `2026-06-20T${String(index % 24).padStart(2, '0')}:00:00Z`,
}));

const pageZero = bookingLog.getBookingPage({
  bookings,
  date: '2026-06-26',
  status: 'ALL',
  sortBy: 'time',
  page: 0,
  size: 10,
});

assert.equal(pageZero.content.length, 10, 'first page should contain 10 bookings');
assert.equal(pageZero.last, false, 'first page should not be last when more records exist');
assert.equal(
  pageZero.content.every(booking => booking.date === '2026-06-26'),
  true,
  'default date filter should only include bookings for selected date',
);

const pageOne = bookingLog.getBookingPage({
  bookings,
  date: '2026-06-26',
  status: 'ALL',
  sortBy: 'time',
  page: 1,
  size: 10,
});
assert.equal(pageOne.content.length, 10, 'second page should contain the next 10 bookings');
assert.notEqual(pageZero.content[0].id, pageOne.content[0].id, 'second page should not replace first page records');

const pendingPage = bookingLog.getBookingPage({
  bookings,
  date: '2026-06-26',
  status: 'PENDING',
  sortBy: 'time',
  page: 0,
  size: 10,
});
assert.equal(
  pendingPage.content.every(booking => booking.status === 'PENDING'),
  true,
  'status filter should reset to a filtered first page',
);

assert.equal(bookingLog.shouldLoadNextPage({
  scrollHeight: 1200,
  scrollTop: 820,
  clientHeight: 300,
  threshold: 100,
}), true);
assert.equal(bookingLog.shouldLoadNextPage({
  scrollHeight: 1200,
  scrollTop: 600,
  clientHeight: 300,
  threshold: 100,
}), false);

console.log('FR011 booking log tests passed');
