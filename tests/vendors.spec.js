import { assert } from 'chai';
import semverGt from 'semver/functions/gt.js';

describe('# semver', () => {
  it('should do the job', () => {
    assert.isFalse(semverGt('3.17.45', '4.0.0-alpha.29'));
    assert.isFalse(semverGt('4.0.0-alpha.28', '4.0.0-alpha.29'));
    assert.isTrue(semverGt('4.0.0-alpha.30', '4.0.0-alpha.29'));
    assert.isTrue(semverGt('4.0.0-beta.1', '4.0.0-alpha.29'));
    assert.isTrue(semverGt('5.0.0', '4.0.0-alpha.29'));
  });
});
