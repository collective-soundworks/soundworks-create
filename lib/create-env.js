import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import JSON5 from 'json5';
import prompts from 'prompts';

import {
  onCancel,
  toValidFilename,
  readConfigFiles,
  writeConfigFile,
} from './utils.js';

export async function createEnv(_appInfos) {
  const { clients } = readConfigFiles('application')[0][1];

  const { name, type, port, serverAddress, useHttps, subpath } = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Name of the config',
      initial: 'default',
    },
    {
      type: 'select',
      name: 'type',
      message: 'Type:',
      choices: [
        { title: 'development', value: 'development' },
        {
          title: 'production',
          value: 'production',
          description: 'use minified files, see `npm run build:production`',
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
      name: 'subpath',
      message: 'Subpath (if the application live behind a proxy server, leave empty for most cases):',
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
      if (clients[name].target === 'browser') {
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
    subpath: subpath.trim(),
    serverAddress: serverAddress.trim(),
    useHttps,
    httpsInfos,
    auth,
  };

  const filename = `env-${name}`;

  console.log('');
  console.log(`> creating config file "${filename}":`);
  console.log(config);
  console.log('');

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
    writeConfigFile(filename, config);
    console.log(chalk.green(`> config file "${filename}" successfully created`));
    console.log(`> run \`ENV=${name} npm start\` to use this config`);
  } else {
    console.error(`> aborting...`);
  }

  console.log('');
}

