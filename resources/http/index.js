var big  = require('big'),
    http = big.define('http');

http.name = "http";

http.property("port", {
  "type": "string",
  "default": 8888,
  "description": "the port to listen on "
});

http.property("host", {
  "type": "string",
  "default": "0.0.0.0", 
  "description": "the host interface to listen on"
});

http.property("root", {
  "type": "string",
  "default": "./public"
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

  var connect = require('connect');

  var app = connect()
    .use(connect.favicon())
    .use(connect.logger('dev'))
    /*
    .use(connect.static(__dirname + '/public'))
    .use(connect.directory(__dirname + '/public'))
    */
    .use(connect.cookieParser())
    .use(connect.session({ secret: 'my secret here' }))
    .use(splash)

   http.server = server = require('http').createServer(app).listen(options.port, options.host, function(){
      callback(null, server);
   });
   http.app = app;

}


function splash (req, res, next) {
  //
  // TODO: generate splash page with big instance information
  //
  //res.end(JSON.stringify(big, true, 2));
  next();
};

exports.http = http;


exports.dependencies = {
  "connect": "*"
};