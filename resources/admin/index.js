var big  = require('big'),
    admin = big.define('admin');


admin.method('start', start);

function start (options, callback) {
  var connect = require('connect');
  var auth = connect.basicAuth('admin', 'admin'); 
  big.http.app.get('/admin', auth, function (req, res, next) {
    res.end(JSON.stringify(dashboard(), true, 2));
  });
}

exports.admin = admin;

exports.dependencies = {
  "connect": "*"
};

// generates JSON-data to be sent to dashboard view
function dashboard () {

  var big = require('big'),
      os  = require('os'),
      obj = {};

  obj.name     = "big";
  obj.version  = "v0.0.0";
  obj.platform = os.platform();
  obj.uptime   = os.uptime();
  obj.loadavg  = os.loadavg();
  obj.totalmem = os.totalmem();
  obj.cpus     = os.cpus();

  obj.networkInterfaces = os.networkInterfaces();

  obj.resources = [];

  for(var r in big.resource.resources) {
    obj.resources.push(r);
  }

  return obj;

};