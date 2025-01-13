import chalk from 'chalk';
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
