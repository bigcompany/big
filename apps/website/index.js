var big = require('../../index');
var http = require('resource-http');
var mesh = require('resource-mesh');
var debug = require('debug')('big::website');

module['exports'] = function website (opts, cb) {
  opts = opts || {};
  opts.port = opts.port || 8888;
  big.start(opts, function(err, server){
      var site = opts.site || {};
      site.port = site.port || 9999;
      site.root = site.root || process.cwd();
      site.view = site.view || process.cwd() + "/view";
      site.domain = site.domain || "dev.marak.com";

      http.listen(site, function(err, httpServer){
        if (err) {
          throw err;
        }
        debug('Started');
        var addr = httpServer.server.address();

        mesh.emitter.on('hello', function (data) {
          console.log('hello', data)
        });
        big.app = httpServer;
        // after the http static server has started,
        // emit an event on the mesh registering it if a loadbalancer is available
        mesh.emitter.emit('loadbalancer::addSite', {
          domain: site.domain,
          host: addr.address,
          port: addr.port
        });
        cb(null, httpServer);
      });

  });
  return big;
};