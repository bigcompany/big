//
//   big.js - Application Framework
//
// The code-base for big is written as a story from top to bottom.
//

//
// This is big. big is a singleton. There is only one big in every application.
//
var big = {}; // Create big as an object.

//
// That's all big is.
//
// big seems quite small right now actually...
//
// We will need to create a way to extend big with additional functionality.
// In order to do so, we'll implement a Resource system
// ( as in Resource-View-Presenter ).
//

//
// Require the node.js resource module.
//
big.resource = require('resource');

//
// Map resources to the top-level of big for convenience
//
big.resources = big.resource.resources;

//
// For convenience, hoist some of the resource methods onto big.
//
big.use    = big.resource.use; // For using/loading resources
big.define = big.resource.define; // For defining new resources

//
// The resource library utilizes EventEmitter2.
// See: https://github.com/hij1nx/eventemitter2

big.emit   = big.resource.emit; // For emitting namespaced events
big.on     = big.resource.on; // For listening for namespaced events
big.onAny  = big.resource.onAny; // For listening for any events

big.logger = big.resource.logger;

//
// Export big into the module's export scope so it may be accessed
// with `var big = require('big')`.
//
module['exports'] = big;

//
// That's it for now! You'll notice Big is actually quite small.
//
