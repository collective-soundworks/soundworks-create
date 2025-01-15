import fs from 'node:fs';
import path from 'node:path';
import * as url from 'node:url';

import chalk from 'chalk';
import filenamify from 'filenamify';
import { globSync } from 'glob';
import JSON5 from 'json5';
import { mkdirp } from 'mkdirp';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

export const ignoreFiles = ['.DS_Store', 'Thumbs.db'];
export const onCancel = () => process.exit();

import {
  WIZARD_DIRNAME
} from './filemap.js';

export function getSelfVersion() {
  const { version } = JSON.parse(fs.readFileSync(path.join(WIZARD_DIRNAME, 'package.json')));
  return version;
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

  await mkdirp(distDir);

  for (let src of files) {
    const file = path.relative(srcDir, src);
    const dest = path.join(distDir, file);

    await mkdirp(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

export function getPackage() {
  // read package dependencies
  const pathname = path.join(process.cwd(), 'package.json');
  let file = null;

  try {
    file = fs.readFileSync(pathname);
  } catch(err) {
    console.log(chalk.red(`- No package.json file found, make sure to be at the root directory of your project`));
    console.log('');
  }

  return JSON.parse(file);
}


export function readProjectConfigEntry(projectFilePathname) {
  if (!fs.existsSync(projectFilePathname)) {
    return null;
  }

  let projectConfig = null;

  try {
    projectConfig = JSON.parse(fs.readFileSync(projectFilePathname));
  } catch (err) {
    throw new Error('Cannot read project config file: Invalid JSON file');
  }

  return projectConfig[key]?.toLowerCase();
}

export function writeProjectConfigEntry(projectFilePathname, key, value) {
  let projectConfig = {};

  if (fs.existsSync(projectFilePathname)) {
    try {
      projectConfig = JSON.parse(fs.readFileSync(projectFilePathname));
    } catch (err) {
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

export function writeConfigFile(configDirname, filename, data) {
  const extname = path.extname(filename).toLowerCase();
  const pathname = path.join(configDirname, filename);

  switch (extname) {
    case '.json':
    case '.json5': {
      fs.writeFileSync(pathname, JSON.stringify(data, null, 2));
      break;
    }
    case '.yaml':
    case '.yml': {
      fs.writeFileSync(pathname, YAML.stringify(data));
      break;
    }
    default: {
      throw new Error(`Cannot execute "writeConfigFile": Not supported config format ${extname}`);
    }
  }
}

export function hasJSONConfigFile(configDirname) {
  const list = globSync(`${configDirname}/{application,env-*}.json`);
  return list.length > 0;
}
