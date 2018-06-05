import * as slsw from 'serverless-webpack';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  entry: slsw.lib.entries,
  target: 'node',
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      }
    ]
  },
  externals: /^(aws-sdk(\/.+)?|\$)$/i
};

module.exports = config;
