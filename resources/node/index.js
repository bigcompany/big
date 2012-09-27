var resource  = require('resource'),
    node = resource.define('node');

node.schema.description = "for managing nodes";

node.property("port", {
  "type": "number",
  "default": 7777,
  "description": "the port of the node"
});

node.property("host", {
  "type": "string",
  "default": "0.0.0.0",
  "description": "the host of the node"
});

node.property('events', {
  "description": "the total amount of events processed by this node",
  "type": "number"
});

node.property('username', {
  "description": "the username used to log into the node",
  "type": "string",
  "default": "root",
  "required": false
});

node.property('password', {
  "description": "the password used to log into the node",
  "type": "string",
  "required": false
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