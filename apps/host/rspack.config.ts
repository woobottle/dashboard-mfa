import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';


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
    isDev && new ReactRefreshPlugin(),
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        metrics: 'metrics@http://localhost:3001/mf-manifest.json',
        users: 'users@http://localhost:3002/mf-manifest.json',
      },
    }),
  ].filter(Boolean) as any,
  devServer: {
    port: PORT,
    historyApiFallback: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
});
