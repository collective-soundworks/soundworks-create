import path from 'node:path';
import fs from 'node:fs';

import { assert } from 'chai';
import YAML from 'yaml';

import { createClient } from '../src/create-client.js';
import {
  PROJECT_FILE_PATHNAME,
} from '../src/lib/filemap.js';

const fixturesDir = path.join('tests', 'generic-fixtures');
const testDirname = path.join('tests', 'tmp');

describe('# --create-env', () => {
  beforeEach(() => {
    fs.rmSync(testDirname, { force: true, recursive: true });

    try {
      fs.mkdirSync(testDirname, { recursive: true });
    } catch (err) {
      console.log(err.message);
    }
  });

  afterEach(() => {
    fs.rmSync(testDirname, { force: true, recursive: true });
  });

  it('should fail gracefully', async () => {
    // const configDirname = path.join('tests', 'do-not-exists');
    // this is just logging
    await createClient(testDirname);
    assert.ok('this is ok');
  });

  ['json', 'yaml'].forEach(format => {
    it(`should properly create a browser client - ${format} config`, async () => {
      console.log('Prepare fixtures');

      const appConfigSrc = path.join(fixturesDir, format, `application.${format}`);
      const appConfigDst = path.join(testDirname, `application.${format}`);
      fs.copyFileSync(appConfigSrc, appConfigDst);

      const projectConfigSrc = path.join(fixturesDir, PROJECT_FILE_PATHNAME);
      const projectConfigDst = path.join(testDirname, PROJECT_FILE_PATHNAME);
      fs.copyFileSync(projectConfigSrc, projectConfigDst);

      const promptFixtures = [
        'test',
        'browser',
        'default',
        true, // mark as default
        true, // confirm
      ];

      await createClient(testDirname, '.', '.', promptFixtures);

      const appConfigExpected = {
        "name": "test-upgrade-config",
        "author": "The author",
        "clients": {
          "player": {
            "runtime": "browser"
          },
          "test": {
            "runtime": "browser",
            "default": true
          }
        }
      };

      const appConfigStr = fs.readFileSync(appConfigDst).toString();
      const appConfig = format === 'json' ? JSON.parse(appConfigStr) : YAML.parse(appConfigStr);

      assert.deepEqual(appConfig, appConfigExpected);
      assert.isTrue(fs.existsSync(path.join(testDirname, 'test.js')));
    });

    it(`should properly create a node client - ${format} config`, async () => {
      console.log('Prepare fixtures');

      const appConfigSrc = path.join(fixturesDir, format, `application.${format}`);
      const appConfigDst = path.join(testDirname, `application.${format}`);
      fs.copyFileSync(appConfigSrc, appConfigDst);

      const projectConfigSrc = path.join(fixturesDir, PROJECT_FILE_PATHNAME);
      const projectConfigDst = path.join(testDirname, PROJECT_FILE_PATHNAME);
      fs.copyFileSync(projectConfigSrc, projectConfigDst);

      const promptFixtures = [
        'test',
        'node',
        true, // confirm
      ];

      await createClient(testDirname, '.', '.', promptFixtures);

      const appConfigExpected = {
        "name": "test-upgrade-config",
        "author": "The author",
        "clients": {
          "player": {
            "runtime": "browser",
            "default": true
          },
          "test": {
            "runtime": "node",
          }
        }
      };

      const appConfigStr = fs.readFileSync(appConfigDst).toString();
      const appConfig = format === 'json' ? JSON.parse(appConfigStr) : YAML.parse(appConfigStr);

      assert.deepEqual(appConfig, appConfigExpected);
      assert.isTrue(fs.existsSync(path.join(testDirname, 'test.js')));
    });
  });
});
