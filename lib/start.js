var mesh = require('resource-mesh').mesh;
var http = require('resource-http');
var debug = require('debug')('big::start');

module['exports'] = function (opts, callback) {
  opts = opts || {};

  mesh.start(opts, function(err){
    if(err) {
      throw err;
    }
    debug('Node has connected to the mesh');
    callback(null);
  });

};