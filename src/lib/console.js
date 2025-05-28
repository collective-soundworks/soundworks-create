import chalk from 'chalk';
import { getSelfVersion } from './utils.js';
// console
export function title(msg) {
  console.log(chalk.cyan(`# ${msg}`));
}

export function subtitle(msg) {
  console.log(chalk.grey(`> ${msg}`));
}

export function success(msg) {
  console.log(chalk.green(`+ ${msg}`));
}

export function warn(msg) {
  console.log(chalk.yellow(`+ ${msg}`));
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
${chalk.gray(`[@soundworks/create#v${version}]`)}

${chalk.yellow('> welcome to soundworks')}

- documentation: ${chalk.cyan('https://soundworks.dev')}
- issues: ${chalk.cyan('https://github.com/collective-soundworks/soundworks/issues')}
  `;

  console.log(promptHeader);
}
