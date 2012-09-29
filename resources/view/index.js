var resource = require('resource'),
    view = resource.define('view');

view.schema.description = "View engine";

view.property("path", {
  "type": "string",
  "default": ".", 
  "description": "the path to the view",
  "format": "uri" 
});

view.property("template", {
  "type": "string",
  "description": "the string template of the view"
});

view.property("input", {
  "type": "string"
});

view.property("output", {
  "type": "string"
});

view.method('create', create, {
  "description": "creates a new view",
  "properties": view.schema.properties
});

function create (options, callback) {
  var viewful = require('viewful');
  options = options || {};
  var view = new viewful.View({
    path: options.path,
    input: options.input,
    output: options.ouput
  });
  return view;
}

exports.view = view;

exports.dependencies = {
  "viewful": "*"
};