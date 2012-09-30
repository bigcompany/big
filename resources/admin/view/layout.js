var layout = exports;
var viewful = require('viewful')

var controls = new viewful.View({ path: __dirname + '/controls', input: 'html' });
controls.load();

//
// Remark: Bind controls to layout for convience
//
layout.controls = controls;