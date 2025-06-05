import path from 'node:path';
import prompts from 'prompts';

import {
  title,
  success,
  warn,
  info,
  blankLine,
} from './lib/console.js';
import {
  onCancel,
  readConfigFiles,
  writeConfigFile,
  getFormattedConfig,
} from './lib/utils.js';
import {
  CONFIG_DIRNAME,
} from './lib/filemap.js';
import {
  runtimeOrTarget,
} from './lib/runtime-or-target.js';

export async function createEnv(configDirname = CONFIG_DIRNAME, promptsFixtures = null) {
  const someAppConfig = readConfigFiles(configDirname, 'application.{json,yaml}');

  if (someAppConfig.length === 0) {
    warn(`Application config file not found in "${configDirname}", abort...`);
    return;
  }

  if (promptsFixtures) {
    prompts.inject(promptsFixtures);
  }

  title(`Create environment configuration file:`);

  const [appConfigPathname, appConfig] = someAppConfig[0];
  const { clients } = appConfig;
  const configFormat = path.extname(appConfigPathname);

  const { name, type, port, serverAddress, useHttps, baseUrl } = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Name of the config',
      initial: 'default',
    },
    { // this is useful, e.g. for plugin-filesystem
      type: 'select',
      name: 'type',
      message: 'Type:',
      choices: [
        { title: 'development', value: 'development' },
        {
          title: 'production',
          value: 'production',
          // description: 'use minified files, see `npm run build:production`',
        },
      ],
    },
    {
      type: 'text',
      name: 'port',
      initial: 8000,
      message: 'Port (default is 80 for http and 443 for https):',
    },
    {
      type: 'text',
      name: 'serverAddress',
      message: 'Address of the server (domain or ip), leave empty for local development:',
    },
    {
      type: 'confirm',
      name: 'useHttps',
      message: 'Use https?',
      initial: false,
    },
    {
      type: 'text',
      name: 'baseUrl',
      message: 'baseUrl (if the application live behind a proxy server, leave empty for most cases):',
    },
  ], { onCancel });

  let httpsInfos = { cert: null, key: null };

  if (useHttps) {
    const { cert, key } = await prompts([
      {
        type: 'text',
        name: 'cert',
        message: 'Path to the cert file (leave blank for self-signed certificates)?',
      },
      {
        type: 'text',
        name: 'key',
        message: 'Path to the key file (leave blank for self-signed certificates)?',
      },
    ], { onCancel });

    if (cert !== '' && key !== '') {
      httpsInfos.cert = cert.trim();
      httpsInfos.key = key.trim();
    }
  }

  const auth = {
    clients: [],
    login: '',
    password: '',
  };

  const { protectClients } = await prompts([
    {
      type: 'confirm',
      name: 'protectClients',
      message: 'Do you want to protect some clients with a password?',
      initial: false,
    },
  ], { onCancel });

  if (protectClients) {
    const browserClients = [];

    for (let name in clients) {
      if (runtimeOrTarget(clients[name]) === 'browser') {
        browserClients.push(name);
      }
    }

    const { protectedClients, login, password } = await prompts([
      {
        type: 'multiselect',
        name: 'protectedClients',
        message: 'Which clients would you like to protect?',
        choices: browserClients.map(name => {
          return { title: name, value: name };
        }),
        instructions: false,
        hint: '- Space to select. Return to submit',
      },
      {
        type: 'text',
        name: 'login',
        message: 'Define a login:',
      },
      {
        type: 'text',
        name: 'password',
        message: 'Define a password:',
      },
    ], { onCancel });

    auth.clients = protectedClients;
    auth.login = login.trim();
    auth.password = password.trim();
  }

  const config = {
    type,
    port: parseInt(port),
    baseUrl: baseUrl.trim(),
    serverAddress: serverAddress.trim(),
    useHttps,
    httpsInfos,
    auth,
  };

  const filename = `env-${name}${configFormat}`;

  blankLine();
  info(`creating config file "${filename}":`);
  console.log('```');
  console.log(getFormattedConfig(filename, config));
  console.log('```');
  blankLine('');

  const { confirm } = await prompts([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Confirm?',
      initial: true,
    },
  ], { onCancel });

  console.log('');

  if (confirm) {
    writeConfigFile(configDirname, filename, config);
    success(`config file "${filename}" successfully created`);
    info(`run \`ENV=${name} npm start\` to use this environment configuration`);
  } else {
    warn(`aborting...`);
  }

  blankLine();
}

