var socket = exports;

var big  = require('big'),
    socket = big.define('socket');

socket.method('start', start, {
  "description": "starts a socket.io server",
  "properties": {
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
  var socketful = require('socketful');
  socket.server = server = socketful.createServer(big.resources, { server: big.http.server });
}

exports.socket = socket;

exports.dependencies = {
  "socketful": "*"
};