import path from 'node:path';
import os from 'node:os';

import prompts from 'prompts';

const homeDirectory = os.homedir();
const tildeCode = 126;

export async function getTargetDirectory({
  message = 'Where should we create your project?',
  targetDir = '.',
} = {}) {
  if (targetDir === '.') {
    const result = await prompts([
      {
        type: 'text',
        name: 'dir',
        message: `${message} (leave blank to use current directory)`,
      },
    ]);

    // do not allow directory only composed of white spaces
    if (result.dir.trim().length > 0) {
      targetDir = result.dir;
    }
  }

  // remove leading and trailing spaces, occurs when drag n drop from Finder
  targetDir = targetDir.trim();
  // expand tilde
  if (targetDir.charCodeAt(0) === tildeCode) {
    targetDir = path.join(homeDirectory, targetDir.slice(1));
  }

  targetDir = path.isAbsolute(targetDir)
    ? path.normalize(targetDir)
    : path.normalize(path.join(process.cwd(), targetDir));

  return targetDir;
}
