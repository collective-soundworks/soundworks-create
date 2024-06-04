import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';

import {
  getSelfVersion,
  onCancel,
  readConfigFiles,
  writeConfigFile,
  hasJSONConfigFile,
} from './utils.js';

export async function upgradeConfig() {
  // if (!hasJSONConfigFile()) {
  //   console.log(chalk.green('> Config files already in YAML format'));
  //   console.log('');
  //   return;
  // }

  const configFiles = readConfigFiles('{application,env-*}').filter(([pathname, data]) => {
    return path.extname(pathname) === '.json';
  });

  const loadConfigPathname = path.join('src', 'utils', 'load-config.js');
  const oldLoadConfigExists = fs.existsSync(loadConfigPathname);
  // console.log(oldLoadConfigExists);

  console.log(chalk.yellow('The following files will be overriden by the update:'));
  console.log('');

  console.log(`> .soundworks`);

  configFiles.forEach(([pathname, _]) => {
    console.log(`> ${pathname}`);
  });

  if (oldLoadConfigExists) {
    console.log(`> ${loadConfigPathname}`);
  }

  console.log('');

  const { confirm } = await prompts([
    {
      type: 'toggle',
      name: 'confirm',
      message: 'Confirm?',
      initial: true,
      active: 'yes',
      inactive: 'no',
    },
  ], { onCancel });

  // upgrade .soundworks file first
  const config = JSON.parse(fs.readFileSync('.soundworks'));
  config.configFormat = 'yaml';
  config.createVersion = getSelfVersion();
  fs.writeFileSync('.soundworks', JSON.stringify(config, null, 2));

  // upgratde config files
  if (confirm) {
    configFiles.forEach(([pathname, data]) => {
      const basename = path.basename(pathname, path.extname(pathname));

      writeConfigFile(basename, data);
      fs.unlinkSync(pathname);
      console.log(chalk.green(`- successfully upgraded ${pathname} to YAML`));
    });
  } else {
    console.error(`> aborting...`);
  }

  // override old load config
  fs.writeFileSync(loadConfigPathname, `\
// file overriden by wizard
import { loadConfig as wizardLoadConfig } from '@soundworks/helpers/node.js';
export function loadConfig(ENV = 'default', callerURL = null) {
  return wizardLoadConfig(ENV, callerURL);
}
  `);
  console.log(chalk.green(`- successfully upgraded ${loadConfigPathname} file`));

  console.log('');
}
