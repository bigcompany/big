var exports = {};
var coder = exports;
//
// Remark: Code comments show code that gets generated
//
exports.code = function (resource) {
  var str = '';
  //
  // var Creature = resource.define('creature');
  //
  str += 'var ' + resource.name + " = resource.define('" + resource.name +  "');\n\n";

  var schema = resource.schema.properties;
  Object.keys(schema).forEach(function(p){
    var type = schema[p].type.split('');
    type[0] = type[0].toUpperCase();
    type = type.join('');
    if (p !== 'id') {
      //
      // Creature.property('awesome', {
      //
      str += resource.name + '.property("' + p + '", {\n';
      
      //
      // "type": "boolean"
      //
      str += '  "type": "' + type.toLowerCase() + '"\n';
      
      Object.keys(schema[p]).forEach(function(o, i){
        var comma = ",";
        if(i === Object.keys(schema[p]).length - 1) { // TODO: < 4 is a magic number, thats not right
          comma = "";
        }
        if(o !== "type" && o !== "messages" && o !== 'conditions') {
          var value = schema[p][o];
          if(Array.isArray(value)) {
            value = "['" + value.join("', '") + "']";
          } else if (type === "Number"){
            // do nothing
          } else if (type === "Boolean"){
            // do nothing
          } else {
            value =  '"' + value + '"';
          }
          //
          // "default": false,
          //
          str += '  "' + o + '": ' + value + '' + comma + '\n';
        }
      });
      //
      // });
      //
      str += '});\n\n'
      
    }
  });
  
  //
  // For every method on the resource
  //
  for (var m in resource.methods) {
    if(typeof resource.methods[m] === "function") {
      //
      // Creature.method('feed', fn, {});
      //
      str += resource.name + '.method("' + m + '", ' + resource.methods[m].toString() + ', ' + JSON.stringify(resource.methods[m].schema, true, 2) +');\n';
    }
  }
  return str;
};
