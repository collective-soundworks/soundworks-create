import { execSync } from 'node:child_process';

import chalk from 'chalk';

export async function checkDeps(_appInfos) {
  console.log(chalk.cyan('> running `npm-check -u` (cf. https://www.npmjs.com/package/npm-check)'));
  console.log('');

  execSync(`npm-check -u`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log('');
}

