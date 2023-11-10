import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';

import { copyDir, onCancel } from './utils.js';

export async function ejectLauncher(_appInfos) {
  const defaultEjectPath = path.join('src', 'clients', 'helpers');
  const { pathname } = await prompts([
    {
      type: 'text',
      name: 'pathname',
      initial: defaultEjectPath,
      message: 'In which directory would you like to eject the launcher?',
      format: (value) => {
        return path.normalize(value);
      },
    },
  ], { onCancel });

  const srcDir = path.join(process.cwd(), 'node_modules', '@soundworks', 'helpers', 'browser-client');
  const distDir = path.join(process.cwd(), pathname);

  if (fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0) {
    console.error(chalk.red(`> directory ${pathname} already exists and is not empty, aborting...`));
    process.exit(0);
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

    const someClientPath = path.join(process.cwd(), 'src', 'clients', 'someclient');
    const relative = path.relative(someClientPath, distDir);

    console.log(`
> @soundworks/helpers launcher ejected in ${pathname}

> You can now change the default initialization views.
> To use the ejected launcher, in your clients' \`index.js\` files, replace:
${chalk.red(`- import { launcher } from '@soundworks/helpers'`)}
> with
${chalk.green(`+ import { launcher } from '${relative}/launcher.js'`)}
    `);
  } else {
    console.error(`> aborting...`);
  }

  console.log(``);
}
