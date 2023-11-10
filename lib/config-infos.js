import path from 'node:path';
import fs from 'node:fs';

import chalk from 'chalk';
import JSON5 from 'json5';

import { ignoreFiles } from './utils.js';

export async function configInfos(_appName) {
  // get app config
  const appConfigPath = path.join('config', 'application.json');
  const app = JSON5.parse(fs.readFileSync(path.join(process.cwd(), appConfigPath)));

  console.log(chalk.yellow(`# application config (cf. "${appConfigPath}"):`));
  console.log(`  ${chalk.cyan('name:')} "${app.name}"`);
  console.log(`  ${chalk.cyan('author:')} "${app.author}"`);
  console.log(`  ${chalk.cyan('clients:')}`);

  for (let [name, config] of Object.entries(app.clients)) {
    console.log(`    - ${name}\ttarget: ${config.target} ${config.default ? '(default)' : ''}`);
  }

  console.log('');

  // env config
  const envPath = path.join('config');
  const envFiles = fs.readdirSync(path.join(process.cwd(), envPath));
  const envFilesFiltered = envFiles.filter(filename => filename.startsWith('env-'));

  console.log(chalk.yellow(`# environment config (cf. ${envPath}):`));
  envFilesFiltered.forEach(filename => {
    if (ignoreFiles.indexOf(filename) !== -1) {
      return;
    }

    const pathname = path.join(envPath, filename);

    console.log(chalk.cyan(`> ${pathname}`));

    const config = JSON5.parse(fs.readFileSync(path.join(process.cwd(), pathname)));
    console.log(config);

    console.log('');
    console.log(chalk.grey('to launch the application with this config file, run:'));
    if (filename === 'default.json') {
      console.log(`${chalk.grey('>')} npm run dev`);
    } else {
      console.log(`${chalk.grey('>')} ENV=${path.basename(filename, '.json')} npm run dev`);
    }

    console.log('');
  });

  if (envFilesFiltered.length === 0) {
    console.log(chalk.cyan('  No environment file found, run the following commmand to create a new one:'));
    console.log(`${chalk.grey('>')} npx soundworks --create-env`);
  }

  console.log('');
}
