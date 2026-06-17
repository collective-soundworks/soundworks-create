import {
  styleText,
} from 'node:util';

import {
  getSelfVersion,
} from './utils.js';


export function title(msg) {
  console.log(styleText('cyan', `# ${msg}`));
}

export function subtitle(msg) {
  console.log(styleText('grey', `> ${msg}`));
}

export function success(msg) {
  console.log(styleText('green', `+ ${msg}`));
}

export function warn(msg) {
  console.log(styleText('yellow', `+ ${msg}`));
}

export function info(msg, indent = 0) {
  const prefix = Array(indent).fill(' ').join('');
  console.log(`${prefix}- ${msg}`);
}

export function blankLine() {
  console.log('');
}

export function header() {
  const version = getSelfVersion();
  const promptHeader = `\
${styleText('gray', `[@soundworks/create#v${version}]`)}

${styleText('yellow', '> welcome to soundworks')}

- documentation: ${styleText('cyan', 'https://soundworks.dev')}
- issues: ${styleText('cyan', 'https://github.com/collective-soundworks/soundworks/issues')}
  `;

  console.log(promptHeader);
}
