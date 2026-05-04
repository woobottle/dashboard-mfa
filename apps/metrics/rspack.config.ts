import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = 3001;

export default defineConfig({
  context: __dirname,
  mode: isDev ? 'development' : 'production',
  entry: { main: './src/index.tsx' },
  output: {
    publicPath: 'auto',
    uniqueName: 'metrics',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
      },
    ],
  },
  plugins: [
    process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
    new ModuleFederationPlugin({
      name: 'metrics',
      filename: 'remoteEntry.js',
      exposes: {
        './MetricsDashboard': './src/MetricsDashboard.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        '@dashboard/shared-ui': { singleton: true },
        '@dashboard/shared-api': { singleton: true }
      },
    }),
    new rspack.HtmlRspackPlugin({ template: './src/index.html' }),
    isDev && new ReactRefreshPlugin(),
  ].filter(Boolean) as any,
  devServer: {
    port: PORT,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
});
