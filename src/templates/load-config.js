// file overriden by @soundworks/create wizard
import { loadConfig as helpersLoadConfig } from '@soundworks/helpers/node.js';

export function loadConfig(ENV = 'default', callerURL = null) {
  return helpersLoadConfig(ENV, callerURL);
}
