import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';

import {
  copyDir,
  getSelfPackageName,
  toValidFilename,
  onCancel,
  parseTemplates,
  readProjectConfigEntry,
  readConfigFiles,
  writeConfigFile,
} from './lib/utils.js';
import {
  CONFIG_DIRNAME,
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

  const templateName = readProjectConfigEntry(PROJECT_FILE_PATHNAME, 'template') || 'js';
  const templatePackage = readProjectConfigEntry(PROJECT_FILE_PATHNAME, 'templatePackage') || getSelfPackageName();
  const templatesInfos = parseTemplates();
  const currentTemplateInfos = templatesInfos.find(infos => {
    return infos.name === templateName && infos.templatePackage === templatePackage;
  });

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

  const runtimeTemplates = currentTemplateInfos.clients.filter(client => client.runtime === runtime);

  let clientTemplateName;

  if (runtimeTemplates.length === 1) {
    clientTemplateName = runtimeTemplates[0].name;
  } else {
    const result = await prompts([
      {
        type: 'select',
        name: 'clientTemplateName',
        message: 'Which template would you like to use?',
        // title, description, value
        choices: runtimeTemplates.map(template => {
          return { value: template.name };
        }),
      },
    ], { onCancel });

    clientTemplateName = result.clientTemplateName;
  }

  const clientTemplateInfos = runtimeTemplates.find(template => template.name === clientTemplateName);
  const relDirname = path.dirname(clientTemplateInfos.pathname);
  const extname = path.extname(clientTemplateInfos.pathname);
  // if client template is a directory, extname is empty so we are ok
  const destPathname = path.join(dirname, relDirname, `${name}${extname}`);
  const relDestPathname = path.relative(dirname, destPathname);

  if (fs.existsSync(destPathname)) {
    warn(`file "${relDestPathname}" already exists, aborting...`);
    return;
  }

  let isDefault = false;

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

  blankLine();
  info(`Creating client "${name}" in "${relDestPathname}"`);
  info(`name: ${chalk.cyan(name)}`);
  info(`runtime: ${chalk.cyan(runtime)}`);
  info(`template: ${chalk.cyan(clientTemplateInfos.name)}`);

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
    const srcPathname = path.join(
      // absolute path of the template in the filesystem
      currentTemplateInfos.templatePathname,
      // where the client template is located in the app template
      clientTemplateInfos.pathname,
    );

    // make sure the parent directory exists
    fs.mkdirSync(path.dirname(destPathname), { recursive: true });

    if (fs.statSync(srcPathname).isFile()) {
      fs.copyFileSync(srcPathname, destPathname);
    } else {
      await copyDir(srcPathname, destPathname);
    }

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
