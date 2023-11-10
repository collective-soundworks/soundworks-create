// You can extend / override the default babel config provided by @soundworks/build
// to match you own needs using this function.
// Be aware that the changes made here will apply both to node (server or clients)
// files, and to browser clients bundles created by webpack.
//
// If you want to only apply some plugins and presets to the webpack bundles and
// not to the node processes files (which generally do not need this), you should
// apply the changes to the `babel-loader` plugin in the `webpack.config.js` file
export default function(api) {
  api.cache(true);

  const presets = [];
  const plugins = [];

  return {
    presets,
    plugins,
  };
}
