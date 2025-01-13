#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { program, Option } from 'commander';
import prompts from 'prompts';

import { createClient } from './src/create-client.js';
import { installPlugins, installLibs } from './src/package-installer.js';
import { findDoc } from './src/find-doc.js';
import { configInfos } from './src/config-infos.js';
import { createEnv } from './src/create-env.js';
import { ejectLauncher } from './src/eject-launcher.js';
import { checkDeps } from './src/check-deps.js';
import { upgradeConfig } from './src/upgrade-config.js';

import { onCancel, getSelfVersion } from './src/lib/utils.js';

const tasks = {
  createClient,
  installPlugins,
  installLibs,
  findDoc,
  configInfos,
  createEnv,
  ejectLauncher,
  checkDeps,
  upgradeConfig,
};

const version = getSelfVersion();

// allow to trigger specific taks from command line
program
  .option('-c, --create-client', 'create a new soundworks client')
  .option('-p, --install-plugins', 'install / uninstall soundworks plugins')
  .option('-l, --install-libs', 'install / uninstall related libs')
  .option('-f, --find-doc', 'find documentation about plugins and related libs')
  .option('-i, --config-infos', 'get config informations about you application')
  .option('-C, --create-env', 'create a new environment config file')
  .option('-e, --eject-launcher', 'eject the launcher and default views from `@soundworks/helpers`')
  .option('-d, --check-deps', 'check and update your dependencies')
  .option('--upgrade-config', 'upgrade config files from JSON to YAML')
  .addOption(new Option('-i, --init').hideHelp()) // launched by @soundworks/create
;

program.parse(process.argv);
const options = program.opts();

if (!fs.existsSync(path.join(process.cwd(), '.soundworks'))) {
  console.error(chalk.red(`\
This project doesn't seem to be soundworks project.
Note that \`npx soundworks\` should be run at the root of your project
Aborting...
  `));
  process.exit();
}

const appInfos = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.soundworks')));

console.log(chalk.gray(`[@soundworks/wizard#v${version}]`));
console.log('');

// init wizard, called by @soundworks/create
if (options.init) {
  console.log(chalk.yellow(`> soundworks init wizard`));
  console.log('');

  await installPlugins();
  await installLibs();
  await tasks.createClient(appInfos);

  console.log(chalk.yellow(`> soundworks init wizard done`));
  console.log('');

  process.exit(0);

// handle options from command line
} else if (Object.keys(options).length > 0) {
  delete options.init; // this is not a task
  // execute all tasks one by one
  for (let task in options) {
    await tasks[task](appInfos);
  }

  process.exit(0);

// no options given from command line, launch interactive mode
} else {
  console.log(`\
${chalk.yellow(`> welcome to the soundworks wizard`)}
${chalk.grey(`- you can exit the wizard at any moment by typing Ctrl+C or by choosing the "exit" option`)}

- documentation: ${chalk.cyan('https://soundworks.dev')}
- issues: ${chalk.cyan('https://github.com/collective-soundworks/soundworks/issues')}
  `);

  /* eslint-disable-next-line no-constant-condition */
  while (true) {
    const { task } = await prompts([
      {
        type: 'select',
        name: 'task',
        message: 'What do you want to do?',
        choices: [
          { title: 'create a new soundworks client', value: 'createClient' },
          { title: 'install / uninstall soundworks plugins', value: 'installPlugins' },
          { title: 'install / uninstall related libs', value: 'installLibs' },
          { title: 'find documentation about plugins and libs', value: 'findDoc' },
          { title: 'get config informations about you application', value: 'configInfos' },
          { title: 'create a new environment config file', value: 'createEnv' },
          { title: 'eject the launcher and default init views', value: 'ejectLauncher' },
          { title: 'check and update your dependencies', value: 'checkDeps' },
          { title: 'upgrade config files from JSON to YAML', value: 'upgradeConfig' },
          { title: '→ exit', value: 'exit' },
        ],
      },
    ], { onCancel });

    if (task === 'exit') {
      process.exit(0);
    }

    console.log('');
    await tasks[task](appInfos);
  }
}
