import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';

import { compareVersions } from 'compare-versions';

import {
  title,
  success,
  info,
  blankLine,
} from './lib/console.js';
import {
  getSelfVersion,
  onCancel,
  writeProjectConfigEntry,
  readConfigFiles,
  writeConfigFile,
  hasJSONConfigFile,
} from './lib/utils.js';
import {
  WIZARD_DIRNAME,
  // paths in project
  PROJECT_FILE_PATHNAME,
  CONFIG_DIRNAME,
  LOAD_CONFIG_PATHNAME,
} from './lib/filemap.js';

/**
 * Update wizard version in .soundworks file
 * @param {string} projectFilePathname
 *
 * - introduced in @soundworks/create 1.0.0-alpha.22
 */
export async function _upgradeCreateVersionInProjectFile(projectFilePathname) {
  if (typeof projectFilePathname !== 'string') {
    throw new Error(`Cannot execute "upgradeFromJsonToYaml", projectFilePathname is not a valid pathname`);
  }

  title(`Updating wizard version in ${projectFilePathname}`);
  writeProjectConfigEntry(projectFilePathname, 'createVersion', getSelfVersion());
}

/**
 * Ensure default config file `env-default.yaml` exists.
 * @param {string} configDirname
 *
 * - introduced in @soundworks/create v1.0.0-beta.0
 */
export async function _ensureDefaultEnvConfigFile(configDirname) {
  if (!fs.existsSync(configDirname) || !fs.statSync(configDirname).isDirectory()) {
    throw new Error(`Cannot execute "_ensureDefaultEnvConfigFile", configDirname is not a directory`);
  }

  title('Ensure config file "env-default.json" exists');

  const destPathname = path.join(configDirname, 'env-default.json');

  if (fs.existsSync(destPathname)) {
    info('Default config file found, skip');
    return;
  } else {
    const srcPathname = path.join(WIZARD_DIRNAME, 'src', 'templates', 'env-default.json');
    fs.copyFileSync(srcPathname, destPathname);
    success(`Successfully created default config file: "${destPathname}"`);
  }
}

/**
 * Upgrade all config files from JSON to YAML
 * @param {string} configDirname
 * @param {string} projectFilePathname
 *
 * - introduced in @soundworks/create 1.0.0-alpha.22
 */
export async function _upgradeFromJsonToYaml(configDirname, projectFilePathname) {
  if (!fs.existsSync(configDirname) || !fs.statSync(configDirname).isDirectory()) {
    throw new Error(`Cannot execute "_upgradeFromJsonToYaml", configDirname is not a directory`);
  }

  if (typeof projectFilePathname !== 'string') {
    throw new Error(`Cannot execute "_upgradeFromJsonToYaml", projectFilePathname is not a valid pathname`);
  }

  title('Upgrading config files from JSON to YAML format');

  if (!hasJSONConfigFile(configDirname)) {
    info('No JSON config file found, skip');
    return;
  }

  // upgrade .soundworks file first
  writeProjectConfigEntry(projectFilePathname, 'configFormat', 'yaml');

  // look for json config files and convert them to yaml
  const configFiles = readConfigFiles(configDirname, '{application,env-*}.json');

  configFiles.forEach(([pathname, data]) => {
    const basename = path.basename(pathname, path.extname(pathname));
    const backup = `${pathname}.bak`;
    // backup json file
    fs.renameSync(pathname, backup);
    // write yaml file
    writeConfigFile(configDirname, `${basename}.yaml`, data);

    success(`Successfully upgraded "${pathname}" to YAML (backed up as "${backup}")`);
  });
}

/**
 * Override `src/lib/load-config.js` to use the function provided by the @soundworks/helpers
 * @param {string} loadConfigPathname
 *
 * - introduced in @soundworks/create 1.0.0-alpha.22
 */
