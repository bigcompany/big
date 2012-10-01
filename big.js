//
//   big.js
//
// The code-base for Big is written as a story from top to bottom.
//

//
// This is Big. Big is a singleton. There is only one Big in every application
//
var Big = {};

//
// That's all Big is.
//
// Big seems quite small right now actually.
//
// We will need to create a way for Big to load additional functionality...
//

//
// In order to extend big and add new functionality, we'll implement a Resource system ( as in Resource-View-Presenter )
//

//
// Require a simple resource system
//
Big.resource = require('resource');

//
// Attach some of the resource methods to Big for convenience
//
Big.use    = Big.resource.use;
Big.define = Big.resource.define;
Big.emit   = Big.resource.emit;
Big.on     = Big.resource.on;
Big.onAny  = Big.resource.onAny;


//
// That's it for now! We will export Big into the module's export scope and be done with it!
//
module['exports'] = Big;