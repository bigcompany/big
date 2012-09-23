var resource  = require('resource'),
    http = resource.define('http');

http.name = "http";

http.property("port", {
  "type": "number",
  "default": 8888,
  "description": "the port to listen on "
});

http.property("host", {
  "type": "string",
  "default": "0.0.0.0", 
  "description": "the host interface to listen on"
});

http.property("root", {
  "type": "string"
});

http.method('start', start, {
  "description": "starts an http server",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "port": http.schema.properties['port'],
        "host": http.schema.properties['host'],
        "root": http.schema.properties['root']
      }
    },
    "callback": {
      "description": "the callback executed after server listen",
      "type": "function",
      "required": false
    }
  }
});

function start (options, callback) {
  options = options || {};

  var server;

  var connect = require('connect'),
      express = require('express');

  var app = express();

  if(typeof options.root !== 'undefined') {
    app
      .use(connect.static(options.root))
      .use(connect.directory(options.root));
  }

  app
    .use(connect.favicon())
    .use(connect.logger('dev'))
    .use(connect.cookieParser())
    .use(connect.session({ secret: 'my secret here' }))

   http.server = server = require('http').createServer(app).listen(options.port, options.host, function(){
      callback(null, server);
   });
   http.app = app;

}

exports.http = http;

exports.dependencies = {
  "connect": "*"
};