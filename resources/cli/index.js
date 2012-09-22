var resource = require('resource'),
    cli = resource.define('cli');

cli.method('start', start, {
  "description": "starts the big command line interface"
});

function start () {
  console.log('welcome to big');
  //
  // TODO: ascii art here
  //
  var commandful = require('big-command');
  var _cli = commandful.createRouter(resource.resources);
  _cli.route();
};

exports.cli = cli;

