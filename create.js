#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';
import { mkdirp } from 'mkdirp';
import prompts from 'prompts';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

import {
  getSelfVersion,
  toValidPackageName,
  ignoreFiles,
} from './src/lib/utils.js';

const version = getSelfVersion();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      message: 'Where should we create your project?\n  (leave blank to use current directory)',
    },
  ]);

  if (result.dir) {
    targetDir = result.dir;
  }
}

const targetWorkingDir = path.isAbsolute(targetDir) ?
  targetDir : path.normalize(path.join(process.cwd(), targetDir));

if (fs.existsSync(targetWorkingDir) && fs.readdirSync(targetWorkingDir).length > 0) {
  console.log(chalk.red(`> "${targetDir}" directory exists and is not empty, aborting...`));
  process.exit(1);
}

const templatesDir = path.join(__dirname, 'app-templates');
// const templatesMetas = JSON.parse(fs.readFileSync(path.join(templatesDir, 'metas.json')));

const options = {};
options.createVersion = version;
options.name = path.basename(targetWorkingDir);
options.eslint = true;
options.language = 'js';
options.configFormat = 'yaml';

const templateDir = path.join(templatesDir, options.language);
const files = await readdir(templateDir, ignoreFiles);

await mkdirp(targetWorkingDir);

console.log('');
console.log(`> creating ${options.language} template in:`, targetWorkingDir);

for (let src of files) {
  const file = path.relative(templateDir, src);
  const dest = path.join(targetWorkingDir, file);

  await mkdirp(path.dirname(dest));

  switch (file) {
    case 'package.json': {
      const pkg = JSON.parse(fs.readFileSync(src));
      pkg.name = toValidPackageName(options.name);

      if (options.eslint) {
        pkg.scripts.lint = `eslint .`;
      }

      fs.writeFileSync(dest, JSON.stringify(pkg, null, 2));
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
    case 'README.md': {
      let readme = fs.readFileSync(src).toString();
      readme = readme.replace('# `[app-name]`', `# \`${options.name}\``);
      fs.writeFileSync(dest, readme);
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

// create .gitignore file
fs.writeFileSync(path.join(targetWorkingDir, '.gitignore'), `\
# build files and dependencies
/node_modules
.build
.data

# ignore all environment config files
/config/env-*

# junk files
package-lock.json
.DS_Store
Thumbs.db

# TLS certificates
/**/*.pem
`);

// create .npmrc file
fs.writeFileSync(path.join(targetWorkingDir, '.npmrc'), `\
package-lock=false
`);

// write options in .soundworks file
fs.writeFileSync(path.join(targetWorkingDir, '.soundworks'), JSON.stringify(options, null, 2));

console.log(`> installing dependencies`);
console.log('');

const execOptions = {
  cwd: targetWorkingDir,
  stdio: 'inherit',
};

// install itself as a dev dependency
const devDeps = ['@soundworks/create'];

// @todo - do not ask, just put it in the template
if (options.eslint === true) {
  devDeps.push('eslint');
  devDeps.push('@ircam/eslint-config');

  fs.writeFileSync(path.join(targetWorkingDir, '.eslintrc'), `\
{
  "extends": "@ircam",
}`
  );
}

// this will install other deps as well
execSync(`npm install --save-dev ${devDeps.join(' ')} --silent`, execOptions);

if (debug) {
  execSync(`npm link @soundworks/create`, execOptions);
}

// launch init wizard
execSync(`npx soundworks --init`, execOptions);

// recap & next steps
console.log(chalk.yellow('> your project is ready!'));

console.log(`  ✔ ${options.language === 'js' ? 'JavaScript' : 'TypeScript'}`);

if (options.eslint) {
  console.log('  ✔ eslint');
}

console.log('')
console.log(chalk.yellow('> next steps:'));
let i = 1;

const relative = path.relative(process.cwd(), targetWorkingDir);
if (relative !== '') {
  console.log(`  ${i++}: ${chalk.cyan(`cd ${relative}`)}`);
}

console.log(`  ${i++}: ${chalk.cyan('git init && git add -A && git commit -m "first commit"')} (optional)`);
console.log(`  ${i++}: ${chalk.cyan('npm run dev')}`);

console.log('')
console.log(`- to close the dev server, press ${chalk.bold(chalk.cyan('Ctrl-C'))}`);
