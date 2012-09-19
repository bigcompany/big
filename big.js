//
// MIT - Big Company
//
// The code-base for Big is written as a story from top to bottom.
//

//
// This is Big. Big is a singleton. There is only one Big in every application
//
var Big = {};

//
// The only thing that this "barebone" Big can do is act as a multi-level event emitter
//

//
// Require an EventEmitter package
//
var EventEmitter = require('eventemitter2').EventEmitter2;

//
// We'll just overwrite Big to be an EventEmitter. That's easy enough.
//
Big = new EventEmitter({
  wildcard: true, // event emitter should use wildcards ( * )
  delimiter: '::', // the delimiter used to segment namespaces
  maxListeners: 20, // the max number of listeners that can be assigned to an event
});

//
// That's all Big is.
// Big seems quite small right now actually.
// We will need to create a way for Big to load additional functionality...
//

//
// In order to extend big and add new functionality, we'll implement a Resource system ( as in Resource-View-Presenter )
//

//
// Require a simple resource system
//
Big.resource = require('./resource');
//
// Use is a function for loading resources
// Everytime a resource gets loaded, it will import its resource methods onto Big
//
Big.use    = Big.resource.use;
Big.define = Big.resource.define;

//
// That's it for now! We will export Big into the module's export scope and be done with it!
//
module['exports'] = Big;

//
// If you hadn't noticed, Big is less than 7 lines of code.
// I don't enjoy writing more than 7 lines of code at a time.
//