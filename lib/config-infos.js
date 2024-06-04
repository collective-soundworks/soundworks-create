import path from 'node:path';
import fs from 'node:fs';

import chalk from 'chalk';

import { ignoreFiles, readConfigFiles } from './utils.js';

export async function configInfos(_appName) {
  // get app config
  const [appConfigPath, app] = readConfigFiles('application')[0];

  console.log(chalk.yellow(`# application config:`));
  console.log(chalk.grey(`> ${appConfigPath}`));
  console.log(`  ${chalk.cyan('name:')} "${app.name}"`);
  console.log(`  ${chalk.cyan('author:')} "${app.author}"`);
  console.log(`  ${chalk.cyan('clients:')}`);

  for (let [name, config] of Object.entries(app.clients)) {
    console.log(`    - ${name}\ttarget: ${config.target} ${config.default ? '(default)' : ''}`);
  }

  console.log('');

  // env config
  const envFiles = readConfigFiles('env-*');

  console.log(chalk.yellow(`# environment config:`));
  envFiles.forEach(([pathname, config]) => {
    const envName = path.basename(pathname, path.extname(pathname));

    console.log(chalk.grey(`> ${pathname}`));
    console.log(config);
    console.log('');
    console.log(chalk.grey('to launch the application with this config file, run:'));
    console.log(`${chalk.grey('>')} ENV=${envName} npm run dev`);

    console.log('');
  });

  if (envFiles.length === 0) {
    console.log(chalk.cyan('  No environment file found, run the following commmand to create a new one:'));
    console.log(`${chalk.grey('>')} npx soundworks --create-env`);
  }

  console.log('');
}
