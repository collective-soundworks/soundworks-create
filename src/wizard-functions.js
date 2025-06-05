import prompts from 'prompts';
import { program, Option } from 'commander';

import { createClient } from './create-client.js';
import { installPlugins, installLibs } from './package-installer.js';
import { findDoc } from './find-doc.js';
import { configInfos } from './config-infos.js';
import { createEnv } from './create-env.js';
import { ejectLauncher } from './eject-launcher.js';
import { checkDeps } from './check-deps.js';
import { upgradeConfig } from './upgrade-config.js';
import { onCancel } from './lib/utils.js';
import { blankLine } from './lib/console.js';

export const tasks = [
  {
    name: 'createClient',
    description: 'create a new soundworks client',
    callback: createClient,
    flags: '-c, --create-client',
    launchOnInit: 2,
  },
  {
    name: 'installPlugins',
    description: 'install / uninstall soundworks plugins',
    callback: installPlugins,
    flags: '-p, --install-plugins',
    launchOnInit: 0,
  },
  {
    name: 'installLibs',
    description: 'install / uninstall related libs',
    callback: installLibs,
    flags: '-l, --install-libs',
    launchOnInit: 1,
  },
  {
    name: 'findDoc',
    description: 'find documentation about plugins and related libs',
    callback: findDoc,
    flags: '-f, --find-doc',
    launchOnInit: false,
  },
  {
    name: 'configInfos',
    description: 'get config information about you application',
    callback: configInfos,
    flags: '-i, --config-infos',
    launchOnInit: false,
  },
  {
    name: 'createEnv',
    description: 'create a new environment config file',
    callback: createEnv,
    flags: '-C, --create-env',
    launchOnInit: false,
  },
  {
    name: 'ejectLauncher',
    description: 'eject the launcher and default views from `@soundworks/helpers',
    callback: ejectLauncher,
    flags: '-e, --eject-launcher',
    launchOnInit: false,
  },
  {
    name: 'checkDeps',
    description: 'check and update your dependencies',
    callback: checkDeps,
    flags: '-d, --check-deps',
    launchOnInit: false,
  },
  {
    name: 'upgradeConfig',
    description: 'upgrade config files from JSON to YAML',
    callback: upgradeConfig,
    flags: '--upgrade-config',
    launchOnInit: false,
  },
];


export async function cmdLineWizard(tasks) {
  // allow to trigger specific task from command line
  tasks.forEach((task) => {
    const { flags, description } = task;
    program.option(flags, description);
  });

  // launched by @soundworks/create
  program.addOption(new Option('-i, --init').hideHelp());

  program.parse(process.argv);
  const options = program.opts();

  if (options.init) {
    // init wizard, called by @soundworks/create, force some
    const initTasks = tasks
      .filter(({ launchOnInit }) => launchOnInit !== false)
      .sort((a, b) => a.launchOnInit - b.launchOnInit);

    for (const task of initTasks) {
      await task.callback();
    }
    // continue w/ regular wizard interface
  } else if (Object.keys(options).length > 0) {
    // handle options from command line
    delete options.init; // this is not a task
    // execute all tasks one by one
    for (let task in options) {
      const { callback } = tasks.find(t => t.name === task);
      await callback();
    }
    // command is processed, exit
    process.exit(0);
  }
}

export async function promptWizard(tasks) {
  const choices = tasks.map(({ description, name }) => {
    return {
      title: description,
      value: name,
    };
  });
  choices.push({ title: '→ exit', value: 'exit' });

  while (true) {
    const { task } = await prompts([
      {
        type: 'select',
        name: 'task',
        message: 'What do you want to do?',
        choices,
      },
    ], { onCancel });

    if (task === 'exit') {
      process.exit(0);
    }

    blankLine();
    const { callback } = tasks.find(t => t.name === task);
    await callback();
  }

}
