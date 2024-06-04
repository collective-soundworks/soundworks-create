import fs from 'node:fs';
import path from 'node:path';
import * as url from 'node:url';

import chalk from 'chalk';
import prompts from 'prompts';
import JSON5 from 'json5';

import {
  toValidFilename,
  copyDir,
  onCancel,
  readConfigFiles,
  writeConfigFile,
} from './utils.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export async function createClient(appInfos) {
  const templates = path.join(__dirname, '..', 'client-templates', appInfos.language);
  const appConfig = readConfigFiles('application')[0][1];

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
    console.error(chalk.red(`> client "${name}" already exists, aborting...`));
    return;
  }

  const { target } = await prompts([
    {
      type: 'select',
      name: 'target',
      message: 'Which target for your client?',
      choices: [
        { value: 'browser' },
        { value: 'node' },
      ],
    },
  ], { onCancel });

  let template = 'default';
  let isDefault = false;

  if (target === 'browser') {
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

  const destDirRelative = path.join('src', 'clients', name);

  console.log('');
  console.log(`> creating client "${name}" in directory "${destDirRelative}"`);
  console.log(`- name: ${chalk.cyan(name)}`);
  console.log(`- target: ${chalk.cyan(target)}`);

  if (target === 'browser') {
    console.log(`- template: ${chalk.cyan(template)}`);
    console.log(`- default: ${chalk.cyan(isDefault)}`);
  }

  console.log(``);

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
    const srcDir = path.join(templates, `${target}-${template}`);
    const destDir = path.join(process.cwd(), destDirRelative);

    await copyDir(srcDir, destDir);

    const config = { target };

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

    writeConfigFile('application', appConfig);
    console.log(`> client ${name} created and configured`);
  } else {
    console.error(`> aborting...`);
  }

  console.log(``);
}
