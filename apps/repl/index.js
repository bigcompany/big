var big = require('../../index');
var repl = require('resource-repl').repl;
var resource = require('resource');

module['exports'] = function website (opts) {
  opts = opts || {};
  opts.port = opts.port || 8888;
  big.start(opts, function(err, app){
    repl.start({ context: resource });
  });
  return big;
};

