export default {
  name: 'js',
  description: 'Minimal JavaScript template',
  clients: [
    {
      runtime: 'browser',
      name: 'default',
      description: '',
      pathname: 'src/clients/browser-default.js',
    },
    {
      runtime: 'browser',
      name: 'controller',
      description: '',
      pathname: 'src/clients/browser-controller.js',
    },
    {
      runtime: 'node',
      name: 'default',
      description: '',
      pathname: 'src/clients/node-default.js',
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
