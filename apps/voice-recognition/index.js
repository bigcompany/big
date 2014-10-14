var big = require('../../index');
var http = require('resource-http');
var mesh = require('resource-mesh');
var debug = require('debug')('big::voice-recognition');
var colors = require('colors');

module['exports'] = function website (opts, cb) {

  opts = opts || {};
  opts.port = opts.port || 8888;
  opts.site = opts.site || {};
  opts.site.port = opts.site.port || 9999;
  opts.site.root = opts.site.root || __dirname + "/public";

  big.start(opts, function(err, app){
    // start static http server
    http.listen({ 
      port: opts.site.port,
      root: opts.site.root,
      view: opts.site.view
    }, function(err, app) {
      if (err) {
        throw err;
      }
      // after the http static server has started,
      // emit an event on the mesh registering it if a loadbalancer is available
      var addr = app.server.address();
      debug('started');

      var commands = {
        'big server stop': function(item){
          mesh.emitter.emit('voiceCommand', { event: "http::stop" });
        },
        'big open *item': function(item){
          //alert(item)
          mesh.emitter.emit('voiceCommand', item);
        }
      };

      mesh.emitter.emit('addCommands', commands);

      mesh.emitter.on('getEvents', function(){
        console.log('getEventsss')
        mesh.emitter.emit('addEvents', 'bar')
      });
      var style = "yellow", decorator="blackBG";
      mesh.emitter.on('hello', function(data){
        console.log(('hello ' + data)[style][decorator]);
      });

      mesh.emitter.on('voiceCommand', function (data){
        switch (data.event) {
          case 'color':
            if (colors[data.color + "BG"]) {
              decorator = data.color + "BG";
            }
          break;
          case 'text':
          if (colors[data.color]) {
            style = data.color;
          }
          break;
        }
        debug('got voice command', data);
        big.emit(data.event, 'foo')
      });

      cb(null, app);
    });

  });
  return big;
};