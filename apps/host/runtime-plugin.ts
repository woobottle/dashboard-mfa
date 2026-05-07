import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const runtimePlugin: () => ModuleFederationRuntimePlugin = function () {
  return {
    name: 'my-runtime-plugin',
    errorLoadRemote(args) {
      const { lifecycle, id, error } = args
      switch (lifecycle) {
        case 'afterResolve':
          return {
            id: id || 'fallback',
            name: id || 'fallback',
            metaData: {
              name: "users",
              type: "app",
              buildInfo: {
                buildVersion: "0.1.0",
                buildName: "@dashboard/users"
              },
              remoteEntry: {
                name: "remoteEntry.js",
                path: "",
                type: "global"
              },
              types: {
                path: "",
                name: "",
                zip: "@mf-types.zip",
                api: "@mf-types.d.ts"
              },
              globalName: "users",
              pluginVersion: "2.3.3",
              prefetchInterface: false,
              publicPath: "auto"
            },
            shared: [],
            remotes: [],
            exposes: []
          };
        case 'beforeLoadShare':
          return () => ({
            default: {}
          });
        case 'onLoad':
          return { default: () => null };
        default:
          return import('./src/FallbackComponent');
      }
    }
  };
};
export default runtimePlugin;