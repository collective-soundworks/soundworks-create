import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';

import { copyDir, onCancel } from './lib/utils.js';
import {
  CLIENTS_SRC_PATHNAME,
  EJECT_LAUNCHER_DEFAULT_PATHNAME,
  EJECT_LAUNCHER_SRC_PATHNAME,
} from './lib/filemap.js';
import {
  title,
  warn,
  blankLine,
} from './lib/console.js';

export async function ejectLauncher(
  srcDir = EJECT_LAUNCHER_SRC_PATHNAME,
  promptsFixtures = null,
) {
  if (promptsFixtures !== null) {
    prompts.inject(promptsFixtures);
  }

  title(`Eject launcher`);

  const { distDir } = await prompts([
    {
      type: 'text',
      name: 'distDir',
      initial: EJECT_LAUNCHER_DEFAULT_PATHNAME,
      message: 'In which directory would you like to eject the launcher?',
      format: (value) => path.normalize(value),
    },
  ], { onCancel });

  if (fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0) {
    warn(`directory ${distDir} already exists and is not empty, aborting...`);
    return;
  }

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
    await copyDir(srcDir, distDir);

    const someClientPath = path.join(CLIENTS_SRC_PATHNAME, 'someclient');
    const relative = path.relative(someClientPath, distDir);

    console.log(`
> @soundworks/helpers launcher ejected in ${distDir}

> You can now change the default initialization views.
> To use the ejected launcher, in your clients' \`index.js\` files, replace:
${chalk.red(`- import launcher from '@soundworks/helpers/launcher.js'`)}
${chalk.red(`- import loadConfig from '@soundworks/helpers/load-config.js'`)}
> with
${chalk.green(`+ import launcher from '${relative}/launcher.js'`)}
${chalk.green(`+ import loadConfig from '${relative}/load-config.js'`)}
    `);
  } else {
    warn(`aborting...`);
  }

  blankLine(``);
}
