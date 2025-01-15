import { execSync } from 'node:child_process';

import chalk from 'chalk';
import prompts from 'prompts';

import { plugins, libraries } from './package-database.js';
import { getPackage, onCancel } from './lib/utils.js';
import {
  title,
  subtitle,
  success,
  info,
  warn,
  blankLine,
} from './lib/console.js';

function packageInstaller(type, database) {
  return async function(dirname = process.cwd(), promptsFixtures = null) {
    title('Install ${type}');

    if (promptsFixtures !== null) {
      prompts.inject(promptsFixtures);
    }

    const { dependencies } = getPackage(dirname);
    const list = Object.keys(database);
    const installed = Object.keys(dependencies).filter(pkg => list.includes(pkg));

    const { selected } = await prompts([
      {
        type: 'multiselect',
        name: 'selected',
        message: `Select the ${type} you would like to install/uninstall`,
        choices: list.map(pkg => {
          return {
            title: pkg,
            value: pkg,
            selected: installed.includes(pkg),
          };
        }),
        instructions: false,
        hint: '- Space to select. Return to submit',
      },
    ], { onCancel });

    const toInstall = selected.filter(pkg => !installed.includes(pkg));
    const toRemove = installed.filter(pkg => !selected.includes(pkg));

    if (toInstall.length === 0 && toRemove.length === 0) {
      warn('nothing to do, aborting...');
      return;
    }

    blankLine();

    if (toInstall.length > 0) {
      subtitle(`installing: ${toInstall.join(', ')}`);
    }

    if (toRemove.length > 0) {
      subtitle(`removing: ${toRemove.join(', ')}`);
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
      if (toInstall.length > 0) {
        execSync(`npm install --save ${toInstall.join(' ')} --silent`, {
          cwd: dirname,
          stdio: 'inherit',
        });
      }

      if (toRemove.length > 0) {
        execSync(`npm uninstall --save ${toRemove.join(' ')} --silent`, {
          cwd: dirname,
          stdio: 'inherit',
        });
      }

      success(`${type} successfully updated:`);

      if (toInstall.length > 0) {
        toInstall.forEach(pkg => info(`${pkg}: ${chalk.cyan(database[pkg].doc)}`));
      }
    } else {
      warn(`aborting...`);
    }

    blankLine();
  };
}

export const installPlugins = packageInstaller('plugins', plugins);
export const installLibs = packageInstaller('libraries', libraries);
