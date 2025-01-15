import { assert } from 'chai';
import {
  findDoc
} from '../src/find-doc.js';

describe('# --find-doc', () => {
  it('just check it works...', async () => {
    await findDoc([false]);
  });
});
