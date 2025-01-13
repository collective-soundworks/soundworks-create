import path from 'node:path';

import chalk from 'chalk';

import {
  title,
  subtitle,
  // success,
  warn,
  info,
  blankLine,
} from './lib/console.js';
import {
  readConfigFiles
} from './lib/utils.js';
import { CONFIG_DIRNAME } from './lib/filemap.js';

export async function configInfos(configDirname = CONFIG_DIRNAME) {
  const appFile = readConfigFiles(configDirname, 'application.{yaml,json}');

  if (appFile.length === 0) {
    warn(`Application config file not found in "${configDirname}", abort...`);
    return;
  }

  const [pathname, config] = appFile[0];

  title(`Application config:`);
  subtitle(pathname);
  info(`name: ${config.name}`);
  info(`author: ${config.author}`);
  info(`clients:`);

  for (let [name, clientConfig] of Object.entries(config.clients)) {
    info(`${name} | runtime: ${clientConfig.runtime || clientConfig.target} ${clientConfig.default ? '(default)' : ''}`, 4);
  }

  blankLine('');

  // // env config
  const envFiles = readConfigFiles(configDirname, 'env-*.{yaml,json}');

  if (envFiles.length === 0) {
    warn(`Environnement config file not found in "${configDirname}", abort...`);
    return;
  }

  title(`Environment config:`);

  envFiles.forEach(([pathname, config]) => {
    let envName = path.basename(pathname, path.extname(pathname));
    envName = envName.replace(/^env\-/, '');

    subtitle(pathname);
    console.log(config);
    blankLine();
    info(`To launch the application with this environment configuration, run: \`ENV=${envName} npm run dev\``);
    blankLine();
  });

  // if (envFiles.length === 0) {
  //   console.log(chalk.cyan('  No environment file found, run the following commmand to create a new one:'));
  //   console.log(`${chalk.grey('>')} npx soundworks --create-env`);
  // }

  // console.log('');
}
