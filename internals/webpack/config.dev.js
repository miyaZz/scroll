var webpack = require('webpack');
var path = require('path');
var baseWebpackConfig = require('./config.base.js');
var fs = require('fs');

module.exports = baseWebpackConfig({
  entry: [
    'webpack-hot-middleware/client?reload=true',
    path.resolve(process.cwd(), 'examples/main.js')
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'postcss-loader', `less-loader`]
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  devtool: 'source-map'
});