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

const roleAccess = await importTypeScriptModule(new URL('../src/features/auth/roleAccess.ts', import.meta.url));
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const authSource = await readFile(new URL('../src/services/customer/auth.service.ts', import.meta.url), 'utf8');

assert.equal(
  roleAccess.getPortalForUser(null),
  'auth',
  'anonymous users should see the auth page',
);
assert.equal(
  roleAccess.getPortalForUser({ id: 'c1', role: 'CUSTOMER' }),
  'customer',
  'customer users should enter the customer portal',
);
assert.equal(
  roleAccess.getPortalForUser({ id: 'admin', role: 'ADMIN' }),
  'admin',
  'admin users should enter the admin portal',
);
assert.equal(roleAccess.canAccessAdminPortal({ role: 'ADMIN' }), true);
assert.equal(roleAccess.canAccessAdminPortal({ role: 'CUSTOMER' }), false);
assert.equal(roleAccess.canAccessAdminPortal(null), false);

assert.equal(appSource.includes('portalMode'), false, 'App should not use manual portalMode bypass');
assert.equal(appSource.includes('Open Admin FR010'), false, 'App should not expose an admin shortcut button');
assert.equal(appSource.includes('getPortalForUser'), true, 'App should route by authenticated user role');
assert.equal(authSource.includes("role: 'ADMIN'"), false, 'auth service should not issue local demo admin credentials');
assert.equal(authSource.includes('local admin credentials'), false, 'auth service should not include local admin credentials');

console.log('FR admin role access tests passed');
