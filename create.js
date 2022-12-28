#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as url from 'node:url';

import chalk from 'chalk';
import prompts from 'prompts';
import mkdirp from 'mkdirp';
import readdir from 'recursive-readdir';
import JSON5 from 'json5';

import { toValidPackageName, ignoreFiles, onCancel } from './lib/utils.js';

// @todo
// - typescript support

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));

console.log(`\
${chalk.gray(`[@soundworks/create#v${version}]`)}

${chalk.yellow('> welcome to soundworks')}

- documentation: ${chalk.cyan('https://soundworks.dev')}
- issues: ${chalk.cyan('https://github.com/collective-soundworks/soundworks/issues')}
`);

let targetDir = process.argv[2] || '.';

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

const targetWorkingDir = path.normalize(path.join(process.cwd(), targetDir));

if (fs.existsSync(targetWorkingDir) && fs.readdirSync(targetWorkingDir).length > 0) {
  console.log(chalk.red(`> "${targetDir}" directory exists and is not empty, aborting...`));
  process.exit(1);
}

const templatesDir = path.join(__dirname, 'app-templates');
// const templatesMetas = JSON.parse(fs.readFileSync(path.join(templatesDir, 'metas.json')));

const options = await prompts([
  // {
  //   type: 'select',
  //   name: 'template',
  //   message: 'Choose a soundworks app template?',
  //   choices: Object.entries(templatesMetas).map(([dir, infos]) => {
  //     return {
  //       title: infos.description,
  //       value: dir,
  //     };
  //   }),
  // },
  {
    type: 'toggle',
    name: 'eslint',
    message: 'Install eslint?',
    initial: true,
    active: 'yes',
    inactive: 'no',
  },
  // @todo - choose language
], { onCancel });

options.name = path.basename(targetWorkingDir);
// @todo - support ts
options.language = 'js';

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
    case 'config/application.json': {
      const obj = JSON5.parse(fs.readFileSync(src));
      obj.name = options.name;
      obj.clients = {};
      fs.writeFileSync(dest, JSON5.stringify(obj, null, 2));
      break;
    }
    case 'README.md': {
      let readme = fs.readFileSync(src).toString();
      readme = readme.replace('# `[app-name]`', `# \`${options.name}\``);
      fs.writeFileSync(dest, readme);
      break;
    }
    default: {
      fs.copyFileSync(src, dest);
      break;
    }
  }
}

if (options.eslint === true) {
  const src = path.join(__dirname, 'build-tools', '.eslintrc');
  const dest = path.join(targetWorkingDir, '.eslintrc');
  fs.copyFileSync(src, dest);
}

// write options in .soundworks file
fs.writeFileSync(path.join(targetWorkingDir, '.soundworks'), JSON.stringify(options, null, 2));

console.log(`> installing dependencies`);

const execOptions = {
  cwd: targetWorkingDir,
  stdio: 'inherit',
};

if (options.eslint === true) {
  // this will install other deps as well
  execSync(`npm install --save-dev eslint @ircam/eslint-config`, execOptions);
} else {
  execSync(`npm install`, execOptions);
}

// launch init wizard
execSync(`npx soundworks --init`, execOptions);
console.log('');
