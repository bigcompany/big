var resource  = require('resource'),
    admin = resource.define('admin');

resource.use('system');

admin.method('start', start);

function start (options, callback) {
  var connect = require('connect');
  var auth = connect.basicAuth('admin', 'admin');

  resource.http.app.use(connect.static(__dirname + '/public'));

  resource.http.app.get('/admin', auth, function (req, res, next) {
    res.end(JSON.stringify(dashboard(), true, 2));
  });

  resource.http.app.get('/admin/resources', auth, function (req, res, next) {
    res.end(JSON.stringify(_resources(), true, 2));
  });

  resource.http.app.get('/admin/resources/:resource', auth, function (req, res, next) {
    //
    // TODO: better view integration
    //
    var formful = require('formful');
    var r = resource.resources[req.param('resource')];
    var obj = resource.toJSON(r);
    res.end(JSON.stringify(obj, true, 2));
    return;
    var str = formful.view.form.index.render(r)
    var strr = formful.view.form.index.present({ resource: obj });
    res.end(strr);
  });

}

exports.admin = admin;

exports.dependencies = {
  "connect": "*"
};

// TODO: move this out of here to resource.toJSON
function _resources () {
  var arr = [];
  console.log(resource.resources);
  Object.keys(resource.resources).forEach(function(r){
    arr.push(r);
  });
  return arr;
}

// generates JSON-data to be sent to dashboard view
function dashboard () {

  var os  = require('os'),
      obj = {};

  obj.name     = "big";
  obj.version  = "v0.0.0";

  obj.system = resource.system.info();

  obj.resources = [];

  for(var r in resource.resources) {
    obj.resources.push(r);
  }

  return obj;

};