//
// The big mesh allows big to communicate with other big instances
//
var big  = require('big'),
    mesh = big.define('mesh');

mesh.method('start', start);
mesh.method('connect', connect, {
  "description": "Connect to the big mesh "
});
mesh.method('listen', listen, {
  "description": "Listens for incoming big instances"
});

function start () {
}

//
// Connects to a Big mesh to broadcast and listen for events
//
function connect () {
  var axon = require('axon');
  mesh.client = axon.socket('emitter');
  mesh.client.connect(3000, function(){
    //
    // Any mesh events should be rebroadcasted locally,
    // but they should not be re-emitted
    //
    big.mesh.client.on('message', function(ev, data) {
      big.emit(ev, data, false)
    });
    
  });
};

function listen (options) {
  var axon = require('axon');
  mesh.server = axon.socket('emitter');
  mesh.server.bind(3000, function(err){
    //
    // Any local events, should be re-broadcasted back to mesh,
    // unless reemit === false
    //
    big.onAny(function(data, reemit) {
      if(reemit !== false) {
        big.mesh.server.emit('message', this.event, data);
      }
    });
  });
};

exports.dependencies = {
  "axon": "*"
};

exports.mesh = mesh;