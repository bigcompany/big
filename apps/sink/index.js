var big = require('../../index');

var debug = require('debug')('big::sink');

var http = require('resource-http');
var mesh = require('resource-mesh');

module['exports'] = function sink (opts) {
  opts = opts || {};
  opts.port = opts.port || 8888;
  opts.site = opts.site || {};
  opts.site.root = opts.site.root || __dirname + "/public";
  big.start(opts, function(err, app){

    // start static http server
    http.listen({ 
      port: 9998,
      root: opts.root
    }, function(err, app) {

      if (err) {
        throw err;
      }

      var addr = app.server.address();
      
      // on any event, emit it as JSON to STDOUT for logging streams to capture
      mesh.emitter.onAny(function(data){
        debug(JSON.stringify({ event: this.event, data: data }) + '\n')
      });
    });

  });
  return big;
};

