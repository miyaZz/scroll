'use strict';
const path = require('path');
const webpack = require('webpack');
var autoprefixer = require('autoprefixer');

module.exports = options => {
  let rules = [];
  if(options.module && options.module.rules) {
    rules = options.module.rules;
  }
  return {
    entry: options.entry,
    output: Object.assign({
      path: path.resolve(process.cwd(), 'build'),
      publicPath: '/build/'
    }, options.output), // Merge with env dependent settings
    module: {
      rules: rules.concat([
        {
          test: /\.js$/,
          include: [path.resolve(process.cwd(), 'examples'), path.resolve(process.cwd(), 'src')],
          use: {
            loader: 'babel-loader',
            options: options.babelQuery
          }
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: 'file-loader'
        },
        {
          test: /\.(jpe?g|png|gif)$/,
          use: [
            {loader: 'file-loader'},
            {
              loader: 'image-webpack-loader',
              options: {
                progressive: true,
                optimizationLevel: 7,
                interlaced: false,
                pngquant: {
                  quality: '65-90',
                  speed: 4
                }
              }
            }
          ]
        },
        {
          test: /\.html$/,
          use: 'html-loader'
        },
        {
          test: /\.(mp4|webm)$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }
        }
      ])
    },
    plugins: options.plugins.concat([
      new webpack.ProvidePlugin({
        _: 'lodash'
      }),

      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        }
      }),
      new webpack.NamedModulesPlugin(),
      new webpack.LoaderOptionsPlugin({
        options: {
          postcss: [
            autoprefixer({
              browsers: [
                '>1%',
                'last 4 versions',
                'Firefox ESR',
                'not ie < 9' // React doesn't support IE8 anyway
              ]
            })
          ]
        }
      })
    ]),
    resolve: {
      modules: ['node_modules'],
      extensions: ['.js', '.jsx', '.less'],
    },
    externals: ['ws', 'fs'],
    node: {
      fs: "empty"
    },
    devtool: options.devtool,
    target: 'web',
    performance: options.performance || {}
  };
};
