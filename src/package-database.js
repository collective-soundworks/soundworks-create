const generalDocumentation = {
  'soundworks general documentation': {
    doc: 'https://soundworks.dev',
  },
  'soundworks API': {
    doc: 'https://soundworks.dev/api',
  },
};

const plugins = {
  '@soundworks/plugin-platform-init': {
    doc: 'https://soundworks.dev/plugins/platform-init.html',
  },
  '@soundworks/plugin-sync': {
    doc: 'https://soundworks.dev/plugins/sync.html',
  },
  '@soundworks/plugin-filesystem': {
    doc: 'https://soundworks.dev/plugins/filesystem.html',
  },
  '@soundworks/plugin-scripting': {
    doc: 'https://soundworks.dev/plugins/scripting.html',
  },
  '@soundworks/plugin-checkin': {
    doc: 'https://soundworks.dev/plugins/checkin.html',
  },
  '@soundworks/plugin-position': {
    doc: 'https://soundworks.dev/plugins/position.html',
  },
  '@soundworks/plugin-logger': {
    doc: 'https://soundworks.dev/plugins/logger.html',
  },
};

const libraries = {
  '@ircam/sc-components': {
    doc: 'https://ircam-ismm.github.io/sc-components/',
  },
  '@ircam/sc-scheduling': {
    doc: 'https://github.com/ircam-ismm/sc-scheduling',
  },
  '@ircam/sc-utils': {
    doc: 'https://github.com/ircam-ismm/sc-utils',
  },
  'node-web-audio-api': {
    doc: 'https://github.com/ircam-ismm/node-web-audio-api',
  },
};

const database = {
  generalDocumentation,
  plugins,
  libraries,
};

export function writeDatabase(type, values, override = false) {
  if (override === false) {
    database[type] = Object.assign(database[type], values);
  } else {
    database[type] = values;
  }
}

export function readDatabase(type) {
  return database[type];
}
