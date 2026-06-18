import fs from 'node:fs';
import path from 'node:path';

import { assert } from 'chai';

import {
  readDir,
  copyDir,
  ignoreFiles,
} from '../src/lib/utils.js';

describe('# Utils', () => {
  it('## readDir', async () => {
    const src = path.join('tests', 'utils-fixtures', 'copy-dir-src');
    const result = readDir(src, ignoreFiles);
    const expected = [
      'tests/utils-fixtures/copy-dir-src/b.js',
      'tests/utils-fixtures/copy-dir-src/a/a.txt'
    ];

    assert.deepEqual(await result, expected);
  });

  it('## copyDir (relative paths)', async () => {
    const src = path.join('tests', 'utils-fixtures', 'copy-dir-src');
    const dest = path.join('tests', 'utils-fixtures', 'copy-dir-dest');

    await copyDir(src, dest);

    const result = fs.readdirSync(dest, { recursive: true });
    fs.rmSync(dest, { recursive: true });

    assert.deepEqual(result, ['a', 'b.js', 'a/a.txt']);
  });

  it('## copyDir (absolute paths)', async () => {
    const src = path.join(process.cwd(), 'tests', 'utils-fixtures', 'copy-dir-src');
    const dest = path.join(process.cwd(), 'tests', 'utils-fixtures', 'copy-dir-dest');

    await copyDir(src, dest);

    const result = fs.readdirSync(dest, { recursive: true });
    fs.rmSync(dest, { recursive: true });

    assert.deepEqual(result, ['a', 'b.js', 'a/a.txt']);
  });
});
