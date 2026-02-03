import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

import {
  toValidPackageName,
  ignoreFiles,
} from './lib/utils.js';
import {
  WIZARD_DIRNAME,
} from './lib/filemap.js';

export async function copyTemplate(appName, templateDir, targetWorkingDir, filesToIgnore = ignoreFiles) {
  const files = await readdir(templateDir, filesToIgnore);

  fs.mkdirSync(targetWorkingDir, { recursive: true });

  for (let src of files) {
    const file = path.normalize(path.relative(templateDir, src));
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
      case `config${path.sep}application.yaml`: {
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

export function installDependencies(targetWorkingDir, packageName = '@soundworks/create', debug = false) {
  const execOptions = {
    cwd: targetWorkingDir,
    stdio: 'inherit',
  };

  // install itself as a dev dependency
  execSync(`npm install --save-dev ${packageName} --silent`, execOptions);

  if (debug) {
    execSync(`npm link ${packageName}`, execOptions);
  }
}

export function launchWizardInit(targetWorkingDir, command) {
  const execOptions = {
    cwd: targetWorkingDir,
    stdio: 'inherit',
  };

  execSync(`npx ${command}`, execOptions);
}
