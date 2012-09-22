var resource = require('resource'),
    docs = resource.define('docs');

var fs = require('fs');

var viewful = require('viewful');

docs.method('generate', generate, {
  "description": "generates Markdown documentation from a esource",
  "properties": {
    "resource": {
      "description": "the resource to generate documentation for"
    },
    "template": {
      "type": "string",
      "required": true
    }
  }
});

docs.method('build', build, {
  "description": "generates Markdown documentation for all resources"
});

docs.method('view', view, {
  "description": "views the Markdown documentation for any resource",
  "properties": {
    "resource": {
      "description": "the resource to view documentation for",
      // "type": "function", function type doesn't work in revalidator?
      "required": true
    }
  }
});

docs.all = function (resources) {
  var str = '';
  for(var r in resources) {
    str += docs.generate(resources[r]) + '\n\n';
  }
  return str;
};

function generate (resource, template) {

  template = template || fs.readFileSync(__dirname + '/template.md').toString();

  var view = new viewful.View({
    template: template, 
    input:"swig"
  });

  viewful.engines.swig.init({
      autoescape: false
  });

  var data = {
    toc: tableOfContents(resource),
    name: resource.name,
    usage: resourceUsage(resource),
    properties: resourceProperties(resource),
    methods: resourceMethods(resource),
    footer: generateFooter()
  };

  var s = view.render(data);

  return s;

};

function view (resource) {
  var md = fs.readFileSync(__dirname + '/../' + resource + '/README.md').toString();
};


//
// Remark: resourcePropeties and resourceMethods functions both need to be refactored,
// to recurisively parse properties into markdown. right now its hard-coded to 2 levels
//

function resourceProperties (resource) {
  var str = '';
  
  if(typeof resource.schema === 'undefined' || typeof resource.schema.properties === 'undefined') {
    return str;
  }
  
  if(Object.keys(resource.schema.properties).length > 1) {
    str += '<a name="' + resource.name + '-properties"></a>\n\n';
    str += '## properties \n';
  }

  str += schemaToTable(resource.schema);

  return str;
}

//
// Generates Markdown documentation for resource methods
//
function resourceMethods (resource) {
  var str = '';

  str += '<a name="' + resource.name + '-methods"></a> \n\n';
  str += '## methods \n\n';

  if(typeof resource.methods === 'undefined') {
    return str;
  }

  for ( var m in resource.methods ) {
    if(typeof resource.methods[m] === "function") {
      //
      // Create temp _args array to create simple list of "top-level" method arguments
      //
      var _args = [];
      if(typeof resource.methods[m].schema === 'object' && typeof resource.methods[m].schema.properties === 'object') {
        Object.keys(resource.methods[m].schema.properties).forEach(function(prop){
          _args.push(prop);
        });
      }
      str += '<a name="' + resource.name + '-methods-' + m +'"></a> \n\n';
      str += ('### ' + resource.name + '.' + m + '(' + _args.join(', ') +')\n\n');
      //
      // Show method schema properties
      //
      str += schemaToTable(resource.methods[m].schema);
    }
  }
  return str;
}

//
// Converts a schema into a nested markdown ul / li
//
function schemaToTable (schema) {

  var str = '';

  function props (properties, level) {

    var pad = '';

    for(var i = 0; i < level; i++) {
      pad += '  ';
    }

    var str = '';

    if(typeof properties !== "object") {
      return str;
    }

    Object.keys(properties).forEach(function(p){
      var prop = properties[p];
      if(typeof prop === 'object') {
        str += pad + '- **' + p + '** \n\n';
        if(p === 'enum') {
          return str += pad + '  - enum : *["' + prop.join('", "') + '"]*\n\n';
        }
        for(var o in prop) {
          // enum is a special case, format the array flat ( so it doesnt take up a bunch of vertical space in the layout )
          if(typeof prop[o] !== "object") {
            str += pad + '  - **' + o + '** : ' + prop[o] + '\n\n';
          } else {
            str += pad + '  - **' + o + '**\n\n';
            str += props(prop[o], level + 2);
          }
        }
      } else {
        str += pad + '- ' + p  + ' : *' + prop + '*\n\n';
      }
    });
    return str;
  };
  
  if(typeof schema === 'object' && typeof schema.properties === 'object' ) {
    str += ( schema.description || '' ) + "\n\n";
    str += props(schema.properties, 0);
  }
  return str;
  
};

