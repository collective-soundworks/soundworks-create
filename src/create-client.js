import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';

import {
  toValidFilename,
  copyDir,
  onCancel,
  readProjectConfigEntry,
  readConfigFiles,
  writeConfigFile,
} from './lib/utils.js';
import {
  WIZARD_DIRNAME,
  CONFIG_DIRNAME,
  CLIENTS_SRC_PATHNAME,
  PROJECT_FILE_PATHNAME,
} from './lib/filemap.js';
import {
  title,
  warn,
  info,
  success,
  blankLine,
} from './lib/console.js';

export async function createClient(
  dirname = process.cwd(),
  configDirname = CONFIG_DIRNAME,
  clientsSrcPathname = CLIENTS_SRC_PATHNAME,
  promptsFixtures = null,
) {
  title('Create client');

  if (!fs.existsSync(path.join(dirname, PROJECT_FILE_PATHNAME))) {
    warn(`Project config file not found in "${dirname}", abort...`);
    return;
  }

  if (promptsFixtures !== null) {
    prompts.inject(promptsFixtures);
  }

  const language = readProjectConfigEntry(PROJECT_FILE_PATHNAME, 'language') || 'js';
  const clientTemplates = path.join(WIZARD_DIRNAME, 'client-templates', language);
  const someAppConfig = readConfigFiles(path.join(dirname, configDirname), 'application.{yaml,json}');

  if (someAppConfig.length === 0) {
    warn(`Application config file not found in "${configDirname}", abort...`);
    return;
  }

  const [appConfigFilename, appConfig] = someAppConfig[0];

  const { name } = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Name of your new client (lowercase, no-space):',
      validate: name => name !== '' ? true : 'client name cannot be empty',
      format: name => toValidFilename(name),
    },
  ], { onCancel });

  if (Object.keys(appConfig.clients).find(n => n === name)) {
    warn(`client "${name}" already exists, aborting...`);
    return;
  }

  const destFilename = path.join(dirname, clientsSrcPathname, `${name}.js`);
  const relDestFilename = path.relative(dirname, destFilename);

  if (fs.existsSync(destFilename)) {
    warn(`file "${relDestFilename}" already exists, aborting...`);
    return;
  }

  const { runtime } = await prompts([
    {
      type: 'select',
      name: 'runtime',
      message: 'Which runtime for your client?',
      choices: [
        { value: 'browser' },
        { value: 'node' },
      ],
    },
  ], { onCancel });

  let template = 'default';
  let isDefault = false;

  if (runtime === 'browser') {
    const response = await prompts([
      {
        type: 'select',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: [
          { value: 'default' },
          { value: 'controller' },
        ],
      },
    ], { onCancel });

    template = response.template;

    let hasDefault = false;

    for (let name in appConfig.clients) {
      if (appConfig.clients[name].default === true) {
        hasDefault = true;
      }
    }

    if (!hasDefault) {
      isDefault = true;
    } else {
      const result = await prompts([
        {
          type: 'toggle',
          name: 'isDefault',
          message: 'Use this client as default?',
          initial: false,
          active: 'yes',
          inactive: 'no',
        },
      ], { onCancel });

      isDefault = result.isDefault;
    }
  }

  const srcFilename = path.join(clientTemplates, `${runtime}-${template}.js`);

  blankLine();
  info(`Creating client "${name}" in file "${relDestFilename}"`);
  info(`name: ${chalk.cyan(name)}`);
  info(`runtime: ${chalk.cyan(runtime)}`);

  if (runtime === 'browser') {
    info(`template: ${chalk.cyan(template)}`);
    info(`default: ${chalk.cyan(isDefault)}`);
  }

  blankLine();

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

  if (confirm) {
    fs.copyFileSync(srcFilename, destFilename);

    const config = { runtime };

    if (isDefault) {
      // remove previous default
      for (let name in appConfig.clients) {
        if (appConfig.clients[name].default === true) {
          delete appConfig.clients[name].default;
        }
      }

      config.default = true;
    }

    appConfig.clients[name] = config;

    writeConfigFile(path.join(dirname, configDirname), `application${path.extname(appConfigFilename)}`, appConfig);
    success(`client ${name} created and configured`);
  } else {
    warn(`> aborting...`);
  }

  blankLine();
}
