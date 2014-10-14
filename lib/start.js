var mesh = require('resource-mesh');
var http = require('resource-http');
var debug = require('debug')('big::start');

module['exports'] = function (opts, callback) {
  opts = opts || {};
  mesh.start(opts, function(err, server){
    if(err) {
      throw err;
    }
    debug('Big has started');
    callback(null, server);
  });
};