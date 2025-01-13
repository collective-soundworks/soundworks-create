import { execSync } from 'node:child_process';

import chalk from 'chalk';
import prompts from 'prompts';

import { plugins, libraries } from './package-database.js';
import { getPackage, onCancel } from './lib/utils.js';

function packageInstaller(type, database) {
  return async function(_appInfos) {
    const { dependencies } = getPackage();
    const list = Object.keys(database);
    const installed = Object.keys(dependencies).filter(pkg => list.includes(pkg));

    const { selected } = await prompts([
      {
        type: 'multiselect',
        name: 'selected',
        message: `Select the ${type} you would like to install/uninstall`,
        choices: list.map(plugin => {
          return {
            title: plugin,
            value: plugin,
            selected: installed.includes(plugin),
          };
        }),
        instructions: false,
        hint: '- Space to select. Return to submit',
      },
    ], { onCancel });

    const toInstall = selected.filter(plugin => !installed.includes(plugin));
    const toRemove = installed.filter(plugin => !selected.includes(plugin));

    if (toInstall.length === 0 && toRemove.length === 0) {
      console.log(`${chalk.cyan('> nothing to do, skip...')} `);
      console.log('');
      return;
    }

    console.log('');

    if (toInstall.length > 0) {
      console.log(`${chalk.cyan('> installing:')} ${toInstall.join(', ')}`);
    }

    if (toRemove.length > 0) {
      console.log(`${chalk.cyan('> removing:')} ${toRemove.join(', ')}`);
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
      console.log('');

      if (toInstall.length > 0) {
        execSync(`npm install --save ${toInstall.join(' ')} --silent`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      }

      if (toRemove.length > 0) {
        execSync(`npm uninstall --save ${toRemove.join(' ')} --silent`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      }

      console.log('');
      console.log(`> ${type} successfully updated!`);

      if (toInstall.length > 0) {
        let msg;

        if (type === 'plugins') {
          msg = '> check the documentation to see how to register the plugins into you app, and see all their options:';
        } else {
          msg = '> check the documentation of the libraries you just installed:';
        }

        console.log('');
        console.log(chalk.green(msg));

        toInstall.forEach(plugin => {
          console.log('');
          console.log(`+ ${plugin}:`);
          console.log(`  ${chalk.cyan(database[plugin].doc)}`);
        });
      }
    } else {
      console.error(`> aborting...`);
    }

    console.log(``);
  };
}

export const installPlugins = packageInstaller('plugins', plugins);
export const installLibs = packageInstaller('libraries', libraries);
