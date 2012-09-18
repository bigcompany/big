//
// resource.js - Resource module for Big
//

var resource = {};

resource.resources = {};

resource.use = function (r, options) {
  
  var self = this;
  
  if(typeof r === "string") {
    this[r] = resource.load(r)[r];
    this[r].name = r;
    //
    // Check for special methods to get hoisted onto big
    //
    var hoist = ['start']; // TODO: un-hardcode configurable hoist methods
    for (var m in this[r].methods) {
      if (typeof this[r].methods[m] === 'function' && hoist.indexOf(m) !== -1) {
        if(typeof self._start === "undefined") {
          self._start = [];
          self.start = function (options, callback) {
            // TODO: async iterator
            // TODO: un-hardcode options/callback signature
            self._start.forEach(function(fn){
              if(typeof options === "function") { // no options sent, just callback
                callback = options;
                options = {};
              }
              fn(options, callback);
            });
          };
        }
        self._start.push(this[r].methods[m]);
      }
    }
    return this[r];
  }
  
  
};

resource.load = function (r, callback) {
  //
  // TODO: clean up nested try / catch
  //
  var result;
  try {
    //
    // First, attempt to load resource as absolute path name
    //
    result = require(__dirname + '/resources/' + r);
  } catch (err) {
    throw err;
    try {
      //
      // Altenatively, attempt to load resource as straight npm package name
      //
      result = require(r);
    } catch (err) {
      result = err;
    }
  }
  return result;
};

//
// Will eventually be renamed and replace resource.define
//
resource.define = function (name, schema, data) {
  
  var r = {};

  r.methods = {};
  r.schema = {
    properties: {}
  };

  r.property = function (name, schema) {
    addProperty(r, name, schema);
  };

  r.method = function (name, method, schema) {
    addMethod(r, name, method, schema);
  };

  //
  // Create a new object based on the schema
  //
  
  //
  // If any additional data has been passed in, assign it to the resource
  //
  
  //
  // Return the new object
  //
  
  resource.resources[name] = schema;
  return r;
  
};

resource.database = function (r, type) {
  //
  // Assigns a database persistance engine to the resource
  //
  crud(r);
  
};

function crud (r) {
  r.create = function () {
    // run validation before create
  };
  r.save = function () {
    // run validation before save
  };
  r.get = function () {};
  r.destroy = function () {};
}


function instantiate (schema, data) {
  var obj = {};
  Object.keys(schema.properties).forEach(function(prop){
    if (typeof schema.properties[prop].default !== 'undefined') {
      obj[prop] = schema.properties[prop].default;
    }
    if (typeof schema.properties[prop].properties === 'object') {
      obj[prop] = instantiate(schema.properties[prop]);
    }
  });
  return obj;
}

function addMethod (r, name, method, schema, tap) {
  
  //
  // This is a method defined by the Resource
  //
  
  //
  // The method is bound onto the "methods" property of the resource
  //
  var fn = function () {
    
    var args =  Array.prototype.slice.call(arguments);
    var payload = [];
    //
    // Inside this method, we must take into account any schema,
    // which has been defined with the method signature
    //
    if (typeof schema === 'object') {
      //
      // There is a schema, so we must validate the method signature against it
      //
      
      //
      // First, we'll create a new instance of the object based on the current schema and data
      //
      var obj = instantiate(schema, args[0]);
      args[0] = obj.options;
    }

    //
    // Everything seems okay, let's excecute the method with passed in arguments
    //
    return method.apply(this, args);
  };

  // store the schema on the fn for later reference
  fn.schema = schema;

  r.methods[name] = fn;
  // TODO: add warning / check for override
  r[name] = fn;
}

function addProperty (r, name, schema) {
  r.schema.properties[name] = schema;
}


// TODO: add check for exports.dependencies requirements
module['exports'] = resource;