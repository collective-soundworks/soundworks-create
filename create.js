#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

import {
  getSelfVersion,
  getSelfPackageName,
  isDebug,
  writeProjectConfigEntry,
} from './src/lib/utils.js';
import {
  WIZARD_DIRNAME,
  PROJECT_FILE_PATHNAME,
} from './src/lib/filemap.js';
import {
  header,
  warn,
  blankLine,
  info,
  success,
} from './src/lib/console.js';
import {
  getTargetWorkingDir,
  copyTemplate,
  installDependencies,
  launchWizardInit,
} from './src/create-app-functions.js';

// --------------------------------------------------------
// prompt header
// --------------------------------------------------------
const version = getSelfVersion();
// will link itself at the end of the installation if --debug is passed to the command
const debug = isDebug();

header();

// --------------------------------------------------------
// scaffolding
// --------------------------------------------------------

const targetWorkingDir = await getTargetWorkingDir();

if (fs.existsSync(targetWorkingDir) && fs.readdirSync(targetWorkingDir).length > 0) {
  warn(`"${targetWorkingDir}" directory exists and is not empty, aborting...`);
  process.exit(1);
}

const appName = path.basename(targetWorkingDir);
const language = 'js';
const template = 'js';
const configFormat = 'yaml';

// const templateDirectoryList
// await chooseTemplate(templateDirectoryList);

const templateDirList = path.join(WIZARD_DIRNAME, 'app-templates');
const templateDir = path.join(templateDirList, template);

blankLine();
info(`Scaffolding application in "${targetWorkingDir}" directory`);

await copyTemplate(appName, templateDir, targetWorkingDir);

const projectConfigPathname = path.join(targetWorkingDir, PROJECT_FILE_PATHNAME);
writeProjectConfigEntry(projectConfigPathname, 'name', appName);
writeProjectConfigEntry(projectConfigPathname, 'createVersion', version);
writeProjectConfigEntry(projectConfigPathname, 'language', language);
writeProjectConfigEntry(projectConfigPathname, 'template', template);
writeProjectConfigEntry(projectConfigPathname, 'configFormat', configFormat);


info(`Installing dependencies`);
blankLine();

installDependencies(targetWorkingDir, getSelfPackageName(), debug);
launchWizardInit(targetWorkingDir, 'soundworks --init');

// recap & next steps
success('Your project is ready!');
blankLine();
info('next steps:');

const relative = path.relative(process.cwd(), targetWorkingDir);
let i = 1;

if (relative !== '') {
  console.log(`  ${i++}: ${chalk.cyan(`cd ${relative}`)}`);
}

console.log(`  ${i++}: ${chalk.cyan('git init && git add -A && git commit -m "first commit"')} (optional)`);
console.log(`  ${i++}: ${chalk.cyan('npm run dev')}`);
