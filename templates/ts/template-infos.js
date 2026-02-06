import path from 'node:path';
import fs from 'node:fs';

import compile from 'template-literal';

import { getTargetDirectory } from '../../src/lib/prompts.js';
import { blankLine, success } from '../../src/lib/console.js';

export default {
  name: 'ts',
  description: 'Minimal TypeScript template',
  clients: [
    {
      runtime: 'browser',
      name: 'default',
      description: '',
      pathname: 'src/clients/browser-default.ts',
    },
    {
      runtime: 'browser',
      name: 'controller',
      description: '',
      pathname: 'src/clients/browser-controller.ts',
    },
    {
      runtime: 'node',
      name: 'default',
      description: '',
      pathname: 'src/clients/node-default.ts',
    },
    {
      runtime: 'node',
      name: 'max',
      description: 'max `node.script`',
      pathname: 'src/clients/node-max.js',
      assets: 'src/clients/node-max-assets',
      postCreateHook: async (clientName, appDirname, srcPathname, destPathname) => {
        blankLine();
        console.log(clientName, srcPathname, destPathname);
        const maxTargetDirectory = await getTargetDirectory({
          message: 'Where should we create your Max patch?',
        });

        fs.mkdirSync(maxTargetDirectory, { recursive: true });

        const srcDirname = path.dirname(srcPathname);
        const samplePatchPathname = path.join(srcDirname, 'node-max-assets', `node-max-host.maxpat`);
        const sampleProxyPathname = path.join(srcDirname, 'node-max-assets',`node-max-proxy.js`);
        const patchDestFilename = `node-${clientName}.maxpat`;
        const proxyDestFilename = `node-${clientName}.js`;

        // inject proxyDestFilename into sample patch template
        const patchTemplate = compile(fs.readFileSync(samplePatchPathname));
        const patchContent = patchTemplate({ proxyDestFilename });
        fs.writeFileSync(path.join(maxTargetDirectory, patchDestFilename), patchContent);

        // inject "real" cwd and client file path in proxy
        const proxyTemplate = compile(fs.readFileSync(sampleProxyPathname));
        // relative path from max directory to application cwd
        const relCwd = path.relative(maxTargetDirectory, appDirname);
        // relative path from max directory to "real" client file
        const relClientPathname = path.relative(maxTargetDirectory, destPathname);
        const proxyContent = proxyTemplate({ relCwd, relClientPathname });
        fs.writeFileSync(path.join(maxTargetDirectory, proxyDestFilename), proxyContent);

        success(`Max patch and JS proxy successfully created in "${path.relative(appDirname, maxTargetDirectory)}"`);
      },
    },
  ],
};
