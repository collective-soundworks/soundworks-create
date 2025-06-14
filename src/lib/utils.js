import fs from 'node:fs';
import path from 'node:path';

// import { isString } from '@ircam/sc-utils';
import chalk from 'chalk';
import filenamify from 'filenamify';
import { globSync } from 'glob';
import JSON5 from 'json5';
import readdir from 'recursive-readdir';
import YAML from 'yaml';
import { packageUpSync } from 'package-up';

import {
  WIZARD_DIRNAME,
  TEMPLATE_INFO_BASENAME,
} from './filemap.js';
import {
  readDatabase
} from '../package-database.js';

export const ignoreFiles = ['.DS_Store', 'Thumbs.db'];
export const onCancel = () => process.exit();

export function getSelfVersion() {
  const { version } = JSON.parse(fs.readFileSync(path.join(WIZARD_DIRNAME, 'package.json')));
  return version;
}

export function getSelfPackageName() {
  const { name } = JSON.parse(fs.readFileSync(path.join(WIZARD_DIRNAME, 'package.json')));
  return name;
}

export function isDebug() {
  let debug = false;

  if (process.argv[2] == '--debug' || process.argv[3] == '--debug') {
    console.log(chalk.yellow('> Run create in debug mode'));
    debug = true;
  }

  return debug;
}

// to valid npm package name
export function toValidPackageName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9~.-]+/g, '-');
}

export function toValidFilename(input, ext = null) {
  input = filenamify(input);

  if (ext !== null) {
    if (path.extname(input) !== ext) {
      input += ext;
    }
  }

  return input;
}

export async function copyDir(srcDir, distDir) {
  const files = await readdir(srcDir, ignoreFiles);

  fs.mkdirSync(distDir, { recursive: true });

  for (let src of files) {
    const file = path.relative(srcDir, src);
    const dest = path.join(distDir, file);

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

export function getPackage(dirname = process.cwd()) {
  // read package dependencies
  const pathname = path.join(dirname, 'package.json');
  let file = null;

  try {
    file = fs.readFileSync(pathname);
  } catch {
    console.log(chalk.red(`- No package.json file found, make sure to be at the root directory of your project`));
    console.log('');
  }

  return JSON.parse(file);
}


export function readProjectConfigEntry(projectFilePathname, key) {
  if (!fs.existsSync(projectFilePathname)) {
    return null;
  }

  let projectConfig = null;

  try {
    projectConfig = JSON.parse(fs.readFileSync(projectFilePathname));
  } catch {
    throw new Error('Cannot read project config file: Invalid JSON file');
  }

  return projectConfig[key]?.toLowerCase();
}

export function writeProjectConfigEntry(projectFilePathname, key, value) {
  let projectConfig = {};

  if (fs.existsSync(projectFilePathname)) {
    try {
      projectConfig = JSON.parse(fs.readFileSync(projectFilePathname));
    } catch {
      throw new Error('Cannot read project config file: Invalid JSON file');
    }
  }

  projectConfig[key] = value;

  fs.writeFileSync(projectFilePathname, JSON.stringify(projectConfig, null, 2));
}

/**
 * return Array<Array<string, object>>
 */
export function readConfigFiles(configDirname, glob) {
  const list = globSync(`${configDirname}/${glob}`);
  const results = [];

  list.forEach(pathname => {
    const extname = path.extname(pathname).toLowerCase();

    switch (extname) {
      case '.json':
      case '.json5': {
        const config = JSON5.parse(fs.readFileSync(pathname).toString());
        results.push([pathname, config]);
        break;
      }
      case '.yaml':
      case '.yml': {
        const config = YAML.parse(fs.readFileSync(pathname).toString());
        results.push([pathname, config]);
        break;
      }
      default: {
        throw new Error(`Cannot execute "readConfigFiles": Not supported config format ${extname}`);
      }
    }
  });

  return results;
}

export function getFormattedConfig(filename, data) {
  const extname = path.extname(filename).toLowerCase();

  switch (extname) {
    case '.json':
    case '.json5':
      return JSON.stringify(data, null, 2);
    case '.yaml':
    case '.yml':
      return YAML.stringify(data);
    default:
      throw new Error(`Cannot execute "getFormattedConfig": Not supported config format ${extname}`);
  }
}

export function writeConfigFile(configDirname, filename, data) {
  const pathname = path.join(configDirname, filename);
  const formatted = getFormattedConfig(filename, data);
  fs.writeFileSync(pathname, formatted);
}

export function hasJSONConfigFile(configDirname) {
  const list = globSync(`${configDirname}/{application,env-*}.json`);
  return list.length > 0;
}

export function parseTemplates() {
  const templates = readDatabase('templates');
  const infos = [];

  for (let pathname of templates) {
    if (!fs.statSync(pathname).isDirectory()) {
      continue;
    }

    // find the package in which the template is living
    const pkg = packageUpSync({ cwd: path.resolve(pathname, '..') });
    const packageName = JSON.parse(fs.readFileSync(pkg)).name;

    const templateInfosPathname = path.join(pathname, TEMPLATE_INFO_BASENAME);

    if (!fs.existsSync(templateInfosPathname)) {
      console.log('> no template config file found');
      continue;
    }

    let config = null;

    try {
      config = JSON.parse(fs.readFileSync(templateInfosPathname));
    } catch (err) {
      console.log(`> Invalid template config file (${templateInfosPathname})`);
      continue;
    }

    if (typeof config.name !== 'string') {
      console.log(`> Invalid template config file (${templateInfosPathname}): field "name" is not a string`);
      continue;
    }

    if (!Array.isArray(config.clients)) {
      console.log(`> Invalid template config file (${templateInfosPathname}): field "clients" is not an array`);
      continue;
    }

    config.templatePackage = packageName;
    config.templatePathname = pathname;

    infos.push(config);
  }

  if (infos.length === 0) {
    throw new Error(`No template found in directories: ${JSON.stringify(templates)}`);
  }

  return infos;
}
