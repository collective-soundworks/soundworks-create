import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { assert } from 'chai';

import {
  installPlugins,
  installLibs,
} from '../src/package-installer.js';

describe('# packageInstaller', () => {
  const tmpDir = path.join('tests', 'tmp');

  beforeEach(function() {
    this.timeout(20 * 1000);
    console.log('Prepare fixures - Install @soundworks/helpers in', tmpDir);

    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test-package-installer',
      dependencies: {},
    }));
  });

  afterEach(() => {
    console.log('Clean fixtures');
    fs.rmSync(tmpDir, { force: true, recursive: true });
  });

  it('--install-plugins', async function() {
    this.timeout(20 * 1000);

    const toInstall = [
      '@soundworks/plugin-platform-init',
      '@soundworks/plugin-sync',
    ];

    await installPlugins(tmpDir, [
      toInstall,
      true,
    ]);

    toInstall.forEach(plugin => {
      const pathname = path.join(tmpDir, 'node_modules', plugin);
      assert.isTrue(fs.existsSync(pathname));
    });
  });

  it('--install-libs', async function() {
    this.timeout(20 * 1000);

    const toInstall = [
      '@ircam/sc-components',
      'node-web-audio-api',
    ];

    await installLibs(tmpDir, [
      toInstall,
      true,
    ]);

    toInstall.forEach(plugin => {
      const pathname = path.join(tmpDir, 'node_modules', plugin);
      assert.isTrue(fs.existsSync(pathname));
    });
  });

  // it('just check it works...', async () => {
  //   const distDir = path.join(tmpDir, 'output');

  //   await ejectLauncher(srcDir, [
  //     distDir,
  //     true,
  //   ]);

  //   assert.isTrue(fs.existsSync(distDir));
  //   assert.isTrue(fs.readdirSync(distDir).length > 0);

  //   assert.ok('this works');
  // });
});
