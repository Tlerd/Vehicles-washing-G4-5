import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const routerPath = path.join(projectRoot, 'src', 'routes', 'AdminRouter.tsx');
const cssPath = path.join(projectRoot, 'src', 'routes', 'AdminRouter.module.css');

const [routerSource, cssSource] = await Promise.all([
  readFile(routerPath, 'utf8'),
  readFile(cssPath, 'utf8'),
]);

const assertions = [
  ['AdminRouter metadata source', routerSource.includes('const adminPanels = [')],
  ['AdminRouter sectionEyebrow metadata', routerSource.includes('sectionEyebrow')],
  ['AdminRouter sectionTitle metadata', routerSource.includes('sectionTitle')],
  ['AdminRouter sectionDescription metadata', routerSource.includes('sectionDescription')],
  ['Admin shell overview section class', cssSource.includes('.overviewSection')],
  ['Admin shell hero card class', cssSource.includes('.heroCard')],
];

const failedAssertion = assertions.find(([, passed]) => !passed);

if (failedAssertion) {
  throw new Error(`Contract failed: ${failedAssertion[0]}`);
}

console.log('Admin shell harmonization contract passed');
