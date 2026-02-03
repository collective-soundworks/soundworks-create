import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';
import compile from 'template-literal';

import {
  toValidFilename,
  onCancel,
  readProjectConfigEntry,
  readConfigFiles,
  writeConfigFile,
  getTargetDirectory,
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
  let isDefault = false; // for browser clients only

  const choices = runtime === 'browser'
    ? [{ value: 'default' }, { value: 'controller' }]
    : [{ value: 'default' }, { title: 'max (`node.script`)', value: 'max' }];

  const response = await prompts([
    {
      type: 'select',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: choices,
    },
  ], { onCancel });

  template = response.template;

  if (runtime === 'browser') {
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

  const srcPathname = path.join(clientTemplates, `${runtime}-${template}.js`);
  const destFilename = `${name}.js`;
  const destPathname = path.join(dirname, clientsSrcPathname, destFilename);
  const relDestPathname = path.relative(dirname, destPathname); // for logs

  if (fs.existsSync(destPathname)) {
    warn(`file "${relDestPathname}" already exists, aborting...`);
    return;
  }

  blankLine();
  info(`Creating client "${name}" in file "${relDestPathname}"`);
  info(`name: ${chalk.cyan(name)}`);
  info(`runtime: ${chalk.cyan(runtime)}`);
  info(`template: ${chalk.cyan(template)}`);

  if (runtime === 'browser') {
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
    fs.mkdirSync(path.dirname(destPathname), { recursive: true });
    fs.copyFileSync(srcPathname, destPathname);

    // update config file
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

  // Create sample patch and proxy file for Max node.script clients.
  if (runtime === 'node' && template === 'max') {
    blankLine();

    const maxTargetDirectory = await getTargetDirectory({
      message: 'Where should we create your Max patch?'
    });
    console.log(maxTargetDirectory);
    fs.mkdirSync(maxTargetDirectory, { recursive: true });

    const samplePatchPathname = path.join(clientTemplates, `${runtime}-${template}-host.maxpat`);
    const sampleProxyPathname = path.join(clientTemplates, `${runtime}-${template}-proxy.js`);
    const patchDestFilename = `node-${name}.maxpat`;
    const proxyDestFilename = `node-${name}.js`;

    // inject proxyDestFilename into sample patch template
    const patchTemplate = compile(fs.readFileSync(samplePatchPathname));
    const patchContent = patchTemplate({ proxyDestFilename });
    fs.writeFileSync(path.join(maxTargetDirectory, patchDestFilename), patchContent);

    // inject "real" cwd and client file path in proxy
    const proxyTemplate = compile(fs.readFileSync(sampleProxyPathname));
    // relative path from max directory to application cwd
    const relCwd = path.relative(maxTargetDirectory, dirname);
    // relative path from max directory to "real" client file
    const relClientPathname = path.relative(maxTargetDirectory, destPathname);
    const proxyContent = proxyTemplate({ relCwd, relClientPathname });
    fs.writeFileSync(path.join(maxTargetDirectory, proxyDestFilename), proxyContent);

    success(`Max patch and JS proxy successfully created in "${path.relative(dirname, maxTargetDirectory)}"`);
  }

  blankLine();
}