export async function _overrideLoadConfig(loadConfigPathname) {
  if (typeof loadConfigPathname !== 'string') {
    throw new Error(`Cannot execute "_overrideLoadConfig", loadConfigPathname is not a valid pathname`);
  }

  title('Override `loadConfig` in "load-config.js" file');

  if (!fs.existsSync(loadConfigPathname)) {
    info('No load-config.js file found, skip');
    return;
  } else {
    const srcPathname = path.join(WIZARD_DIRNAME, 'src', 'templates', 'load-config.js');
    fs.renameSync(loadConfigPathname, `${loadConfigPathname}.bak`);
    fs.copyFileSync(srcPathname, loadConfigPathname);
    success(`Successfully overridden load config file: "${loadConfigPathname}"`);
  }
}

/**
 * Change ClientDescription#target to ClientDescription#runtime in application.yaml
 * @param {string} configDirname
 *
 * - introduced in  @soundworks/create v1.0.0-beta.0
 * - require @soundworks/core >= v4.0.0-beta.0
 */
export async function _upgradeClientDescriptionTargetToRuntime(configDirname) {
  if (!fs.existsSync(configDirname) || !fs.statSync(configDirname).isDirectory()) {
    throw new Error(`Cannot execute "upgradeFromJsonToYaml", configDirname is not a directory`);
  }

  title('Update `ClientDescription#target` to `ClientDescription#runtime` in application.yaml');

  const result = readConfigFiles(configDirname, 'application.yaml');
  const [_, config] = result[0];

  for (let name in config.clients) {
    const client = config.clients[name];
    client.runtime = client.target;
    delete client.target;
  }

  writeConfigFile(configDirname, 'application.yaml', config);
  success(`Successfully updated "application.yaml" file`);
}

/**
 * Change ServerEnvConfig#subpath to ServerEnvConfig#baseUrl in env-*.yaml
 * @param {string} configDirname
 *
 * - introduced in  @soundworks/create v1.0.0-beta.0
 * - require @soundworks/core >= v4.0.0-beta.0
 */
export async function _upgradeServerEnvConfigSubpathToBaseUrl(configDirname) {
  if (!fs.existsSync(configDirname) || !fs.statSync(configDirname).isDirectory()) {
    throw new Error(`Cannot execute "_upgradeServerEnvConfigSubpathToBaseUrl", configDirname is not a directory`);
  }

  title('Update `ServerEnvConfig#subpath` to `ServerEnvConfig#baseUrl` in env-*.yaml');

  const result = readConfigFiles(configDirname, 'env-*.yaml');
  result.forEach(([pathname, env]) => {
    if ('subpath' in env) {
      env.baseUrl = env.subpath;
      delete env.subpath;
      console.log(env);
      writeConfigFile(configDirname, path.basename(pathname), env);
      success(`Successfully updated "${pathname}" file`);
    }
  });
}

/**
 * Interactive entry point
 */
export async function upgradeConfig() {
  const configFiles = readConfigFiles(CONFIG_DIRNAME, '{application,env-*}.{yaml,json}');

  title('The following files might be overridden by the update:');
  blankLine();
  info(PROJECT_FILE_PATHNAME);
  configFiles.forEach(([pathname, _]) => info(pathname));
  info(LOAD_CONFIG_PATHNAME);
  blankLine();

  // check @soundworks/core version in package.json
  const pkg = JSON.parse(fs.readFileSync('package.json').toString());
  const coreVersion = pkg.dependencies['@soundworks/core'];

  const { confirm } = await prompts([
    {
      type: 'toggle',
      name: 'confirm',
      message: 'Confirm?',
      initial: true,
      active: 'yes',
      inactive: 'no',
    },
  ], { onCancel });

  // upgrade config files
  if (confirm) {
    await _ensureDefaultEnvConfigFile(CONFIG_DIRNAME);
    await _upgradeFromJsonToYaml(CONFIG_DIRNAME, PROJECT_FILE_PATHNAME);
    await _overrideLoadConfig(LOAD_CONFIG_PATHNAME);
    await _upgradeCreateVersionInProjectFile(PROJECT_FILE_PATHNAME);

    if (compareVersions(coreVersion, '4.0.0-alpha.29', '>')) {
      _upgradeClientDescriptionTargetToRuntime(CONFIG_DIRNAME);
      _upgradeServerEnvConfigSubpathToBaseUrl(CONFIG_DIRNAME);
    }
  }

  blankLine();
  title(`Once you are sure your application starts as expected, you can safely delete the backup files`);
}
