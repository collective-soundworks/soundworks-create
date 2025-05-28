import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import prompts from 'prompts';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

import {
  toValidPackageName,
  ignoreFiles,
} from './lib/utils.js';
import {
  WIZARD_DIRNAME
} from './lib/filemap.js';



export async function getTargetWorkingDir() {
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

  return targetWorkingDir;
}

export async function copyTemplate(appName, templateDir, targetWorkingDir, filesToIgnore = ignoreFiles) {
  const files = await readdir(templateDir, filesToIgnore);

  fs.mkdirSync(targetWorkingDir, { recursive: true });

  for (let src of files) {
    const file = path.relative(templateDir, src);
    const dest = path.join(targetWorkingDir, file);

    fs.mkdirSync(path.dirname(dest), { recursive: true });

    switch (file) {
      case 'package.json': {
        const pkg = JSON.parse(fs.readFileSync(src));
        pkg.name = toValidPackageName(appName);

        fs.writeFileSync(dest, JSON.stringify(pkg, null, 2));
        break;
      }
      case 'README.md': {
        let readme = fs.readFileSync(src).toString();
        readme = readme.replace('# `[app-name]`', `# \`${appName}\``);
        fs.writeFileSync(dest, readme);
        break;
      }
      case 'config/application.yaml': {
        const obj = YAML.parse(fs.readFileSync(src).toString());
        // overwrite
        obj.name = appName;
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
  ['gitignore', 'npmrc'].forEach((filename) => {
    const content = fs.readFileSync(path.join(WIZARD_DIRNAME, 'project-files', filename));
    fs.writeFileSync(path.join(targetWorkingDir, `.${filename}`), content);
  });
}

export function installDependencies(targetWorkingDir, wizardPackageName, debug) {
  const execOptions = {
    cwd: targetWorkingDir,
    stdio: 'inherit',
  };

  // install itself as a dev dependency
  execSync(`npm install --save-dev @soundworks/create --silent`, execOptions);

  if (debug) {
    execSync(`npm link @soundworks/create`, execOptions);
  }
}

export function launchWizardInit(targetWorkingDir, command) {
  const execOptions = {
    cwd: targetWorkingDir,
    stdio: 'inherit',
  };

  execSync(`npx ${command}`, execOptions);
}
