import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig } from '@soundworks/helpers/node.js';
import Max from 'max-api';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Warning: This client is meant to run within a Max node.script object
 * - https://docs.cycling74.com/reference/node.script/
 * - https://docs.cycling74.com/apiref/nodeformax/
 */

const ENV = 'default';
const config = loadConfig(ENV, import.meta.url);
const client = new Client(config);

// Eventually register plugins
// client.pluginManager.register('my-plugin', plugin);

await client.start();

console.log(`Hello ${client.config.app.name}!`);

Max.addHandler('hello', () => Max.outlet('world'));
