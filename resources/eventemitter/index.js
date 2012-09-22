exports.dependencies = {
  "eventemitter2": "*"
};

var resource = require('resource'),
    eventemitter = resource.define('eventemitter');

var EventEmitter = require('eventemitter2').EventEmitter2;

var ee = new EventEmitter({
  wildcard: true, // event emitter should use wildcards ( * )
  delimiter: '::', // the delimiter used to segment namespaces
  maxListeners: 20, // the max number of listeners that can be assigned to an event
});

eventemitter._events = ee._events;
eventemitter.delimiter = ee.delimiter;
eventemitter.wildcard = ee.wildcard;
eventemitter.listenerTree = ee.listenerTree;
eventemitter.emit = ee.emit;
eventemitter.on = ee.on;
eventemitter.onAny = ee.onAny;

//
// exports.hoist indicates that the resource should hoist all its exports,
// onto the "resource" module scope itself ( in addition to being scope withing resource.resources.eventemitter)
//
// Using "hoist" is not recommended for most resources!
// EventEmitter is a special case!
//
exports.hoist = true;

exports.eventemitter = eventemitter;