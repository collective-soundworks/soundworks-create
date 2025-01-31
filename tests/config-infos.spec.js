import path from 'node:path';
import { assert } from 'chai';
import {
  configInfos,
} from '../src/config-infos.js';


describe('# --config-infos', () => {
  it('should fail gracefuly', async () => {
    const configDirname = path.join('tests', 'do-not-exists');
    // this is just logging
    await configInfos(configDirname);
    assert.ok('this is ok');
  });

  ['json', 'yaml'].forEach(format => {
    it('should properly display configuration informations', async () => {
      const configDirname = path.join('tests', 'generic-fixtures', format);
      // this is just logging
      await configInfos(configDirname);
      assert.ok('this is ok');
    });
  });
});
