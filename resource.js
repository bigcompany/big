//
// resource.js - Resource module for Big
//

var resource = {};

resource.resources = {};

resource.use = function (r, options) {

  var self = this;

  if(typeof r === "string") {
    var _r = resource.load(r);
    if(typeof _r[r] === 'undefined') {
      throw new Error("exports." + r + " is not defined in the " + r + ' resource!')
    }
    this[r] = _r[r];
    this[r].name = r;
    //
    // Any options passed into resource.use('foo', options),
    // will be considered configuration options, and bound to resource.config
    //
    this[r].config = options || {};

    //
    // Attach a copy of the resource to the resource module scope for later reference
    //
    resource.resources[r] = this[r];

    hoistMethods(this[r], self);

    //
    // If a database configuration has been specified, attach CRUD methods to resource
    //
    if (typeof this[r].config.database !== 'undefined') {
      this[r].database();
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

  r.name = name;
  r.methods = {};
  r.schema = {
    properties: {}
  };
  r.config = {};

  r.property = function (name, schema) {
    addProperty(r, name, schema);
  };

  r.method = function (name, method, schema) {
    addMethod(r, name, method, schema);
  };

  r.database = function (type) {
    //
    // Extends the resource with CRUD methods ( can now persist to a database )
    //
    crud(r);
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
  resource.resources[name] = r
  return r;

};

// creates an internal model for the resource
function crud (r, type) {

  var Schema = require('jugglingdb').Schema;

  // create new JugglingDB object, based on database type
  var schema = new Schema(type || 'cradle', { database: "big" }); // TODO: better configuration of database type

  // create new JugglingDB schema based on resource schema
  var _schema = {};

  // TODO: better / full schema mappings
  Object.keys(r.schema.properties).forEach(function(p){
    var prop = resource.schema.properties[p];
    _schema[p] = { type: String }; // TODO: not everything is a string
  });

  var Model = schema.define(r.name, _schema);

  // TODO: map all crud methods
  // TODO: map all before / after hook methods

  //
  // CREATE method
  //
  function create (data, callback) {
    Model.create(data, callback);
  }
  r.method('create', create, {
    "description": "create a new foobar",
    "properties": {
      "options": {
        "type": "object",
        "properties": r.schema.properties
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Get method
  //
  function get (id, callback){
    Model.find(id, callback);
  }
  r.method('get', get, {
    "description": "Get object by id",
    "properties": {
      "id": {
        "type": "any",
        "description": "the id of the object"
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Find method
  //
  function find (options, callback){
    Model.all(options, callback);
  }
  r.method('find', find, {
    "description": "find all instances of resource that matches query",
    "properties": {
      "options": {
        "type": "object",
        "properties": r.schema.properties
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // All method
  //
  function all (callback){
    Model.all({}, callback);
  }

  r.method('all', all, {
    "description": "find all instances of resource",
    "properties": {
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Save method
  //
  function save (options, callback){
    Model.save(options, callback);
  }
  r.method('save', find, {
    "description": "saves instance. if no id is provided, create called instead.",
    "properties": {
      "options": {
        "type": "object",
        "properties": r.schema.properties
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Destroy method
  //
  function destroy (id, callback){
    Model.destroy(options, callback);
  }
  r.method('destroy', find, {
    "description": "destroys object by id",
    "properties": {
      "id": {
        "type": "any",
        "description": "the id of the object",
        "required": true
      },
      "callback": {
        "type": "function"
      }
    }
  });

  // assign model to resource
  r.model = Model;
}


function instantiate (schema, data) {
  var obj = {};
  if(typeof schema.properties === 'undefined') {
    return obj;
  }
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

      //
      // Mixin default schema options supplied function argument data
      //
      if(typeof args[0] === "object") {
        for(var p in args[0]) {
          obj.options[p] = args[0][p];
        }
        args[0] = obj.options;
      }

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

//
// Aggregates and hoists any "special" defined methods, such as "start", "listen", "connect", etc...
//
function hoistMethods (r, self) {
  //
  // Check for special methods to get hoisted onto big
  //
  var hoist = ['start', 'connect', 'listen']; // TODO: un-hardcode configurable hoist methods
  for (var m in r.methods) {
    if (typeof r.methods[m] === 'function' && hoist.indexOf(m) !== -1) {

      function queue (m) {
        if(typeof self['_' + m] === "undefined") {
          self['_' + m] = [];
          self[m] = function (options, callback) {
            // TODO: async iterator
            // TODO: un-hardcode options/callback signature
            self['_' + m].forEach(function(fn){
              if(typeof options === "function") { // no options sent, just callback
                callback = options;
                options = {};
              }
              fn(options, callback);
            });
          };
        }
        self['_' + m].push(r.methods[m]);
      }
      queue(m);
    }
  }
}


//
// Creates a "safe" non-circular JSON object for easy stringification purposes
//
resource.toJSON = function (r) {
  var obj = {};
  var obj = {
    name: r.name,
    schema: r.schema,
    methods: methods(r)
  }
  function methods (r) {
    var obj = {};
    for(var m in r.methods) {
      obj[m] = r.methods[m].schema
    }
    return obj;
  }
  return obj;
};

resource.schema = {
  properties: {}
};

resource.methods = [];
resource.name = "resource";


// TODO: add check for exports.dependencies requirements
module['exports'] = resource;