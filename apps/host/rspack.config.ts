import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = 3000;

export default defineConfig({
  context: __dirname,
  mode: isDev ? 'development' : 'production',
  entry: { main: './src/index.tsx' },
  output: {
    publicPath: 'auto',
    uniqueName: 'host',
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
    new rspack.HtmlRspackPlugin({ template: './src/index.html' }),
    process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
    isDev && new ReactRefreshPlugin(),
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        metrics: 'metrics@http://localhost:3001/mf-manifest.json',
        users: 'users@http://localhost:3002/mf-manifest.json',
      },
      shared: {
        // strictVersion을 키지 않으면 버전이 달라도 에러가 나지 않는다 / true로 값을 줄경우 metric에서 18.2.0으로 설정했는데 18.3.1로 들어왔다고 에러를 뱉음
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        'react-router-dom': { singleton: true, requiredVersion: false },
        '@dashboard/shared-ui': { singleton: true },
        '@dashboard/shared-api': { singleton: true },
        '@dashboard/shared-store': { singleton: true },
        "@tanstack/react-query": { singleton: true, requiredVersion: false }
      },
      runtimePlugins: [
        path.resolve(__dirname, './enhanced-offline-fallback-plugin.ts'),
        path.resolve(__dirname, './runtime-plugin.ts'),
        path.resolve(__dirname, './retry-plugin.ts')
      ],
    }),
  ].filter(Boolean) as any,
  devServer: {
    port: PORT,
    historyApiFallback: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
});
