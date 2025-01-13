import path from 'node:path';
import { fileURLToPath } from 'node:url';

// actaul location of the wizard
export const WIZARD_DIRNAME = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

// constants of the template projects
export const PROJECT_FILE_PATHNAME = '.soundworks';
export const CONFIG_DIRNAME = 'config';
export const LOAD_CONFIG_PATHNAME = path.join('src', 'utils', 'load-config.js');
