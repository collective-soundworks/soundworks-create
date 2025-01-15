import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { assert } from 'chai';

import {
  ejectLauncher
} from '../src/eject-launcher.js';

describe('# --eject-launcher', () => {
  const tmpDir = path.join('tests', 'tmp');
  const srcDir = path.join(tmpDir, 'node_modules', '@soundworks', 'helpers', 'browser-client');

  beforeEach(function() {
    console.log('Prepare fixures - Install @soundworks/helpers in', tmpDir);

    this.timeout(20 * 1000);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test-eject-launcher',
    }))
    execSync('npm install @soundworks/helpers', { cwd: tmpDir, stdio: 'inherit' });
  });

  afterEach(() => {
    console.log('Clean fixtures')
    fs.rmSync(tmpDir, { force: true, recursive: true });
  });

  it('should exit gracefully if target directory exists and non empty', async () => {
    const distDir = path.join(tmpDir, 'should-exit');
    fs.mkdirSync(distDir);
    fs.writeFileSync(path.join(distDir, 'non-empty'), 'coucou');

    await ejectLauncher(srcDir, [
      distDir,
    ]);

    assert.ok('this works');
  });

  it('just check it works...', async () => {
    const distDir = path.join(tmpDir, 'output');

    await ejectLauncher(srcDir, [
      distDir,
      true,
    ]);

    assert.isTrue(fs.existsSync(distDir));
    assert.isTrue(fs.readdirSync(distDir).length > 0);

    assert.ok('this works');
  });
});
