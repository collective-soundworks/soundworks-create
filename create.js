#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import prompts from 'prompts';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

import {
  getSelfVersion,
  toValidPackageName,
  ignoreFiles,
} from './src/lib/utils.js';
import {
  WIZARD_DIRNAME,
  PROJECT_FILE_PATHNAME,
} from './src/lib/filemap.js';
import {
  warn,
  blankLine,
  info,
  success,
} from './src/lib/console.js';

const version = getSelfVersion();

let debug = false; // will link itself at the end of the installation

if (process.argv[2] == '--debug' || process.argv[3] == '--debug') {
  console.log(chalk.yellow('> Run create in debug mode'));
  debug = true;
}

console.log(`\
${chalk.gray(`[@soundworks/create#v${version}]`)}

${chalk.yellow('> welcome to soundworks')}

- documentation: ${chalk.cyan('https://soundworks.dev')}
- issues: ${chalk.cyan('https://github.com/collective-soundworks/soundworks/issues')}
`);

let targetDir;
if (process.argv[2] && process.argv[2] !== '--debug') {
  targetDir = process.argv[2];
} else {
  targetDir = '.';
}

if (targetDir === '.') {
  const result = await prompts([
    {
      type: 'text',
      name: 'dir',
      message: 'Where should we create your project? (leave blank to use current directory)',
    },
  ]);

  if (result.dir) {
    targetDir = result.dir;
  }
}

const targetWorkingDir = path.isAbsolute(targetDir)
  ? targetDir
  : path.normalize(path.join(process.cwd(), targetDir));

if (fs.existsSync(targetWorkingDir) && fs.readdirSync(targetWorkingDir).length > 0) {
  warn(`"${targetDir}" directory exists and is not empty, aborting...`);
  process.exit(1);
}

const templatesDir = path.join(WIZARD_DIRNAME, 'app-templates');
// const templatesMetas = JSON.parse(fs.readFileSync(path.join(templatesDir, 'metas.json')));

const options = {
  name: path.basename(targetWorkingDir),
  createVersion: version,
  language: 'js',
  configFormat: 'yaml',
};

const templateDir = path.join(templatesDir, options.language);
const files = await readdir(templateDir, ignoreFiles);

fs.mkdirSync(targetWorkingDir, { recursive: true });

blankLine();
info(`Scaffolding application in "${targetWorkingDir}" directory`);

for (let src of files) {
  const file = path.relative(templateDir, src);
  const dest = path.join(targetWorkingDir, file);

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  switch (file) {
    case 'package.json': {
      const pkg = JSON.parse(fs.readFileSync(src));
      pkg.name = toValidPackageName(options.name);

      fs.writeFileSync(dest, JSON.stringify(pkg, null, 2));
      break;
    }
    case 'README.md': {
      let readme = fs.readFileSync(src).toString();
      readme = readme.replace('# `[app-name]`', `# \`${options.name}\``);
      fs.writeFileSync(dest, readme);
      break;
    }
    case 'config/application.yaml': {
      const obj = YAML.parse(fs.readFileSync(src).toString());
      // ovewrite
      obj.name = options.name;
      obj.author = '';
      obj.clients = {};

      fs.writeFileSync(dest, YAML.stringify(obj));
      break;
    }
    // just copy the file without modification
    default: {
      fs.copyFileSync(src, dest);
      break;
    }
  }
}

// --------------------------------------------------------------------
// npm has a weird behavior regarding `.gitignore` files which are
// automatically renamed to `.npmignore`.
// Note 31-10-2023: the .gitignore and .npmrc files seems to be completely
// removed from the package altogether (test w/ `npm pack`).
// So we are just re-creating them from scratch later
// --------------------------------------------------------------------
['gitignore', 'npmignore'].forEach((filename) => {
  const content = fs.readFileSync(path.join(WIZARD_DIRNAME, 'project-files', filename));
  fs.writeFileSync(path.join(targetWorkingDir, `.${filename}`), content);
});

// write options in .soundworks file
fs.writeFileSync(path.join(targetWorkingDir, PROJECT_FILE_PATHNAME), JSON.stringify(options, null, 2));


info(`Installing dependencies`);
blankLine();

const execOptions = {
  cwd: targetWorkingDir,
  stdio: 'inherit',
};

// install itself as a dev dependency
execSync(`npm install --save-dev @soundworks/create --silent`, execOptions);
if (debug) {
  execSync(`npm link @soundworks/create`, execOptions);
}

// launch init wizard
execSync(`npx soundworks --init`, execOptions);

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
