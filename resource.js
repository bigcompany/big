//
// resource.js - Resource module for Big
//

var resource = {};

resource.use = function (r) {
  if(typeof r === "string") {
    if(r === "resources") { // Resources are a special case, and should be merged directly into Big
      var x = resource.load(r); // TODO: mixin, not overwrite
      for(var p in x) {
        this[p] = x[p];
      }
    } else {
      this[r] = resource.load(r);
    }
  }
};

resource.load = function (r, callback) {
  //
  // TODO: clean up nested try / catch
  //
  var result;
  try {
    //
    // First, attempt to load resource as straight npm package name
    //
    result = require(r);
  } catch (err) {
    try {
      //
      // Altenatively, attempt to load resource as absolute path name
      //
      result = require(__dirname + '/' + r);
    } catch (err) {
      result = err;
    }
  }
  return result;
};

// TODO: add check for exports.dependencies requirements
module['exports'] = resource;