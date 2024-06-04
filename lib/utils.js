import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import filenamify from 'filenamify';
import { globSync } from 'glob';
import JSON5 from 'json5';
import { mkdirp } from 'mkdirp';
import readdir from 'recursive-readdir';
import YAML from 'yaml';

export const ignoreFiles = ['.DS_Store', 'Thumbs.db'];
export const onCancel = () => process.exit();

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

/**
 * return Array<Array<string, object>>
 */
export function readConfigFiles(envFiles) {
  const list = globSync(`config/${envFiles}.{json,yaml}`);
  const results = [];

  list.forEach(pathname => {
    const extname = path.extname(pathname);
    const rawConfig = fs.readFileSync(pathname).toString();

    switch (extname) {
      case '.json': {
        const config = JSON5.parse(rawConfig);
        results.push([pathname, config]);
        break;
      }
      case '.yaml': {
        const config = YAML.parse(rawConfig);
        results.push([pathname, config]);
        break;
      }
    }
  });

  return results;
}

export function writeConfigFile(basename, data) {
  const projectConfig = JSON5.parse(fs.readFileSync('.soundworks'));
  const configFormat = projectConfig.configFormat?.toLowerCase() || 'json';
  const pathname = path.join('config', `${basename}.${configFormat}`);

  switch (configFormat) {
    case 'json': {
      fs.writeFileSync(pathname, JSON5.stringify(data, null, 2));
      break;
    }
    case 'yaml': {
      fs.writeFileSync(pathname, YAML.stringify(data));
      break;
    }
  }
}
