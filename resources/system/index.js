var resource = require('resource'),
    system = resource.define('system');

system.method('info', info);

function info () {

  var os  = require('os');

  var obj = {};

  obj.name     = "big";
  obj.version  = "v0.0.0";

  obj.system = {
    platform: os.platform(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    cpus: os.cpus(),
    networkInterfaces: os.networkInterfaces()
  };

  return obj;

};

exports.system = system;