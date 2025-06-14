import path from 'node:path';
import { fileURLToPath } from 'node:url';

// actual location of the wizard
export const WIZARD_DIRNAME = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const TEMPLATES_DIRNAME = path.join(WIZARD_DIRNAME, 'templates');

// constants of the template projects
export const TEMPLATE_INFO_BASENAME = 'template-infos.json';
export const PROJECT_FILE_PATHNAME = '.soundworks';
export const CONFIG_DIRNAME = 'config';

// used for migration from old template
export const LOAD_CONFIG_PATHNAME = path.join('src', 'utils', 'load-config.js');
// used to eject launcher, @todo - should be cleaned somehow
export const CLIENTS_SRC_PATHNAME = path.join('src', 'clients');
export const EJECT_LAUNCHER_DEFAULT_PATHNAME = path.join('src', 'clients', 'helpers');
export const EJECT_LAUNCHER_SRC_PATHNAME = path.join('node_modules', '@soundworks', 'helpers', 'browser-client');
