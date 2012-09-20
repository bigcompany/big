var big  = require('big'),
    node = big.define('node');

node.property('host', {
  "type": "string"
});

node.property('port', {
  "type": "number"
});

node.property('events', {
  "description": "the total amount of events processed by this node"
  "type": "number"
});

node.property('system', {
  "description": "a dump of the node's system information ( from node.process and require('os') module )",
  "type": "object"
});

node.property('lastSeen', {
  "description": "the last date/time the node was seen",
  "type": "string"
});

exports.node = node;