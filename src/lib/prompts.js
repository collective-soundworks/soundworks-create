import path from 'node:path';

import expandTilde from 'expand-tilde';
import prompts from 'prompts';

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

    if (result.dir) {
      targetDir = result.dir;
    }
  }

  // remove leading and trailing spaces, occurs when drag n drop from Finder
  targetDir = targetDir.trim();
  targetDir = expandTilde(targetDir);

  targetDir = path.isAbsolute(targetDir)
    ? path.normalize(targetDir)
    : path.normalize(path.join(process.cwd(), targetDir));

  return targetDir;
}
