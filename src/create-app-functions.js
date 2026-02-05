import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

import prompts from 'prompts';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

import {
  toValidPackageName,
  ignoreFiles,
  parseTemplates,
  onCancel,
} from './lib/utils.js';
import {
  WIZARD_DIRNAME,
  TEMPLATE_INFO_BASENAME,
} from './lib/filemap.js';

export async function chooseTemplate() {
  const templatesInfos = await parseTemplates();

  // if only one template found, no need for prompting
  if (templatesInfos.length === 1) {
    return templatesInfos[0];
  }

  const { templateInfos } = await prompts([
    {
      type: 'select',
      name: 'templateInfos',
      message: 'Which template do you want to use?',
      choices: templatesInfos.map(infos => {
        return {
          title: infos.name,
          description: `${infos.description} (${infos.templatePackage})`,
          value: infos,
        };
      }),
    },
  ], { onCancel });

  return templateInfos;
}

export async function copyTemplate(appName, templateInfos, targetWorkingDir, filesToIgnore = ignoreFiles) {
  const { templatePathname } = templateInfos;
  const files = await readdir(templatePathname, filesToIgnore);

  fs.mkdirSync(targetWorkingDir, { recursive: true });

  for (let src of files) {
    // do not copy the `template-infos.json` file
    if (path.basename(src) === TEMPLATE_INFO_BASENAME) {
      continue;
    }
    // do not copy client files
    let isClientFile = false;

    for (let clientInfos of templateInfos.clients) {
      // we don't check just for equality in order to support directories as well
      const rel = path.relative(path.join(templatePathname, clientInfos.pathname), src);
      if (!rel.startsWith('..')) {
        isClientFile = true;
        break;
      }

      // also ignore client assets
      if (clientInfos.assets) {
        if (src.startsWith(path.join(templatePathname, clientInfos.assets))) {
          isClientFile = true;
          break;
        }
      }
    }

    if (isClientFile) {
      continue;
    }

    const file = path.relative(templatePathname, src);
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
