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
// In order to extend big and add new functionality, we'll implement a resource loading system ( as in Resource-View-Presenter )
//

//
// Use is a function for loading resources
// Everytime a resource gets loaded, it will import its resource methods onto window["Big"]
//
Big.use = function (r) {
  browserLoad('/resources/' + r + '/index.js');
};

//
// Loads a resource in the browser using a <script> tag
//
function browserLoad (path, callback) {
  var head    = document.getElementsByTagName("head")[0],
      _script = document.createElement('script');
  _script.type = 'text/javascript';
  _script.onload = callback;
  _script.src = path;
  head.appendChild(_script);
}
