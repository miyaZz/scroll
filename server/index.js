var path = require('path');
var express = require('express');
var webpack = require('webpack');
var config = require('../internals/webpack/config.dev');

var app = express();
var compiler = webpack(config);

if(process.env.NODE_ENV === 'development') {
  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}

app.use('/build', express.static('build'));

app.get('*', function(req, res) {
  res.sendFile(path.resolve('examples/index.html'));
});

app.listen(4001, function(err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Listening at http://localhost:4001');
});