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

module['exports'] = function loadBalancer (opts) {

  big.start({ port: 8888 }, function(){

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

  });
  return big;
};

