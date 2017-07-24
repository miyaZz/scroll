var webpack = require('webpack');
var path = require('path');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var baseWebpackConfig = require('./config.base.js');
var pkg = require(path.resolve(process.cwd(), 'package.json'));
var fs = require('fs');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var plugins = [
];

module.exports = baseWebpackConfig({
  entry: [
    path.resolve(process.cwd(), 'examples/main.js')
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js'
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

  plugins: plugins,
  performance: {
    assetFilter: assetFilename => !(/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename))
  }
});

