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
    },
  ],
};
