var resource = require('resource'),
    api = resource.define('api');

api.property('version', {
  "description": "the semantic version of the API",
  "type": "string",
  "default": "v0.0.1"
});

api.property('resources', {
  "description": "the resources represented by the api",
  "type": "object",
  "default": resource.resources.creature
});

api.method('start', start, {
  "description": "when the api resource starts",
  "properties": {
    "options": {
      "type": "object",
      "properties": api.schema.properties
    }
  }
});

function start (options, callback) {

  resource.http.app.get('/api', function (req, res, next) {
    res.end('welcome to the api explorer');
  });

  resource.http.app.get('/api/' + options.version, function (req, res, next) {
    res.end(JSON.stringify(api, true, 2));
  });

  resource.http.app.get('/api/' + options.version + '/:resource', function (req, res, next) {
    var r = resource.resources[req.param('resource')];
    var obj = resource.toJSON(r);
    res.end(JSON.stringify(obj, true, 2));
  });

}

exports.api = api;
