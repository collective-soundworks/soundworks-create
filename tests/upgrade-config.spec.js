import path from 'node:path';
import fs from 'node:fs';

import { assert } from 'chai';
import YAML from 'yaml';

import {
  _upgradeCreateVersionInProjectFile,
  _upgradeFromJsonToYaml,
  _ensureDefaultEnvConfigFile,
  _overrideLoadConfig,
  _upgradeClientDescriptionTargetToRuntime,
} from '../src/upgrade-config.js';

const fixturesDir = path.join('tests', 'upgrade-config-fixtures');
const testDirname = path.join('tests', 'tmp');

describe('# --upgrade-config', () => {
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

  describe('## _upgradeCreateVersionInProjectFile', () => {
    it(`should do nothing if 'load-config.js' file not found`, async () => {
      console.log('+ Prepare fixtures');

      const testProjectPathname = path.join(testDirname, '.soundworks');

      try {
        await _upgradeCreateVersionInProjectFile(testProjectPathname);
      } catch (err) {
        console.log(err);
        assert.fail(err.message);
      }

      assert.isTrue(fs.existsSync(testProjectPathname));
      // do nothing
    });
  });

  describe('## From JSON to YAML', () => {
    const expectedEnv = {
      type: 'development',
      port: 8000,
      subpath: '',
      serverAddress: '',
      useHttps: false,
      httpsInfos: {
        cert: null,
        key: null,
      },
      auth: {
        clients: [],
        login: '',
        password: '',
      },
    };

    const expectedApp = {
      name: 'test-upgrade-config',
      author: '',
      clients: {
        player: {
          target: 'browser',
          default: true,
        },
      },
    }

    const cases = {
      'from-json': {
        inputFiles: ['application.json', 'env-default.json'],
        outputFiles: ['application.yaml', 'env-default.yaml'],
      },
      'from-json-multiple-env': {
        inputFiles: ['application.json', 'env-default.json', 'env-test.json'],
        outputFiles: ['application.yaml', 'env-default.yaml', 'env-test.yaml'],
      },
      'from-json-no-default': {
        inputFiles: ['application.json'],
        outputFiles: ['application.yaml', 'env-default.yaml'],
      },
      'from-yaml': {
        inputFiles: ['application.yaml', 'env-default.yaml'],
        outputFiles: ['application.yaml', 'env-default.yaml'],
      },
    };

    for (let name in cases) {
      it(`should support converting ${name}`, async () => {
        const { inputFiles, outputFiles } = cases[name];
        const inputDirname = path.join(fixturesDir, name);
        const testProjectPathname = path.join(testDirname, '.soundworks');

        console.log('+ Prepare fixtures');

        try {
          fs.mkdirSync(testDirname, { recursive: true });
        } catch (err) {
          console.log(err.message);
        }

        // copy fixture files into temp dir
        inputFiles.forEach(filename => {
          const src = path.join(inputDirname, filename);
          const dest = path.join(testDirname, filename);
          fs.copyFileSync(src, dest);
        });

        try {
          await _upgradeFromJsonToYaml(testDirname, testProjectPathname);
          await _ensureDefaultEnvConfigFile(testDirname);
        } catch (err) {
          console.log(err);
          assert.fail(err.message);
        }

        outputFiles.forEach(filename => {
          const content = YAML.parse(fs.readFileSync(path.join(testDirname, filename)).toString());

          if (filename.endsWith('application.yaml')) {
            assert.deepEqual(content, expectedApp);
          } else {
            assert.deepEqual(content, expectedEnv);
          }
        });
      });
    }
  });

  describe('## _overrideLoadConfig', () => {
    it(`should do nothing if 'load-config.js' file not found`, async () => {
      console.log('+ Prepare fixtures');

      const loadConfigPathname = path.join(testDirname, 'load-config.js');
      try {
        await _overrideLoadConfig(loadConfigPathname);
      } catch (err) {
        console.log(err);
        assert.fail(err.message);
      }

      assert.isFalse(fs.existsSync(loadConfigPathname));
      // do nothing
    });

    it(`should override with helpers if 'load-config.js' file is found`, async () => {
      console.log('+ Prepare fixtures');

      const loadConfigPathname = path.join(testDirname, 'load-config.js');
      fs.writeFileSync(loadConfigPathname, 'coucou');

      try {
        await _overrideLoadConfig(loadConfigPathname);
      } catch (err) {
        console.log(err);
        assert.fail(err.message);
      }

      assert.isTrue(fs.existsSync(loadConfigPathname));
      assert.isTrue(fs.existsSync(`${loadConfigPathname}.bak`));
      assert.isTrue(
        fs.readFileSync(loadConfigPathname)
          .toString()
          .includes(`import { loadConfig as helpersLoadConfig } from '@soundworks/helpers/node.js';`)
      );
    });
  });

  describe('## _upgradeClientDescriptionTargetToRuntime', () => {
    it('should replace ClientDescription#target to ClientDescription#runtime in application.yaml file', async () => {
      console.log('+ Prepare fixtures');

      const src = path.join(fixturesDir, 'target-to-runtime', 'application.yaml');
      const dest = path.join(testDirname, 'application.yaml');
      fs.copyFileSync(src, dest);

      try {
        await _upgradeClientDescriptionTargetToRuntime(testDirname);
      } catch (err) {
        console.log(err);
        assert.fail(err.message);
      }

      const expectedApp = {
        name: 'test-upgrade-config',
        author: '',
        clients: {
          player: {
            runtime: 'browser',
            default: true,
          },
        },
      }

      const result = YAML.parse(fs.readFileSync(dest).toString());
      assert.deepEqual(result, expectedApp);
    });
  });
});

