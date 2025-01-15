import path from 'node:path';
import fs from 'node:fs';

import { assert } from 'chai';
import YAML from 'yaml';

import { createEnv } from '../src/create-env.js';

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

  after(() => {
    fs.rmSync(testDirname, { force: true, recursive: true });
  });

  it('should fail gracefuly', async () => {
    const configDirname = path.join('tests', 'do-not-exists');
    // this is just logging
    await createEnv(configDirname);
    assert.ok('this is ok');
  });

  ['json', 'yaml'].forEach(format => {
    it('should properly display configuration informations', async () => {
      console.log('Prepare fixtures');

      const appConfigSrc = path.join(fixturesDir, format, `application.${format}`);
      const appConfigDst = path.join(testDirname, `application.${format}`);
      fs.copyFileSync(appConfigSrc, appConfigDst);

      const promptFixtures = [
        'test',
        'production',
        8000,
        '127.0.0.1',
        false,
        '',
        false,
      ];

      await createEnv(testDirname, promptFixtures);

      const expected = {
        type: 'production',
        port: 8000,
        subpath: '',
        serverAddress: '127.0.0.1',
        useHttps: false,
        httpsInfos: { cert: null, key: null },
        auth: { clients: [], login: '', password: '' }
      };

      const content = fs.readFileSync(path.join(testDirname, `env-test.${format}`)).toString();
      const config = format === 'json' ? JSON.parse(content) : YAML.parse(content);

      assert.deepEqual(config, expected);
    });
  });
});
