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

  console.log('');

  let backedUpFile = false;

  // upgrade .soundworks file first
  const config = JSON.parse(fs.readFileSync('.soundworks'));
  config.configFormat = 'yaml';
  config.createVersion = getSelfVersion();
  fs.writeFileSync('.soundworks', JSON.stringify(config, null, 2));

  // upgratde config files
  if (confirm) {
    configFiles.forEach(([pathname, data]) => {
      const backup = `${pathname}.bak`;
      const basename = path.basename(pathname, path.extname(pathname));

      fs.renameSync(pathname, backup);
      writeConfigFile(basename, data);
      console.log(chalk.green(`+ Successfully upgraded "${pathname}" to YAML (backed up as "${backup}")`));
      backedUpFile = true;
    });
  } else {
    console.error(`> aborting...`);
  }

  // override old load config
  if (oldLoadConfigExists) {
    const backup = `${loadConfigPathname}.bak`;
    fs.renameSync(loadConfigPathname, backup);
    fs.writeFileSync(loadConfigPathname, `\
  // file overriden by wizard
  import { loadConfig as wizardLoadConfig } from '@soundworks/helpers/node.js';
  export function loadConfig(ENV = 'default', callerURL = null) {
    return wizardLoadConfig(ENV, callerURL);
  }
    `);
    console.log(chalk.green(`+ Successfully upgraded "${loadConfigPathname}" (backed up as "${backup}")`));
    backedUpFile = true;
  }

  if (backedUpFile) {
    console.log('');
    console.log(chalk.yellow(`> Once you are sure your application starts as expected, you can safely delete the backup files`));
  }

  console.log('');
}
