var big = require('big'),
    cli = big.define('cli');

cli.method('start', start);

function start () {
  console.log('welcome to big');
  // TODO: ascii art here
};

exports.cli = cli;

//
// TODO: Reflect command line interface with commandful based on big.resources
// var commandful = require('commandful');
// var cli = commandful.createRouter(big);

