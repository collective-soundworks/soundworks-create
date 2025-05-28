#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

import { header } from './src/lib/console.js';
import {
  tasks,
  cmdLineWizard,
  promptWizard,
} from './src/wizard-functions.js';

if (!fs.existsSync(path.join(process.cwd(), '.soundworks'))) {
  console.error(chalk.red(`\
This project doesn't seem to be a soundworks project.
Note that \`npx soundworks\` must be run at the root of your project
Aborting...
  `));
  process.exit();
}

await cmdLineWizard(tasks);

// no options given from command line, launch interactive mode
header();

await promptWizard(tasks);
