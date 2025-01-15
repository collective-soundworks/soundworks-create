import chalk from 'chalk';
import prompts from 'prompts';

import { soundworks, plugins, libraries } from './package-database.js';
import { getPackage, onCancel } from './lib/utils.js';
import {
  title,
  blankLine
} from './lib/console.js';

export async function findDoc(pomptsFixtures = null) {
  if (pomptsFixtures !== null) {
    prompts.inject(pomptsFixtures);
  }

  const { dependencies } = getPackage();

  for (let name in soundworks) {
    console.log(`+ ${name}:`);
    console.log(`  ${chalk.cyan(soundworks[name].doc)}`);
  }

  blankLine();
  // @todo - show installed only yes / no
  const { showInstalledOnly } = await prompts([
    {
      type: 'toggle',
      name: 'showInstalledOnly',
      message: 'Which soundworks related packages do you want to check?',
      initial: true,
      active: 'installed ones',
      inactive: 'all ones',
    },
  ], { onCancel });

  const sources = { plugins, libraries };

  Object.keys(sources).forEach(sourceName => {
    const database = sources[sourceName];
    const list = Object.keys(database);
    const deps = Object.keys(dependencies);

    const installed = deps.filter(pkg => list.includes(pkg));

    if (installed.length > 0) {
      blankLine();
      console.log(chalk.yellow(`# ${sourceName}`));
      blankLine();

      if (!showInstalledOnly) {
        console.log(chalk.green('  [installed]'));
      }

      installed.forEach(pkg => {
        console.log(`+ ${pkg}:`);
        console.log(`  ${chalk.cyan(database[pkg].doc)}`);
      });
    }

    if (!showInstalledOnly) {
      const notInstalled = Object.keys(database).filter(pkg => !deps.includes(pkg));

      if (notInstalled.length > 0) {
        blankLine();
        console.log(chalk.gray('  [not installed]'));

        notInstalled.forEach(pkg => {
          console.log(chalk.white(`+ ${pkg}:`));
          console.log(chalk.grey(`  ${database[pkg].doc}`));
        });
      }
    }
  });

  blankLine();
}
