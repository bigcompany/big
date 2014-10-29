var big = require('../../index');

var debug = require('debug')('big::load-balancer');

var loadbalancer = big.define('loadbalancer');
var http = require('http'),
    httpProxy = require('http-proxy');

var proxyTable = {};

// expose loadbalancer methods as remote


loadbalancer.remote = true;

loadbalancer.method('addSite', function(options){
  debug('added site to load balancer');
  proxyTable[options.domain] = options;
});

var mesh = require('resource-mesh');

module['exports'] = function loadBalancer (opts) {

  big.start({ port: 8888 }, function(){
    debug('Started');

    /*
    mesh.emitter.on('loadbalancer::addSite', function (opts) {
      proxyTable[opts.domain] = opts;
      
      console.log("ADDING SITE");
    })
    */
    console.log(big.resource.eventTable)

    var proxy = new httpProxy.createProxyServer();
    http.createServer(function (req, res) {
      var host = req.headers.host.split(":");
      host = host[0];
      debug(host, proxyTable);

      if (typeof proxyTable[host] !== "undefined") {
        var target = "http://" + proxyTable[host].host + ":" + proxyTable[host].port;
        proxy.web(req, res, {
          target: target
        });
      } else {
        res.end('invalid proxy target: ' + host);
      }

    }).listen(7777);

    debug('Load balancer started at 7777');

  });
  return big;
};

