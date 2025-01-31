import { execSync } from 'node:child_process';

import {
  title,
  blankLine,
} from './lib/console.js';

/**
 * Arguments are for testing purposes
 */
export async function checkDeps(dirname = process.cwd(), timeout = undefined) {
  title('running `npm-check -u` (cf. https://www.npmjs.com/package/npm-check)');
  console.log('');

  execSync(`npm-check -u`, {
    stdio: 'inherit',
    cwd: dirname,
    timeout,
  });

  blankLine();
}

