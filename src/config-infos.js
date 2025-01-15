import path from 'node:path';

// @todo - share within @soundworks/helpers
import { runtimeOrTarget } from './lib/runtime-or-target.js';

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

  for (let [name, clientDescription] of Object.entries(config.clients)) {
    info(`${name} \t | runtime: ${runtimeOrTarget(clientDescription)} ${clientDescription.default ? '(default)' : ''}`, 4);
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
}
