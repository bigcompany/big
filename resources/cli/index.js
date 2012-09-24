var resource = require('resource'),
    cli = resource.define('cli');


cli.started = false;

cli.method('start', start, {
  "description": "starts the big command line interface"
});

function start () {
  console.log('welcome to big');

  //
  // Don't allow a user to use the cli to call it's own start method
  //
  if(cli.started) {
    console.log('it looks like you are trying to start the cli inside the cli');
    console.log("i can't allow you to do that");
    process.exit();
  }
  //
  // TODO: ascii art here
  //
  cli.started = true;
  var commandful = require('big-command');
  var _cli = commandful.createRouter(resource.resources);
  _cli.route();

};

exports.cli = cli;

