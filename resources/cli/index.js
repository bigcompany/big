var big = require('big'),
    cli = big.define('cli');

cli.method('start', start, {
  "description": "starts the big command line interface"
});

function start () {
  console.log('welcome to big');
  //
  // TODO: ascii art here
  //
  var commandful = require('big-command');
  var _cli = commandful.createRouter(big.resource.resources);
};

exports.cli = cli;

