var big = require('../../index');
var http = require('resource-http');
var mesh = require('resource-mesh').mesh;
var debug = require('debug')('big::website');

module['exports'] = function website (opts, cb) {
  opts = opts || {};
  opts.port = opts.port || 8888;
  opts.site = opts.site || {};
  opts.site.port = opts.site.port || 9999;
  opts.site.root = opts.site.root || __dirname + "/public";
  
  big.start(opts, function(err, app){
    // start static http server
    http.listen({ 
      port: opts.site.port,
      root: opts.site.root,
      view: opts.site.view
    }, function(err, app) {
      if (err) {
        throw err;
      }
      // after the http static server has started,
      // emit an event on the mesh registering it if a loadbalancer is available
      var addr = app.server.address();
      debug('started');
      
      mesh.emitter.emit('loadbalancer::addSite', {
        domain: "dev.marak.com",
        host: addr.address,
        port: addr.port
      });

      cb(null, app);
    });

  });
  return big;
};