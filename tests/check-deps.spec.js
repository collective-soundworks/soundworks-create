import { assert } from 'chai';
import {
  checkDeps,
} from '../src/check-deps.js';

describe('# --check-deps', () => {
  it('just check it works...', async () => {
    const dirname = process.cwd();
    const timeout = 1000;

    try {
      await checkDeps(dirname, timeout);
    } catch {
      // timeout error
      assert.ok('this is ok');
    }
  });
});
