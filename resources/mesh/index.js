//
// The big mesh allows big to communicate with other big instances
//
var resource = require('resource'),
    big = require('big'),
    mesh = resource.define('mesh');

mesh.schema.description = "distributed p2p event emitter mesh resource";

//
// Use the node resource for looking up node schemas
//
resource.use('node');

mesh.method('start', start);
mesh.method('connect', connect, {
  "description": "Connect to the big mesh ",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "port": resource.node.schema.properties['port'],
        "host": resource.node.schema.properties['host']
      }
    },
    "callback": {
      "description": "the callback executed after connecting to mesh",
      "type": "function",
      "required": false
    }
  }
});

mesh.method('listen', listen, {
  "description": "Listens for incoming big instances",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "port": resource.node.schema.properties['port'],
        "host": resource.node.schema.properties['host']
      }
    },
    "callback": {
      "description": "the callback executed after connecting to mesh",
      "type": "function",
      "required": false
    }
  }
});

function start () {
}

//
// Connects to a Big mesh to broadcast and listen for events
//
function connect (options, callback) {

  var client = require('engine.io-client');

  resource.use('system');

  mesh.client = new client.Socket({ host: options.host, port: options.port });

  mesh.client.on('error', function (err) {
    console.log(err)
  });

  mesh.client.on('open', function () {

    //
    // Any mesh client events should be rebroadcasted locally,
    // but they should not be re-emitted
    //
    mesh.client.on('message', function(data){
      var msg = JSON.parse(data);
      big.emit(msg.event, msg.payload, false)
    })

    //
    // Any local events, should be re-broadcasted back to mesh,
    // unless reemit === false
    //
    big.onAny(function(data, reemit) {
      if(reemit !== false) {
        var msg = {
          event: this.event,
          payload: data
        };
        mesh.client.send(JSON.stringify(msg));
      }
    });

    //
    // Send a friendly phone-home method
    // Feel free to comment this line out at any time
    //
    big.emit('node::ohai', resource.system.info());

  });

};

function listen (options, callback) {

  var engine = require('engine.io');

  mesh.server = engine.listen(options.port)

  mesh.server.on('connection', function (socket) {

    big.emit('mesh::incoming::connection', socket.id);

    socket.on('message', function(data){
      var msg = JSON.parse(data);
      msg.payload.id = socket.id;
      //
      // TODO: figure out where engine.io is storing remoteAddress on socket !!!
      //
      //msg.payload.host = socket.remoteAddress.host;
      //msg.payload.port = socket.remoteAddress.port;
      big.emit(msg.event, msg.payload, false)
    });

    //
    // Any local events, should be re-broadcasted back to mesh,
    // unless reemit === false
    //
    big.onAny(function(data, reemit) {
      var msg = {
        event: this.event,
        payload: data
      };
      if(reemit !== false) {
        socket.send(JSON.stringify(msg));
      }
    });

  });

};

exports.dependencies = {
  "engine.io": "*",
  "engine.io-client": "*"
};

exports.mesh = mesh;