function resourceUsage (resource) {
  var str = '';
  str += ('    ' + 'var big = require("big");\n');
  str += ('    ' + 'big.use("' + resource.name + '");\n');
  return str;
}

function tableOfContents (resource) {

  // Header
  var str = '## ' + resource.name + '\n\n';

  if(typeof resource.schema === 'undefined' || typeof resource.schema.properties === 'undefined') {
    return str;
  }

  // Properties
  str += '#### [properties](#' + resource.name + '-properties)' + '\n\n';
  Object.keys(resource.schema.properties).forEach(function(r){
    str += '  - [' + r + '](#' + resource.name + '-properties-' + r + ')\n\n';
  });
  str += '\n';

  // Methods
  str += '#### [methods](#' + resource.name + '-methods)' + '\n\n';
  for (var m in resource.methods) {
    var _args = [];
    if(typeof resource.methods[m].schema === 'object' && typeof resource.methods[m].schema.properties === 'object') {
      Object.keys(resource.methods[m].schema.properties).forEach(function(prop){
        _args.push(prop);
      });
    }
    str += ('  - [' + m + '](#' + resource.name + '-methods-' + m + ') (' + _args.join(', ') +')\n\n');
  }

  return str;
};

function generateFooter() {
  var str = '';
  str += ('*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*');
  return str;
}

/*
docs.method('start', start, {
  "description": "add a /docs route to the http server for viewing documentation"
});
*/

function build () {
  var _resources = {};
  var dirs = fs.readdirSync(__dirname + '/../');
  //
  // Generate a README file for every resource
  //
  dirs.forEach(function(p){
    var stat;
    try {
      stat = fs.statSync(__dirname + '/../' + p + '/' + "index" + '.js');
    } catch(err) {
      //console.log(err)
    }
    if(stat) {
      _resources[p] = {};
      var str = p.substr(0, 1);
      str = str.toUpperCase();
      var P = str + p.substr(1, p.length - 1);
      console.log(('attempting to require ' + '../' + p).yellow)

      var _resource = resource.use(p);

      //
      // Generate the docs
      //
      var doc = resource.docs.generate(_resource, fs.readFileSync(__dirname + '/template.md').toString());
      //
      // Write them to disk
      //
      var _path = __dirname + '/../' + p + '/README.md';

      try {
        fs.writeFileSync(_path, doc);
        console.log(('wrote to ' + _path).green)
      } catch(err) {
        console.log(err)
      }
    }
  });

  //
  // Then generate a README file for the core project
  //
  var str = '# resources \n\n';
  str += 'big resources for any occasion \n\n'
  Object.keys(_resources).forEach(function(r){
    str += ' - [' + r + '](https://github.com/bigcompany/resources/tree/master/' + r +')\n';
  });
  fs.writeFileSync('./README.md', str);
  console.log('wrote to core README.md file'.green);
}


function start (options, callback) {

  /*
  big.http.app.get('/docs', function (req, res, next) {
    res.end('TODO: docs root');
  });

  big.http.app.get('/docs/resources', function (req, res, next) {
    // TODO: resource.toJSON for array of resources
    var r = big.resource.resources;
    var str = docs.all(r)
    var view = new viewful.View({
      template: str, 
      input:"markdown"
    });
    str = '<link href="/style.css" rel="stylesheet"/> \n' + view.render();
    res.end(str);
  });

  big.http.app.get('/docs/resources/:resource', function (req, res, next) {
    var r = big.resource.resources[req.param('resource')];
    var str = docs.generate(r)
    var view = new viewful.View({
      template: str, 
      input:"markdown"
    });
    str = '<link href="/style.css" rel="stylesheet"/> \n' + view.render();
    res.end(str);
  });
  */

}

exports.docs = docs;

exports.dependencies = {
  "viewful": "*"
};


