!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.mesh=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var resource = require('resource'),
    mesh = resource.define('mesh');

var Mesh = require('./shimMesh');

mesh.method('connect', connect);
mesh.method('start', start);

function connect (opts, cb) {
  var _mesh = new Mesh();
  mesh.emitter = _mesh.emitter;
  
  return _mesh.connect(opts, cb);
};

function start (opts, cb) {
  var _mesh = new Mesh();
  mesh.emitter = _mesh.emitter;
  return _mesh.start(opts, cb);
};


module['exports'] = mesh;
},{"./shimMesh":2,"resource":36}],2:[function(require,module,exports){
var EventEmitter = require('eventemitter2').EventEmitter2;

var resource = require('resource');

// class for constructing new Mesh instances
function Mesh (opts) {
  
  var self = this;
  
  opts = opts || {};
  
  self.port = opts.port || 8888;
  self.host = opts.host || "localhost";
  
  self.mode = "unknown";
  self.autoheal = false;
  
  self.eventTable = {};
  //
  // Any events emitted on this eventEmitter will be broadcast to the mesh
  // by listeners added by the uplink and downlink methods
  //
  self.emitter = new EventEmitter({
    wildcard: true,
    delimiter: '::',
    maxListeners: 0,
    newListener: true
  });
  
  // Whenever a new listener is added to the mesh.emitter
  // add that new event to the resource eventTable namedspaced under "mesh::*"
  //
  // Remark: mesh.emitter events are considered remote by default
  // This means that these events will be available to remote sources unless,
  // unless remote property is set to `false`
  //
  // This is special behavior which only applies to the mesh.emitter.
  // All other resource event emitters will add events as NOT remote by default
  // see: https://github.com/bigcompany/resource
  //
  //
  self.emitter.on('newListener', function(ev){
    resource.eventTable["mesh::" + ev] = {
      remote: true
    };
    self.eventTable[ev] = {};
  });

};

Mesh.prototype.connect = require('../client/connect');
Mesh.prototype.uplink = require('../client/uplink');
Mesh.prototype.start = require('../client/connect');

module['exports'] = Mesh;
},{"../client/connect":3,"../client/uplink":4,"eventemitter2":35,"resource":36}],3:[function(require,module,exports){
var debug = require('debug')('resource::mesh');

module['exports'] = function connect (options, callback) {

  debug('Attempting to connect to existing mesh');

  var mesh = this,
  client = require('engine.io-client');

  mesh.client = new client.Socket({ host: options.host, port: options.port });
  mesh.client.on('error', function (err) {
    return callback(err);
  });

  mesh.client.on('open', function(socket){
    debug('Client connected to mesh');
    mesh.mode = "client";
    mesh.uplink(options, callback);
  });

  return mesh;
};
},{"debug":5,"engine.io-client":8}],4:[function(require,module,exports){
(function (process){
module['exports'] = function uplink (options, callback) {
  var mesh = this;
  var resource = require('resource');
  var handler = function (data, broadcast) {
    // don't rebroadcast messages we sent
    if(typeof resource.eventTable[this.event] === "object") {
      return;
    }
    data = data || {};
    if (data.id !== mesh.client.id) {
    }
    if(broadcast === false){
      //console.log('not sending to mesh', this.event, data);
      return;
    }
    mesh.client.send(JSON.stringify({
      event: this.event,
      payload: data,
      headers: {
        "auth": {
          user: options.user,
          password: options.password
        }
      }
    }), function(data){
      // console.log('client send callback', data)
    });
  };

  mesh.emitter.onAny(handler);

  // Remark: mesh.emitter.on events are not going to be bound until the next tick
  // This process.nextTick seems to be okay. A possible issue might be messages incoming on mesh.client.on('message'),
  // before the handshake is complete. This would cause messages to be ignored / dropped until the handshake is complete
  process.nextTick(function(){
    mesh.client.send(JSON.stringify({
      event: 'handshake',
      payload: {
        eventTable: resource.eventTable
      },
      headers: {
        "auth": {
          user: options.user,
          password: options.password
        }
      }
    }));
  });

  //
  // Any mesh client events should be rebroadcasted locally,
  // but they should not be re-emitted
  //
  mesh.client.on('message', function(data){
    var msg = JSON.parse(data);
    mesh.emitter.emit(msg.event, msg.payload, false)
  })

  mesh.client.on('error', function(err) {
    console.log('error with client', err)
    // mesh.emitter.removeListener(handler);
  });

  mesh.client.on('close', function() {
    
    // TODO: add autoheal logic
    //  server has been lost, attempt to heal the network
    //  we could add reconnect logic here so client attempts to reconnect a few times before assuming total server failure
    if(mesh.autoheal && mesh.rank === 0) {
      mesh.listen(options, function(){});
    } else {
      mesh.connect(options, function(){})
    }
    // mesh.emitter.removeListener(handler);
  });

  //
  // Continue with information about the newly connected to node
  //
  callback(null, {
    id: options.host + ":" + options.port,
    port: options.port,
    host: options.host,
    status: "connected",
    lastSeen: new Date().toString(),
    role: "server",
    eventTable: resource.eventTable
  });

};
}).call(this,require('_process'))
},{"_process":66,"resource":36}],5:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":6}],6:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":7}],7:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],8:[function(require,module,exports){

module.exports =  require('./lib/');

},{"./lib/":9}],9:[function(require,module,exports){

module.exports = require('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = require('engine.io-parser');

},{"./socket":10,"engine.io-parser":21}],10:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var transports = require('./transports');
var Emitter = require('component-emitter');
var debug = require('debug')('engine.io-client:socket');
var index = require('indexof');
var parser = require('engine.io-parser');
var parseuri = require('parseuri');
var parsejson = require('parsejson');
var parseqs = require('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Noop function.
 *
 * @api private
 */

function noop(){}

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket(uri, opts){
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' == typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.host = uri.host;
    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  }

  this.secure = null != opts.secure ? opts.secure :
    (global.location && 'https:' == location.protocol);

  if (opts.host) {
    var pieces = opts.host.split(':');
    opts.hostname = pieces.shift();
    if (pieces.length) opts.port = pieces.pop();
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port ?
       location.port :
       (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.readyState = '';
  this.writeBuffer = [];
  this.callbackBuffer = [];
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.open();
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = require('./transport');
Socket.transports = require('./transports');
Socket.parser = require('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    agent: this.agent,
    hostname: this.hostname,
    port: this.port,
    secure: this.secure,
    path: this.path,
    query: query,
    forceJSONP: this.forceJSONP,
    jsonp: this.jsonp,
    forceBase64: this.forceBase64,
    enablesXDR: this.enablesXDR,
    timestampRequests: this.timestampRequests,
    timestampParam: this.timestampParam,
    policyPort: this.policyPort,
    socket: this
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
    transport = 'websocket';
  } else if (0 == this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function() {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  var transport;
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function(transport){
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function(){
    self.onDrain();
  })
  .on('packet', function(packet){
    self.onPacket(packet);
  })
  .on('error', function(e){
    self.onError(e);
  })
  .on('close', function(){
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 })
    , failed = false
    , self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen(){
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' == msg.type && 'probe' == msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' == self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport() {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  //Handle any error that happens while probing
  function onerror(err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose(){
    onerror("transport closed");
  }

  //When the socket is closed while we're probing
  function onclose(){
    onerror("socket closed");
  }

  //When the socket is upgraded while we're probing
  function onupgrade(to){
    if (transport && to.name != transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  //Remove all listeners on the transport and on self
  function cleanup(){
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();

};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(parsejson(packet.data));
        break;

      case 'pong':
        this.setPing();
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.emit('error', err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if  ('closed' == this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' == self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api public
*/

Socket.prototype.ping = function () {
  this.sendPacket('ping');
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function() {
  for (var i = 0; i < this.prevBufferLen; i++) {
    if (this.callbackBuffer[i]) {
      this.callbackBuffer[i]();
    }
  }

  this.writeBuffer.splice(0, this.prevBufferLen);
  this.callbackBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (this.writeBuffer.length == 0) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' != this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, fn) {
  this.sendPacket('message', msg, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, fn) {
  if ('closing' == this.readyState || 'closed' == this.readyState) {
    return;
  }

  var packet = { type: type, data: data };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  this.callbackBuffer.push(fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.readyState = 'closing';

    var self = this;

    function close() {
      self.onClose('forced close');
      debug('socket closing - telling transport to close');
      self.transport.close();
    }

    function cleanupAndClose() {
      self.removeListener('upgrade', cleanupAndClose);
      self.removeListener('upgradeError', cleanupAndClose);
      close();
    }

    if (this.upgrading) {
      // wait for upgrade to finish since we can't send packets while pausing a transport
      this.once('upgrade', cleanupAndClose);
      this.once('upgradeError', cleanupAndClose);
    } else {
      close();
    }
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // clean buffers in next tick, so developers can still
    // grab the buffers on `close` event
    setTimeout(function() {
      self.writeBuffer = [];
      self.callbackBuffer = [];
      self.prevBufferLen = 0;
    }, 0);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i<j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./transport":11,"./transports":12,"component-emitter":18,"debug":20,"engine.io-parser":21,"indexof":30,"parsejson":31,"parseqs":32,"parseuri":33}],11:[function(require,module,exports){
/**
 * Module dependencies.
 */

var parser = require('engine.io-parser');
var Emitter = require('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * A counter used to prevent collisions in the timestamps used
 * for cache busting.
 */

Transport.timestamps = 0;

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' == this.readyState || '' == this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets){
  if ('open' == this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function(data){
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":18,"engine.io-parser":21}],12:[function(require,module,exports){
(function (global){
/**
 * Module dependencies
 */

var XMLHttpRequest = require('xmlhttprequest');
var XHR = require('./polling-xhr');
var JSONP = require('./polling-jsonp');
var websocket = require('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts){
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname != location.hostname || port != opts.port;
    xs = opts.secure != isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling-jsonp":13,"./polling-xhr":14,"./websocket":16,"xmlhttprequest":17}],13:[function(require,module,exports){
(function (global){

/**
 * Module requirements.
 */

var Polling = require('./polling');
var inherit = require('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Callbacks count.
 */

var index = 0;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (global.document && global.addEventListener) {
    global.addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    });
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function(e){
    self.onError('jsonp poll error',e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  insertAt.parentNode.insertBefore(script, insertAt);
  this.script = script;

  var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
  
  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch(e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function(){
      if (self.iframe.readyState == 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":15,"component-inherit":19}],14:[function(require,module,exports){
(function (global){
/**
 * Module requirements.
 */

var XMLHttpRequest = require('xmlhttprequest');
var Polling = require('./polling');
var Emitter = require('component-emitter');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty(){}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR(opts){
  Polling.call(this, opts);

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = opts.hostname != global.location.hostname ||
      port != opts.port;
    this.xs = opts.secure != isSSL;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function(opts){
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;
  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function(data, fn){
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function(err){
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function(){
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function(data){
    self.onData(data);
  });
  req.on('error', function(err){
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request(opts){
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;
  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function(){
  var xhr = this.xhr = new XMLHttpRequest({ agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR });
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    if (this.supportsBinary) {
      // This has to be done after open because Firefox is stupid
      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
      xhr.responseType = 'arraybuffer';
    }

    if ('POST' == this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.hasXDR()) {
      xhr.onload = function(){
        self.onLoad();
      };
      xhr.onerror = function(){
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function(){
        if (4 != xhr.readyState) return;
        if (200 == xhr.status || 1223 == xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function(){
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function() {
      self.onError(e);
    }, 0);
    return;
  }

  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function(){
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function(data){
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function(err){
  this.emit('error', err);
  this.cleanup();
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function(){
  if ('undefined' == typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  try {
    this.xhr.abort();
  } catch(e) {}

  if (global.document) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function(){
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response;
    } else {
      if (!this.supportsBinary) {
        data = this.xhr.responseText;
      } else {
        data = 'ok';
      }
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function(){
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function(){
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

if (global.document) {
  Request.requestsCount = 0;
  Request.requests = {};
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler);
  }
}

function unloadHandler() {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":15,"component-emitter":18,"component-inherit":19,"debug":20,"xmlhttprequest":17}],15:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parseqs = require('parseqs');
var parser = require('engine.io-parser');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function() {
  var XMLHttpRequest = require('xmlhttprequest');
  var xhr = new XMLHttpRequest({ agent: this.agent, xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function(){
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function(onPause){
  var pending = 0;
  var self = this;

  this.readyState = 'pausing';

  function pause(){
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function(){
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function(){
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function(){
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function(data){
  var self = this;
  debug('polling got data %s', data);
  var callback = function(packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' == self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' == packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' != this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' == this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function(){
  var self = this;

  function close(){
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' == this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  var callbackfn = function() {
    self.writable = true;
    self.emit('drain');
  };

  var self = this;
  parser.encodePayload(packets, this.supportsBinary, function(data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = +new Date + '-' + Transport.timestamps++;
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' == schema && this.port != 443) ||
     ('http' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  return schema + '://' + this.hostname + port + this.path + query;
};

},{"../transport":11,"component-inherit":19,"debug":20,"engine.io-parser":21,"parseqs":32,"xmlhttprequest":17}],16:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parser = require('engine.io-parser');
var parseqs = require('parseqs');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:websocket');

/**
 * `ws` exposes a WebSocket-compatible interface in
 * Node, or the `WebSocket` or `MozWebSocket` globals
 * in the browser.
 */

var WebSocket = require('ws');

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function(){
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var self = this;
  var uri = this.uri();
  var protocols = void(0);
  var opts = { agent: this.agent };

  this.ws = new WebSocket(uri, protocols, opts);

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  this.ws.binaryType = 'arraybuffer';
  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function(){
  var self = this;

  this.ws.onopen = function(){
    self.onOpen();
  };
  this.ws.onclose = function(){
    self.onClose();
  };
  this.ws.onmessage = function(ev){
    self.onData(ev.data);
  };
  this.ws.onerror = function(e){
    self.onError('websocket error', e);
  };
};

/**
 * Override `onData` to use a timer on iOS.
 * See: https://gist.github.com/mloughran/2052006
 *
 * @api private
 */

if ('undefined' != typeof navigator
  && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
  WS.prototype.onData = function(data){
    var self = this;
    setTimeout(function(){
      Transport.prototype.onData.call(self, data);
    }, 0);
  };
}

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  for (var i = 0, l = packets.length; i < l; i++) {
    parser.encodePacket(packets[i], this.supportsBinary, function(data) {
      //Sometimes the websocket has already been closed but the browser didn't
      //have a chance of informing us about it yet, in that case send will
      //throw an error
      try {
        self.ws.send(data);
      } catch (e){
        debug('websocket closed before onclose event');
      }
    });
  }

  function ondrain() {
    self.writable = true;
    self.emit('drain');
  }
  // fake drain
  // defer to next tick to allow Socket to clear writeBuffer
  setTimeout(ondrain, 0);
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function(){
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function(){
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' == schema && this.port != 443)
    || ('ws' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = +new Date;
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  return schema + '://' + this.hostname + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function(){
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

},{"../transport":11,"component-inherit":19,"debug":20,"engine.io-parser":21,"parseqs":32,"ws":34}],17:[function(require,module,exports){
// browser shim for xmlhttprequest module
var hasCORS = require('has-cors');

module.exports = function(opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch(e) { }
  }
}

},{"has-cors":28}],18:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],19:[function(require,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],20:[function(require,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],21:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var keys = require('./keys');
var sliceBuffer = require('arraybuffer.slice');
var base64encoder = require('base64-arraybuffer');
var after = require('after');
var utf8 = require('utf8');

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = navigator.userAgent.match(/Android/i);

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = require('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if ('function' == typeof supportsBinary) {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if ('function' == typeof utf8encode) {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (Blob && data instanceof global.Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
  }

  return callback('' + encoded);

};

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    packet.data = fr.result;
    exports.encodePacket(packet, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (isAndroid) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (Blob && packet.data instanceof Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += global.btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  // String data
  if (typeof data == 'string' || data === undefined) {
    if (data.charAt(0) == 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      try {
        data = utf8.decode(data);
      } catch (e) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!global.ArrayBuffer) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary == 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  if (supportsBinary) {
    if (Blob && !isAndroid) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, supportsBinary, true, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data != 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data == '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = ''
    , n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (':' != chr) {
      length += chr;
    } else {
      if ('' == length || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = exports.decodePacket(msg, binaryType, true);

        if (err.type == packet.type && err.data == packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var ret = callback(packet, i + n, l);
        if (false === ret) return;
      }

      // advance cursor
      i += n;
      length = '';
    }
  }

  if (length != '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  var numberTooLong = false;
  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] == 255) break;

      if (msgLength.length > 310) {
        numberTooLong = true;
        break;
      }

      msgLength += tailArray[i];
    }

    if(numberTooLong) return callback(err, 0, 1);

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./keys":22,"after":23,"arraybuffer.slice":24,"base64-arraybuffer":25,"blob":26,"utf8":27}],22:[function(require,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],23:[function(require,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],24:[function(require,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],25:[function(require,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(chars){
  "use strict";

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = chars.indexOf(base64[i]);
      encoded2 = chars.indexOf(base64[i+1]);
      encoded3 = chars.indexOf(base64[i+2]);
      encoded4 = chars.indexOf(base64[i+3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

},{}],26:[function(require,module,exports){
(function (global){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
  || global.WebKitBlobBuilder
  || global.MSBlobBuilder
  || global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var b = new Blob(['hi']);
    return b.size == 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }
  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

module.exports = (function() {
  if (blobSupported) {
    return global.Blob;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
(function (global){
/*! http://mths.be/utf8js v2.0.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from http://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from http://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);

		// console.log(JSON.stringify(codePoints.map(function(x) {
		// 	return 'U+' + x.toString(16).toUpperCase();
		// })));

		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			var byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.0.0',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],28:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = require('global');

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = 'XMLHttpRequest' in global &&
    'withCredentials' in new global.XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{"global":29}],29:[function(require,module,exports){

/**
 * Returns `this`. Execute this without a "context" (i.e. without it being
 * attached to an object of the left-hand side), and `this` points to the
 * "global" scope of the current JS execution.
 */

module.exports = (function () { return this; })();

},{}],30:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],31:[function(require,module,exports){
(function (global){
/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
var rtrimLeft = /^\s+/;
var rtrimRight = /\s+$/;

module.exports = function parsejson(data) {
  if ('string' != typeof data || !data) {
    return null;
  }

  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

  // Attempt to parse using the native JSON parser first
  if (global.JSON && JSON.parse) {
    return JSON.parse(data);
  }

  if (rvalidchars.test(data.replace(rvalidescape, '@')
      .replace(rvalidtokens, ']')
      .replace(rvalidbraces, ''))) {
    return (new Function('return ' + data))();
  }
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],32:[function(require,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],33:[function(require,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],34:[function(require,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],35:[function(require,module,exports){
(function (process){
;!function(exports, undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || this._all;
    }
    else {
      return this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if(!this._all) {
      this._all = [];
    }

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return EventEmitter;
    });
  } else {
    exports.EventEmitter2 = EventEmitter;
  }

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);

}).call(this,require('_process'))
},{"_process":66}],36:[function(require,module,exports){
(function (process){
//
// resource.js - resource module for node.js
//
var EventEmitter = require('./vendor/eventemitter2').EventEmitter2,
  resource = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 20, // the max number of listeners that can be assigned to an event,
    newListener: true
  });

if (typeof process === 'undefined') {
  process = {
    env: {
      "BROWSER_ENV": "development"
    }
  }; // process object is not available in browser component
}

var eventTable = resource.eventTable = {};

// Whenever a new listener is added to the resource instance,
// add that new event to the resource eventTable
//
// Remark: Resource events are considered NOT remote by default
// This means that resource events will not be available to remote sources unless,
// unless remote property is set to `true`
//
resource.on('newListener', function(ev){
  eventTable[ev] = {
    remote: resource.remote || false
  };
});

// TODO: make resource.remote a getter / setter. the idea being after setting the remote property, the eventTable will be updated to remote:true 

// resource environment, either set to NODE_ENV or "development"
resource.env = process.env.NODE_ENV || 'development';

// on the resource, create a "resources" object that will store a reference to every defined resource
resource.resources = {};

// custom event emitter logic for resource methods
resource._emit = resource.emit;
resource.emit = require('./lib/emit');

// method for defining new resources
resource.define = require('./lib/define');

// private method for binding new methods to a resource
resource._addMethod = require('./lib/method');

// private method for adding new properties to a resource
resource._addProperty = require('./lib/property');

// TODO: Setup datasource connector for browser
if (typeof process.env.BROWSER_ENV === 'undefined') {
  // adds resource.datasource.persist methods for storing resource instances into datasources
  // in most cases the datasource will be a database ( couchdb / mongodb / file-system )
  resource.datasource = require('./lib/datasource');
}

// resource.beforeAll() event hooks
resource._before = [];
resource.beforeAll = function (callback) {
  resource._before.unshift(callback);
};

module['exports'] = resource;
}).call(this,require('_process'))
},{"./lib/datasource":37,"./lib/define":45,"./lib/emit":46,"./lib/method":47,"./lib/property":48,"./vendor/eventemitter2":61,"_process":66}],37:[function(require,module,exports){
var datasource = exports;

var juggler = require('jugglingdb');

var all = require('./datasource/all'),
create = require('./datasource/create'),
destroy = require('./datasource/destroy'),
find = require('./datasource/find'),
get = require('./datasource/get'),
update = require('./datasource/update'),
updateOrCreate = require('./datasource/updateOrCreate');

//
// Persists resource to datasource using JugglingDB
//
datasource.persist = function persist (r, options) {

  options = options || { "type": "memory" };

  if (typeof options === "string") {
    options = {
      type: options
    };
  }

  var Schema = juggler.Schema,
      path = require('path');

  //
  // Create new juggler schema, based on incoming datasource type
  //
  var _type = mappings[options.type] || options.type || 'memory';

  // add datasource persistence methods to resource
  all(r);
  create(r);
  destroy(r);
  find(r);
  get(r);
  update(r);
  updateOrCreate(r);

  // TODO: better support for configuration of additional JugglingDB adapters besides CouchDB / Nano
  options.database = options.database || "resource";
  options.host = options.host || "localhost";
  options.port = options.port || 5984;

  var login = "";
  if (typeof options.username !== "undefined" && typeof options.password !== "undefined") {
    login = options.username + ':' + options.password + '@';
  }
  options.url =  login + options.host  +':' + options.port + '/' + options.database;
  options.path = "resource";

  if (options.ssl) {
    options.url = 'https://' + options.url;
  } else {
    options.url = 'http://' + options.url;
  }

  var schema = new Schema(_type, options);

  //
  // Create empty schema object for mapping between resource and JugglingDB
  //
  var _schema = {};

  //
  // For every property in the resource schema, map the property to JugglingDB
  //
  Object.keys(r.schema.properties).forEach(function(p){
    var prop = r.schema.properties[p];
    _schema[p] = { type: jugglingType(prop) };
  });
  
  function jugglingType(prop) {
    var typeMap = {
      'string': String,
      'number': Number,
      'integer': Number,
      'array': Array,
      'boolean': Boolean,
      'object': Object,
      'null': null,
      'any': String
    };
    var type = typeMap[prop.type] || String;
    if(Array.isArray(prop)) {
      type = Array;
    }
    return type;
  }

  //
  // Create a new JugglingDB schema based on temp schema
  //
  var Model = schema.define(r.name, _schema);

  // assign model to resource
  r.model = Model;
}

var mappings = {
  "couchdb": "nano",
  "couch": "nano"
};


},{"./datasource/all":38,"./datasource/create":39,"./datasource/destroy":40,"./datasource/find":41,"./datasource/get":42,"./datasource/update":43,"./datasource/updateOrCreate":44,"jugglingdb":49,"path":65}],38:[function(require,module,exports){
module['exports'] = function (r) {
  function all (options, callback) {
    r.model.all(callback);
  }
  r.method('all', all);
};
},{}],39:[function(require,module,exports){
module['exports'] = function (r) {
  function create (data, callback) {
    if (r.schema.properties.ctime) {
      data.ctime = Date.now();
    }
    if (r.schema.properties.mtime) {
      data.mtime = Date.now();
    }
    return r.model.create(data, callback);
  }
  r.method('create', create, { input: r.schema.properties });
};

},{}],40:[function(require,module,exports){
module['exports'] = function (r) {
  function destroy (id, callback){
    if(typeof id === 'object' && typeof id.id !== 'undefined') {
      id = id.id
    }
    r.model.find(id, function(err, result){
      if (err) {
        return callback(err);
      }
      if (result === null) {
        return callback(new Error(id + ' not found'));
      }
      result.destroy(function(err, res){
        console.log('aa',err, res)
        callback(null, null);
      });
    });
  }
  r.method('destroy', destroy);
}
},{}],41:[function(require,module,exports){
module['exports'] = function (r) {

  //
  // Find method
  //
  function find (query, callback) {
    //
    // Remove any empty values from the query
    //
    for(var k in query) {
      if(query[k].length === 0) {
        delete query[k];
      }
    }

    var params = {};

    if (query.limit) {
      params.limit = query.limit;
      delete query.limit;
    }

    if (query.order) {
      params.order = query.order;
      delete query.order;
    }

    if (Object.keys(query).length > 0) {
      params.where = query;
    }

    r.model.all(params, function(err, results){
      if (!Array.isArray(results)) {
        results = [results];
      }
      callback(err, results);
    });
  }

  var querySchema = {
    properties: {}
  }
  
  Object.keys(r.schema.properties).forEach(function(prop){
    if(typeof r.schema.properties[prop] === 'object') {
      querySchema.properties[prop] = {};
      for (var p in r.schema.properties[prop]) {
        querySchema.properties[prop][p] = r.schema.properties[prop][p];
      }
    } else {
      querySchema.properties[prop] = r.schema.properties[prop] || {};
    }
    querySchema.properties[prop].default = "";
    querySchema.properties[prop].required = false;
    //
    // TODO: remove the following two lines and make enum search work correctly
    //
    querySchema.properties[prop].type = "any";
    delete querySchema.properties[prop].enum;
    delete querySchema.properties[prop].format;
  });

  r.method('find', find);

};
},{}],42:[function(require,module,exports){
module['exports'] = function (r) {

  //
  // Get method
  //
  function get (id, callback){
    if(typeof id === 'object' && typeof id.id !== 'undefined') {
      id = id.id
    }
    r.model.find(id, function(err, result){
      if(result === null) {
        return callback(new Error(id + ' not found'));
      }
      // TODO: check if any of the fields are keys, if so, fetch them
      callback(err, result);
    });
  }
  r.method('get', get);
};
},{}],43:[function(require,module,exports){
module['exports'] = function (r) {
  //
  // Update method
  //
  function update (options, callback){
    //
    // JugglingDB does not have a strict update and instead has
    // updateOrCreate, so do a get first and act accordingly
    //
    r.get(options.id, function (err, result) {
      if (err) {
        //
        // Unlike the case with strict create, "not found" errors mean we are
        // unable to do an update
        //
        return callback(err);
      }

      if (r.schema.properties.mtime) {
        options.mtime = Date.now();
      }

      if (r.schema.properties.ctime) {
        options.ctime = result.ctime;
      }

      for (var param in options) {
        if (param !== 'id') {
          result[param] = options[param];
        }
      }

      result.save(function(err, updated){
        if(err) {
          return callback(err);
        }
        callback(null, updated);
      });
    });
  }
  r.method('update', update);
}
},{}],44:[function(require,module,exports){
module['exports'] = function (r) {
  
  //
  // Update or create
  //
  function updateOrCreate (options, callback) {

    r.get(options.id, function(err, record){
      if (err) {
        r.model.create(options, callback);
      } else {
        for (var p in options) {
          record[p] = options[p];
        }
        record.save(callback);
      }
    });

  }
  r.method('updateOrCreate', updateOrCreate);
  
}
},{}],45:[function(require,module,exports){
//
// Defines a new resource
//

module['exports'] = function (name, options) {

  var resource = require('../'),
      EventEmitter = require('../vendor/eventemitter2').EventEmitter2;

  options = options || {};

  //
  // Resources are event emitters
  //
  var r = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 20, // the max number of listeners that can be assigned to an event,
    newListener: true
  });

  // Whenever a new listener is added to the resource instance,
  // add that new event to the instance eventTable and the resource eventTable
  //
  // Remark: Resource events are considered NOT remote by default
  // This means that resource events will not be available to remote sources unless,
  // resource.remote property is set to `true`
  //
  r.on('newListener', function(ev){
    // resource eventTable
    resource.eventTable[name + "::" + ev] = {
      remote: r.remote || false
    };
    // resource instance eventTable
    r.eventTable[ev] = {
      remote: r.remote || false
    };
  });

  //
  // Initalize the resource with default values
  //
  r.name = name;

  //
  // Resource starts with no methods
  //
  r.methods = {};
  r.eventTable = {};
  r.controller = options.controller || {};
  r.schema = options.schema || {"properties": {}, "methods": {}};
  r.config = options.config || {};

  //
  // Any local resource events should be re-emitted to the resource module scope
  //
  r._emit = r.emit;
  r.emit = function () {
    var args = [].slice.call(arguments),
        event = args.shift();

    resource._emit.apply(resource, [ r.name + '::' + event ].concat(args));
    return r._emit.apply(r, [ event ].concat(args));
  };

  //
  // Give the resource a property() method for creating new resource properties
  //
  r.property = function (name, schema) {
    resource._addProperty(r, name, schema);
  };

  r.properties = function (schemas) {
    for (var schema in schemas) {
      r.property(schema, schemas[schema]);
    }
  };


  //
  // Give the resource a method() method for creating new resource methods
  //
  r.method = function (name, method, schema) {
    if (typeof method !== 'function') {
      console.warn('could not find method ' + r.name + '.' + name, 'using default method');
      method = function (options, cb) { cb(null, 'default method returned'); };
      //throw new Error('a function is required as the second argument to `resource.method()`');
    }
    return resource._addMethod(r, name, method, schema);
  };

  //
  // Give the resource a .before() method for defining before hooks on resource methods
  //
  r.before = function (method, callback) {
    //
    // If no method exists on the resource yet create a place holder,
    // in order to be able to lazily define hooks on methods that dont exist yet
    //
    if (typeof r.methods[method] === 'undefined') {
      r.methods[method] = {};
      r.methods[method].before = [];
      r.methods[method].after = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].before.unshift(callback);
  };

  //
  // Give the resource a .after() method for defining after hooks on resource methods
  //
  r.after = function (method, callback) {
    //
    // If no method exists on the resource yet create a place holder,
    // in order to be able to lazily define hooks on methods that dont exist yet
    //
    if (typeof r.methods[method] === 'undefined') {
      r.methods[method] = {};
      r.methods[method].before = [];
      r.methods[method].after = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].after.push(callback);
  };

  //
  // TODO: add resource level beforeAll() hooks
  //
  // r.beforeAll = function (callback) {};

  //
  // Give the resource a persist() method as a short-cut to resource.persistence.enable
  //
  r.persist = function (datasource) {
    datasource = datasource || 'memory';
    // r.config.datasource = datasource;
    resource.datasource.persist(r, datasource);
  };

  //
  // Give the resource a timestamps() method to enable ctime ( creation time ) and mtime ( modification time ) fields
  //
  r.timestamps = function () {
    r.property("ctime", { "type": "number" });
    r.property("mtime", { "type": "number" });
  }

  for (var method in r.controller) {
    if (typeof r.schema.methods[method] !== 'undefined') {
      r.method(method, r.controller[method], r.schema.methods[method]);
    }
  }

  if (typeof r.config.datasource !== 'undefined') {
    resource.datasource.persist(r, r.config.datasource);
  }


  //
  // Attach a copy of the resource to the resources scope ( for later reference )
  //
  resource[name] = r;
  resource.resources[name] = r;

  //
  // Return the new resource
  //
  return r;

};
},{"../":36,"../vendor/eventemitter2":61}],46:[function(require,module,exports){
/*

 A quick primer on working with Events and Resource Methods

 The resource module itself is an Event Emitter

   resource.emit('hello', fn)

 All defined resource methods are also Event Emitters

   creature.on('hello', fn)
   creature.emit('hello', fn)

 When resource methods are executed a local event is emitted

   creature.create({ type: 'dragon' }, fn); => creature.emit('create', { type: 'dragon' });

 When any event is emitted from a resource it is rebroadcasted to the resource module ( namespaced with :: )

  creature.create({ type: 'dragon' }, fn); => resource.emit('creature::create', { type: 'dragon' });

 Inversely, emitted events can also invoke resource methods. Note: This will not cause an infinite loop.

   resource.emit('creature::create', { type: 'dragon' }); => creature.create({ type: 'dragon' }, fn);
   creature.emit('create', { type: 'dragon' }); => creature.create({ type: 'dragon' }, fn);


*/

module['exports'] = function () {
  var resource = require('../'),
      args = [].slice.call(arguments),
      event = args.shift(),
      splitted = event.split('::'),
      r;
  if (splitted.length > 1 && resource[splitted[0]]) {
    r = resource[splitted[0]];
  }
  if (r && r._emit) {
    r._emit.apply(r, [ splitted.slice(1).join('::') ].concat(args));
  }
  return resource._emit.apply(resource, [ event ].concat(args));
};
},{"../":36}],47:[function(require,module,exports){
var rpc = require('mschema-rpc');

//
// Attachs a method to a resource with optional input and output schemas
//
module['exports'] = function addMethod (r, name, method, schema, tap) {

  var resource = require('../');

  //
  // Create a new method that will act as a wrap for the passed in "method"
  //
  var fn = function (data, callback) {
    var args  = Array.prototype.slice.call(arguments),
        _args = [],
        validationError;

    var payload = [];

    if (typeof data === "function") {
      callback = data;
    }

    //
    // Apply beforeAll and before hooks, then execute the method
    //
    return beforeAllHooks(function (err) {
      if (err) {
        if (typeof callback === 'function') {
          return callback(err);
        }
        else {
          throw err;
        }
      }
      return beforeHooks(function (err) {
        if (err) {
          if (typeof callback === 'function') {
            return callback(err);
          }
          else {
            throw err;
          }
        }
        return execute();
      });
    });

    //
    // Check for any beforeAll hooks,
    // if they exist, execute them in LIFO order
    //
    function beforeAllHooks(cb) {
      var hooks;
      if (Array.isArray(resource._before) && resource._before.length > 0) {
        hooks = resource._before.slice();
        function iter() {
          var hook = hooks.pop();
          hook = hook.bind({ resource: r.name, method: name });
          hook(args[0], function (err, data) {
            if (err) {
              return cb(err);
            }
            args[0] = data;
            if (hooks.length > 0) {
              iter();
            }
            else {
              cb(null);
            }
          });
        }
        iter();
      }
      else {
        return cb(null);
      }
    }

    //
    // Check for any before hooks,
    // if they exist, execute them in LIFO order
    //
    function beforeHooks(cb) {
      var hooks;

      if (Array.isArray(fn.before) && fn.before.length > 0) {
        hooks = fn.before.slice();
        function iter() {
          var hook = hooks.pop();
          hook = hook.bind({ resource: r.name, method: name });
          hook(args[0], function (err, data) {
            if (err) {
              return cb(err);
            }
            args[0] = data;
            if (hooks.length > 0) {
              iter();
            }
            else {
              cb(null);
            }
          });
        }
        iter();
      }
      else {
        return cb(null);
      }
    }

    function execute() {
      //
      // Inside this method, we must take into account any schema,
      // which has been defined with the method signature and validate against it
      //
      if (typeof schema === 'object') {

        var _instance = {},
            _data = {};

        // allows input schema to be specified by only passing mschema without explicit {input: {}, output: {}}
        if (typeof schema.input === "undefined") {
          schema = {
            input: schema
          }
        }

        rpc.invoke(args[0], method, schema, function (errors, result) {
          if (errors) {
            resource.emit(r.name + '::' + name + '::error', errors);
            return callback(errors, result);
          }
          return callbackWrap(null, result);
        });

      } else {
        return method(args[0], callbackWrap);
      }

      function callbackWrap(err, result) {
        var argv = [].slice.call(arguments);
        //
        // Only consider the method complete, if it has not errored
        //
        if (err === null) {
          //
          // Since the method has completed, emit it as an event
          //
          resource.emit(r.name + '::' + name, result, false);
          //
          // Resource.after() hooks will NOT be executed if an error has occured on the event the hook is attached to
          //
          return afterHooks(argv, function (err, data) {
            if (err) {
              throw err;
            }
            return callback.apply(this, data);
          });
        }
        else {
          return callback.apply(this, argv);
        }
      }
      //
      // Executes "after" hooks in FIFO (First-In-First-Out) Order
      //

      function afterHooks(args, cb) {
        cb = cb || function noop(){};
        var hooks;
        if (Array.isArray(fn.after) && fn.after.length > 0) {
          hooks = fn.after.slice();
          function iter() {
            var hook = hooks.shift();
            hook(args[1], function (err, data) {
              if (err) {
                return cb(err);
              }
              args[1] = data;
              if (hooks.length > 0) {
                iter();
              }
              else {
                return cb(null, args);
              }
            });
          }
          iter();
        }
        else {
          cb(null, args);
        }
      }

    }

  };

  // store the schema on the fn for later reference
  fn.schema = schema || {
    "description": ""
  };

  // store the original method on the fn for later reference ( useful for documentation purposes )
  fn.unwrapped = method;

  // store the name of the method, on the method ( for later reference )
  fn.name = name;

  // placeholders for before and after hooks
  fn.before = [];
  fn.after = [];


  //
  // If the method about to be defined, already has a stub containing hooks,
  // copy those hooks to the newly defined fn that is about to be created
  // These previous stubs will then be overwritten.
  // This is used to allow the ability to define hooks on,
  // lazily defined resource methods
  //
  if (typeof r.methods[name] !== 'undefined') {
    if (Array.isArray(r.methods[name].before)) {
      r.methods[name].before.forEach(function (b) {
        fn.before.push(b);
      });
    }
    if (Array.isArray(r.methods[name].after)) {
      r.methods[name].after.forEach(function (b) {
        fn.after.push(b);
      });
    }
  }

  //
  // The method is bound onto the "methods" property of the resource
  //
  r.methods[name] = fn;

  //
  // The method is also bound directly onto the resource
  //
  // TODO: add warning / check for override of existing method if r[name] already exists as a function
  r[name] = fn;

  // If an event has been emitted to the resource, fire the method
  r.on(name, function(data, rebroadcast){
    if (rebroadcast !== false) {
      fn(data, function (err, res){
        r.emit(name + "::" + "success", res, false)
      });
    }
  });

  return fn;

}

},{"../":36,"mschema-rpc":59}],48:[function(require,module,exports){
module['exports'] = function addProperty(r, name, schema) {

  var resource = require('../');

  if (typeof schema === 'undefined') {
    schema = {
      "type": "string"
    };
  }

  if (typeof schema === "string") {
    schema = {
      "type": schema
    };
  }

  r.schema.properties[name] = schema;
  resource.datasource.persist(r, r.config.datasource);

}
},{"../":36}],49:[function(require,module,exports){
(function (global,__dirname){
var fs = require('fs');
var path = require('path');

var Schema = exports.Schema = require('./lib/schema').Schema;
exports.AbstractClass = require('./lib/model.js');

var baseSQL = './lib/sql';

exports.__defineGetter__('BaseSQL', function () {
    return require(baseSQL);
});

exports.loadSchema = function(filename, settings, compound) {
    var schema = [];
    var definitions = require(filename);
    Object.keys(definitions).forEach(function(k) {
        var conf = settings[k];
        if (!conf) {
            console.log('No config found for ' + k + ' schema, using in-memory schema');
            conf = {driver: 'memory'};
        }
        schema[k] = new Schema(conf.driver, conf);
        schema[k].on('define', function(m, name, prop, sett) {
            compound.models[name] = m;
            if (conf.backyard) {
                schema[k].backyard.define(name, prop, sett);
            }
        });
        schema[k].name = k;
        schema.push(schema[k]);
        if (conf.backyard) {
            schema[k].backyard = new Schema(conf.backyard.driver, conf.backyard);
        }
        if ('function' === typeof definitions[k]) {
            define(schema[k], definitions[k]);
            if (conf.backyard) {
                define(schema[k].backyard, definitions[k]);
            }
        }
    });

    return schema;

    function define(db, def) {
        def(db, compound);
    }
};

exports.init = function (compound) {
    if (global.railway) {
        global.railway.orm = exports;
    } else {
        compound.orm = {
            Schema: exports.Schema,
            AbstractClass: exports.AbstractClass
        };
        if (compound.app.enabled('noeval schema')) {
            compound.orm.schema = exports.loadSchema(
                compound.root + '/db/schema',
                compound.app.get('database'),
                compound
            );
            if (compound.app.enabled('autoupdate')) {
                compound.on('ready', function() {
                    compound.orm.schema.forEach(function(s) {
                        s.autoupdate();
                        if (s.backyard) {
                            s.backyard.autoupdate();
                            s.backyard.log = s.log;
                        }
                    });
                });
            }
            return;
        }
    }

    // legacy stuff

    if (compound.version > '1.1.5-15') {
        compound.on('after routes', initialize);
    } else {
        initialize();
    }

    function initialize() {
        var railway = './lib/railway';
        try {
            var init = require(railway);
        } catch (e) {
            console.log(e.stack);
        }
        if (init) {
            init(compound);
        }
    }
};

exports.__defineGetter__('version', function () {
    return JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
});

var commonTest = './test/common_test';
exports.__defineGetter__('test', function () {
    return require(commonTest);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/node_modules/resource/node_modules/jugglingdb")
},{"./lib/model.js":53,"./lib/schema":55,"fs":62,"path":65}],50:[function(require,module,exports){
/**
 * Module exports
 */
exports.Hookable = Hookable;

/**
 * Hooks mixins for ./model.js
 */
var Hookable = require('./model.js');

/**
 * List of hooks available
 */
Hookable.afterInitialize = null;
Hookable.beforeValidate = null;
Hookable.afterValidate = null;
Hookable.beforeSave = null;
Hookable.afterSave = null;
Hookable.beforeCreate = null;
Hookable.afterCreate = null;
Hookable.beforeUpdate = null;
Hookable.afterUpdate = null;
Hookable.beforeDestroy = null;
Hookable.afterDestroy = null;

Hookable.prototype.trigger = function trigger(actionName, work, data, quit) {
    var capitalizedName = capitalize(actionName);
    var beforeHook = this.constructor["before" + capitalizedName];
    var afterHook = this.constructor["after" + capitalizedName];
    if (actionName === 'validate') {
        beforeHook = beforeHook || this.constructor.beforeValidation;
        afterHook = afterHook || this.constructor.afterValidation;
    }
    var inst = this;

    // we only call "before" hook when we have actual action (work) to perform
    if (work) {
        if (beforeHook) {
            // before hook should be called on instance with one param: callback
            beforeHook.call(inst, function (err) {
                if (err) {
                    if (quit) {
                        quit(err);
                    }
                    return;
                }
                // actual action also have one param: callback
                work.call(inst, next);
            }, data);
        } else {
            work.call(inst, next);
        }
    } else {
        next();
    }

    function next(done) {
        if (afterHook) {
            afterHook.call(inst, done);
        } else if (done) {
            done.call(this);
        }
    }
};

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

},{"./model.js":53}],51:[function(require,module,exports){
/**
 * Include mixin for ./model.js
 */
var AbstractClass = require('./model.js');

/**
 * Allows you to load relations of several objects and optimize numbers of requests.
 *
 * @param {Array} objects - array of instances
 * @param {String}, {Object} or {Array} include - which relations you want to load.
 * @param {Function} cb - Callback called when relations are loaded
 *
 * Examples:
 *
 * - User.include(users, 'posts', function() {}); will load all users posts with only one additional request.
 * - User.include(users, ['posts'], function() {}); // same
 * - User.include(users, ['posts', 'passports'], function() {}); // will load all users posts and passports with two
 *     additional requests.
 * - Passport.include(passports, {owner: 'posts'}, function() {}); // will load all passports owner (users), and all
 *     posts of each owner loaded
 * - Passport.include(passports, {owner: ['posts', 'passports']}); // ...
 * - Passport.include(passports, {owner: [{posts: 'images'}, 'passports']}); // ...
 *
 */
AbstractClass.include = function (objects, include, cb) {
    var self = this;

    if (
        (include.constructor.name == 'Array' && include.length == 0) ||
        (include.constructor.name == 'Object' && Object.keys(include).length == 0)
        ) {
        cb(null, objects);
        return;
    }

    include = processIncludeJoin(include);

    var keyVals = {};
    var objsByKeys = {};

    var nbCallbacks = 0;
    for (var i = 0; i < include.length; i++) {
        var callback = processIncludeItem(objects, include[i], keyVals, objsByKeys);
        if (callback !== null) {
            nbCallbacks++;
            callback(function() {
                nbCallbacks--;
                if (nbCallbacks == 0) {
                    cb(null, objects);
                }
            });
        } else {
            cb(null, objects);
        }
    }

    function processIncludeJoin(ij) {
        if (typeof ij === 'string') {
            ij = [ij];
        }
        if (ij.constructor.name === 'Object') {
            var newIj = [];
            for (var key in ij) {
                var obj = {};
                obj[key] = ij[key];
                newIj.push(obj);
            }
            return newIj;
        }
        return ij;
    }

    function processIncludeItem(objs, include, keyVals, objsByKeys) {
        var relations = self.relations;

        if (include.constructor.name === 'Object') {
            var relationName = Object.keys(include)[0];
            var subInclude = include[relationName];
        } else {
            var relationName = include;
            var subInclude = [];
        }
        var relation = relations[relationName];

        if (!relation) {
            return function() {
                cb(new Error('Relation "' + relationName + '" is not defined for ' + self.modelName + ' model'));
            }
        }

        var req = {'where': {}};

        if (!keyVals[relation.keyFrom]) {
            objsByKeys[relation.keyFrom] = {};
            objs.filter(Boolean).forEach(function(obj) {
                if (!objsByKeys[relation.keyFrom][obj[relation.keyFrom]]) {
                    objsByKeys[relation.keyFrom][obj[relation.keyFrom]] = [];
                }
                objsByKeys[relation.keyFrom][obj[relation.keyFrom]].push(obj);
            });
            keyVals[relation.keyFrom] = Object.keys(objsByKeys[relation.keyFrom]);
        }

        if (keyVals[relation.keyFrom].length > 0) {
            // deep clone is necessary since inq seems to change the processed array
            var keysToBeProcessed = {};
            var inValues = [];
            for (var j = 0; j < keyVals[relation.keyFrom].length; j++) {
                keysToBeProcessed[keyVals[relation.keyFrom][j]] = true;
                if (keyVals[relation.keyFrom][j] !== 'null' && keyVals[relation.keyFrom][j] !== 'undefined') {
                    inValues.push(keyVals[relation.keyFrom][j]);
                }
            }

            req['where'][relation.keyTo] = {inq: inValues};
            req['include'] = subInclude;

            return function(cb) {
                relation.modelTo.all(req, function(err, objsIncluded) {
                    for (var i = 0; i < objsIncluded.length; i++) {
                        delete keysToBeProcessed[objsIncluded[i][relation.keyTo]];
                        var objectsFrom = objsByKeys[relation.keyFrom][objsIncluded[i][relation.keyTo]];
                        for (var j = 0; j < objectsFrom.length; j++) {
                            if (!objectsFrom[j].__cachedRelations) {
                                objectsFrom[j].__cachedRelations = {};
                            }
                            if (relation.multiple) {
                                if (!objectsFrom[j].__cachedRelations[relationName]) {
                                    objectsFrom[j].__cachedRelations[relationName] = [];
                                }
                                objectsFrom[j].__cachedRelations[relationName].push(objsIncluded[i]);
                            } else {
                                objectsFrom[j].__cachedRelations[relationName] = objsIncluded[i];
                            }
                        }
                    }

                    // No relation have been found for these keys
                    for (var key in keysToBeProcessed) {
                        var objectsFrom = objsByKeys[relation.keyFrom][key];
                        for (var j = 0; j < objectsFrom.length; j++) {
                            if (!objectsFrom[j].__cachedRelations) {
                                objectsFrom[j].__cachedRelations = {};
                            }
                            objectsFrom[j].__cachedRelations[relationName] = relation.multiple ? [] : null;
                        }
                    }
                    cb(err, objsIncluded);
                });
            };
        }


        return null;
    }
}


},{"./model.js":53}],52:[function(require,module,exports){

module.exports = List;

/**
 * List class provides functionality of nested collection
 *
 * @param {Array} data - array of items.
 * @param {Crap} type - array with some type information? TODO: rework this API.
 * @param {AbstractClass} parent - owner of list.
 * @constructor
 */
function List(data, type, parent) {
    var list = this;
    if (!(list instanceof List)) {
        return new List(data);
    }

    if (data && data instanceof List) data = data.items;

    Object.defineProperty(list, 'parent', {
        writable: false,
        enumerable: false,
        configurable: false,
        value: parent
    });

    Object.defineProperty(list, 'nextid', {
        writable: true,
        enumerable: false,
        value: 1
    });

    data = list.items = data || [];
    var Item = list.ItemType = ListItem;

    if (typeof type === 'object' && type.constructor.name === 'Array') {
        list.ItemType = type[0] || ListItem;
    }

    if ('string' === typeof data) {
        data = JSON.parse(data);
    }

    data.forEach(function(item, i) {
        data[i] = new Item(item, list);
        Object.defineProperty(list, data[i].id, {
            writable: true,
            enumerable: false,
            configurable: true,
            value: data[i]
        });
        if (list.nextid <= data[i].id) {
            list.nextid = data[i].id + 1;
        }
    });

    Object.defineProperty(list, 'length', {
        enumerable: false,
        configurable: true,
        get: function() {
            return list.items.length;
        }
    });

    return list;

}

var _;
try {
    var underscore = 'underscore';
    _ = require(underscore);
} catch (e) {
    _ = false;
}

if (_) {
    var _import = [
        // collection methods
        'each',
        'map',
        'reduce',
        'reduceRight',
        'find',
        'filter',
        'reject',
        'all',
        'any',
        'include',
        'invoke',
        'pluck',
        'max',
        'min',
        'sortBy',
        'groupBy',
        'sortedIndex',
        'shuffle',
        'toArray',
        'size',
        // array methods
        'first',
        'initial',
        'last',
        'rest',
        'compact',
        'flatten',
        'without',
        'union',
        'intersection',
        'difference',
        'uniq',
        'zip',
        'indexOf',
        'lastIndexOf',
        'range'
    ];

    _import.forEach(function(name) {
        List.prototype[name] = function() {
            var args = [].slice.call(arguments);
            args.unshift(this.items);
            return _[name].apply(_, args);
        };
    });
}

// copy all array methods
[   'concat',
    'join',
    'pop',
    'push',
    'reverse',
    'shift',
    'slice',
    'sort',
    'splice',
    'toSource',
    'toString',
    'unshift',
    'every',
    'filter',
    'forEach',
    'indexOf',
    'lastIndexOf',
    'map',
    'some'
].forEach(function (method) {
    var slice = [].slice;
    List.prototype[method] = function () {
        return Array.prototype[method].apply(this.items, slice.call(arguments));
    };
});

List.prototype.find = function(pattern, field) {
    if (field) {
        var res;
        this.items.forEach(function(o) {
            if (o[field] == pattern) res = o;
        });
        return res;
    } else {
        return this.items[this.items.indexOf(pattern)];
    }
};

List.prototype.removeAt = function(index) {
    this.splice(index, 1);
};

List.prototype.toObject = function() {
    return this.items;
};

List.prototype.toJSON = function() {
    return this.items;
};

List.prototype.toString = function() {
    return JSON.stringify(this.items);
};

List.prototype.autoincrement = function() {
    return this.nextid++;
};

List.prototype.push = function(obj) {
    var item = new ListItem(obj, this);
    this.items.push(item);
    return item;
};

List.prototype.remove = function(obj) {
    var id = obj.id ? obj.id : obj;
    var found = false;
    this.items.forEach(function(o, i) {
        if (id && o.id == id) {
            found = i;
            if (o.id !== id) {
                console.log('WARNING! Type of id not matched');
            }
        }
    });
    if (found !== false) {
        delete this[id];
        this.items.splice(found, 1);
    }
};

List.prototype.sort = function(cb) {
    return this.items.sort(cb);
};

List.prototype.some = function(cb) {
    return this.items.some(cb);
};

List.prototype.map = function(cb) {
    if (typeof cb === 'function') return this.items.map(cb);
    if (typeof cb === 'string') return this.items.map(function(el) {
        if (typeof el[cb] === 'function') return el[cb]();
        if (el.hasOwnProperty(cb)) return el[cb];
    });
};

function ListItem(data, parent) {
    if (typeof data === 'object') {
        for (var i in data) this[i] = data[i];
    } else {
        this.id = data;
    }
    Object.defineProperty(this, 'parent', {
        writable: false,
        enumerable: false,
        configurable: true,
        value: parent
    });
    if (!this.id) {
        this.id = parent.autoincrement();
    }
    if (parent.ItemType) {
        this.__proto__ = parent.ItemType.prototype;
        if (parent.ItemType !== ListItem) {
            parent.ItemType.apply(this);
        }
    }

    this.save = function(c) {
        parent.parent.save(c);
    };
}


},{}],53:[function(require,module,exports){
(function (process,global){
/**
 * Module exports class Model
 */
module.exports = AbstractClass;

/**
 * Module dependencies
 */
var util = require('util');
var validations = require('./validations.js');
var ValidationError = validations.ValidationError;
var List = require('./list.js');
require('./hooks.js');
require('./relations.js');
require('./include.js');

var BASE_TYPES = ['String', 'Boolean', 'Number', 'Date', 'Text'];

/**
 * Model class - base class for all persist objects
 * provides **common API** to access any database adapter.
 * This class describes only abstract behavior layer, refer to `lib/adapters/*.js`
 * to learn more about specific adapter implementations
 *
 * `AbstractClass` mixes `Validatable` and `Hookable` classes methods
 *
 * @constructor
 * @param {Object} data - initial object data
 */
function AbstractClass(data) {
    this._initProperties(data, true);
}

AbstractClass.prototype._initProperties = function (data, applySetters) {
    var self = this;
    var ctor = this.constructor;
    var ds = ctor.schema.definitions[ctor.modelName];
    var properties = ds.properties;
    data = data || {};

    Object.defineProperty(this, '__cachedRelations', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
    });

    Object.defineProperty(this, '__data', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
    });

    Object.defineProperty(this, '__dataWas', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
    });

    if (data['__cachedRelations']) {
        this.__cachedRelations = data['__cachedRelations'];
    }

    for (var i in data) {
        if (i in properties) {
            this.__data[i] = this.__dataWas[i] = data[i];
        } else if (i in ctor.relations) {
            this.__data[ctor.relations[i].keyFrom] = this.__dataWas[i] = data[i][ctor.relations[i].keyTo];
            this.__cachedRelations[i] = data[i];
        }
    }

    if (applySetters === true) {
        Object.keys(data).forEach(function (attr) {
            self[attr] = data[attr];
        });
    }

    ctor.forEachProperty(function (attr) {

        if ('undefined' === typeof self.__data[attr]) {
            self.__data[attr] = self.__dataWas[attr] = getDefault(attr);
        } else {
            self.__dataWas[attr] = self.__data[attr];
        }

    });

    ctor.forEachProperty(function (attr) {

        var type = properties[attr].type;

        if (BASE_TYPES.indexOf(type.name) === -1) {
            if (typeof self.__data[attr] !== 'object' && self.__data[attr]) {
                try {
                    self.__data[attr] = JSON.parse(self.__data[attr] + '');
                } catch (e) {
                    self.__data[attr] = String(self.__data[attr]);
                }
            }
            if (type.name === 'Array' || typeof type === 'object' && type.constructor.name === 'Array') {
                self.__data[attr] = new List(self.__data[attr], type, self);
            }
        }

    });

    function getDefault(attr) {
        var def = properties[attr]['default'];
        if (isdef(def)) {
            if (typeof def === 'function') {
                return def();
            } else {
                return def;
            }
        } else {
            return undefined;
        }
    }

    this.trigger('initialize');
}

/**
 * @param {String} prop - property name
 * @param {Object} params - various property configuration
 */
AbstractClass.defineProperty = function (prop, params) {
    this.schema.defineProperty(this.modelName, prop, params);
};

AbstractClass.whatTypeName = function (propName) {
    var prop = this.schema.definitions[this.modelName].properties[propName];
    if (!prop || !prop.type) {
        return null;
        // throw new Error('Undefined type for ' + this.modelName + ':' + propName);
    }
    return prop.type.name;
};

/**
 * Updates the respective record
 *
 * @param {Object} params - { where:{uid:'10'}, update:{ Name:'New name' } }
 * @param callback(err, obj)
 */
AbstractClass.update = function (params, cb) {
    if (stillConnecting(this.schema, this, arguments)) return;
    this.schema.adapter.update(this.modelName, params, cb);
};


AbstractClass._forDB = function (data) {
    var res = {};
    Object.keys(data).forEach(function (propName) {
        var typeName = this.whatTypeName(propName);
        if (!typeName && !data[propName] instanceof Array) {
            return;
        }
        if (typeName === 'JSON' || data[propName] instanceof Array) {
            res[propName] = JSON.stringify(data[propName]);
        } else {
            res[propName] = data[propName];
        }
    }.bind(this));
    return res;
};

AbstractClass.prototype.whatTypeName = function (propName) {
    return this.constructor.whatTypeName(propName);
};

/**
 * Create new instance of Model class, saved in database
 *
 * @param data [optional]
 * @param callback(err, obj)
 * callback called with arguments:
 *
 *   - err (null or Error)
 *   - instance (null or Model)
 */
AbstractClass.create = function (data, callback) {
    if (stillConnecting(this.schema, this, arguments)) return;

    var Model = this;
    var modelName = Model.modelName;

    if (typeof data === 'function') {
        callback = data;
        data = {};
    }

    if (typeof callback !== 'function') {
        callback = function () {};
    }

    if (!data) {
        data = {};
    }

    // Passed via data from save
    var options = data.options || { validate: true };

    if (data.data instanceof Model) {
        data = data.data;
    }

    if (data instanceof Array) {
        var instances = [];
        var errors = Array(data.length);
        var gotError = false;
        var wait = data.length;
        if (wait === 0) callback(null, []);

        var instances = [];
        for (var i = 0; i < data.length; i += 1) {
            (function(d, i) {
                instances.push(Model.create(d, function(err, inst) {
                    if (err) {
                        errors[i] = err;
                        gotError = true;
                    }
                    modelCreated();
                }));
            })(data[i], i);
        }

        return instances;

        function modelCreated() {
            if (--wait === 0) {
                callback(gotError ? errors : null, instances);
            }
        }
    }


    var obj;
    // if we come from save
    if (data instanceof Model && !data.id) {
        obj = data;
    } else {
        obj = new Model(data);
    }
    data = obj.toObject(true);

    if (!options.validate) {
        create();
    }
    else {
        // validation required
        obj.isValid(function(valid) {
            if (valid) {
                create();
            } else {
                callback(new ValidationError(obj), obj);
            }
        }, data);
    }

    function create() {
        obj.trigger('create', function(createDone) {
            obj.trigger('save', function(saveDone) {

                this._adapter().create(modelName, this.constructor._forDB(obj.toObject(true)), function (err, id, rev) {
                    if (id) {
                        obj.__data.id = id;
                        obj.__dataWas.id = id;
                        defineReadonlyProp(obj, 'id', id);
                    }
                    if (rev) {
                        obj._rev = rev
                    }
                    if (err) {
                        return callback(err, obj);
                    }
                    saveDone.call(obj, function () {
                        createDone.call(obj, function () {
                            callback(err, obj);
                        });
                    });
                }, obj);
            }, obj, callback);
        }, obj, callback);
    }

    return obj;
};

function stillConnecting(schema, obj, args) {
    if (schema.connected) return false;
    var method = args.callee;
    schema.once('connected', function () {
        method.apply(obj, [].slice.call(args));
    });
    if (!schema.connecting) schema.connect();
    return true;
};

/**
 * Update or insert
 */
AbstractClass.upsert = AbstractClass.updateOrCreate = function upsert(data, callback) {
    if (stillConnecting(this.schema, this, arguments)) return;

    var Model = this;
    if (!data.id) return this.create(data, callback);
    if (this.schema.adapter.updateOrCreate) {
        var inst = new Model(data);
        
        this.schema.adapter.updateOrCreate(Model.modelName, data, function (err, data) {
            var obj;
            if (data) {
                inst._initProperties(data);
                obj = inst;
            } else {
                obj = null;
            }
            callback(err, obj);
        });
    } else {
        this.find(data.id, function (err, inst) {
            if (err) return callback(err);
            if (inst) {
                inst.updateAttributes(data, callback);
            } else {
                var obj = new Model(data);
                obj.save(data, callback);
            }
        });
    }
};

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection,
 * if not found, create using data provided as second argument
 * 
 * @param {Object} query - search conditions: {where: {test: 'me'}}.
 * @param {Object} data - object to create.
 * @param {Function} cb - callback called with (err, instance)
 */
AbstractClass.findOrCreate = function findOrCreate(query, data, callback) {
    if (typeof query === 'undefined') {
        query = {where: {}};
    }
    if (typeof data === 'function' || typeof data === 'undefined') {
        callback = data;
        data = query && query.where;
    }
    if (typeof callback === 'undefined') {
        callback = function () {};
    }

    var t = this;
    this.findOne(query, function (err, record) {
        if (err) return callback(err);
        if (record) return callback(null, record);
        t.create(data, callback);
    });
};

/**
 * Check whether object exitst in database
 *
 * @param {id} id - identifier of object (primary key value)
 * @param {Function} cb - callbacl called with (err, exists: Bool)
 */
AbstractClass.exists = function exists(id, cb) {
    if (stillConnecting(this.schema, this, arguments)) return;

    if (id) {
        this.schema.adapter.exists(this.modelName, id, cb);
    } else {
        cb(new Error('Model::exists requires positive id argument'));
    }
};

/**
 * Find object by id
 *
 * @param {id} id - primary key value
 * @param {Function} cb - callback called with (err, instance)
 */
AbstractClass.find = function find(id, cb) {
    if (stillConnecting(this.schema, this, arguments)) return;

    this.schema.adapter.find(this.modelName, id, function (err, data) {
        var obj = null;
        if (data) {
            if (!data.id) {
                data.id = id;
            }
            obj = new this();
            obj._initProperties(data, false);
        }
        cb(err, obj);
    }.bind(this));
};

/**
 * Find all instances of Model, matched by query
 * make sure you have marked as `index: true` fields for filter or sort
 *
 * @param {Object} params (optional)
 *
 * - where: Object `{ key: val, key2: {gt: 'val2'}}`
 * - include: String, Object or Array. See AbstractClass.include documentation.
 * - order: String
 * - limit: Number
 * - skip: Number
 *
 * @param {Function} callback (required) called with arguments:
 *
 * - err (null or Error)
 * - Array of instances
 */
AbstractClass.all = function all(params, cb) {
    if (stillConnecting(this.schema, this, arguments)) return;

    if (arguments.length === 1) {
        cb = params;
        params = null;
    }
    if (params) {
        if ('skip' in params) {
            params.offset = params.skip;
        } else if ('offset' in params) {
            params.skip = params.offset;
        }
    }
    var constr = this;
    this.schema.adapter.all(this.modelName, params, function (err, data) {
        if (data && data.forEach) {
            if (!params || !params.onlyKeys) {
                data.forEach(function (d, i) {
                    var obj = new constr;
                    obj._initProperties(d, false);
                    if (params && params.include && params.collect) {
                        data[i] = obj.__cachedRelations[params.collect];
                    } else {
                        data[i] = obj;
                    }
                });
            }
            if (data && data.countBeforeLimit) {
                data.countBeforeLimit = data.countBeforeLimit;
            }
            cb(err, data);
        }
        else
            cb(err, []);
    });
};

/**
 * Iterate through dataset and perform async method iterator. This method
 * designed to work with large datasets loading data by batches.
 *
 * @param {Object} filter - query conditions. Same as for `all` may contain
 * optional member `batchSize` to specify size of batch loaded from db. Optional.
 * @param {Function} iterator - method(obj, next) called on each obj.
 * @param {Function} callback - method(err) called on complete or error.
 */
AbstractClass.iterate = function map(filter, iterator, callback) {
    var Model = this;
    if ('function' === typeof filter) {
        if ('function' === typeof iterator) {
            callback = iterator;
        }
        iterator = filter;
        filter = {};
    }

    var batchSize = filter.limit = filter.batchSize || 1000;
    var batchNumber = -1;

    nextBatch();

    function nextBatch() {
        batchNumber += 1;
        filter.skip = filter.offset = batchNumber * batchSize;
        Model.all(filter, function(err, collection) {
            if (err || collection.length === 0) {
                return done(err);
            }
            var i = -1;
            nextItem();
            function nextItem(err) {
                if (err) {
                    return done(err);
                }
                if (++i >= collection.length) {
                    return nextBatch();
                }
                (global.setImmediate || process.nextTick)(function() {
                    iterator(collection[i], nextItem, filter.offset + i);
                });
            }
        });
    }

    function done(err) {
        if ('function' === typeof callback) {
            callback(err);
        }
    }
};

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection
 * 
 * @param {Object} params - search conditions: {where: {test: 'me'}}
 * @param {Function} cb - callback called with (err, instance)
 */
AbstractClass.findOne = function findOne(params, cb) {
    if (stillConnecting(this.schema, this, arguments)) return;

    if (typeof params === 'function') {
        cb = params;
        params = {};
    }
    params.limit = 1;
    this.all(params, function (err, collection) {
        if (err || !collection || !collection.length > 0) return cb(err, null);
        cb(err, collection[0]);
    });
};

/**
 * Destroy all records
 * @param {Function} cb - callback called with (err)
 */
AbstractClass.destroyAll = function destroyAll(cb) {
    if (stillConnecting(this.schema, this, arguments)) return;

    this.schema.adapter.destroyAll(this.modelName, function (err) {
        if ('function' === typeof cb) {
            cb(err);
        }
    }.bind(this));
};

/**
 * Return count of matched records
 *
 * @param {Object} where - search conditions (optional)
 * @param {Function} cb - callback, called with (err, count)
 */
AbstractClass.count = function (where, cb) {
    if (stillConnecting(this.schema, this, arguments)) return;

    if (typeof where === 'function') {
        cb = where;
        where = null;
    }
    this.schema.adapter.count(this.modelName, cb, where);
};

/**
 * Return string representation of class
 *
 * @override default toString method
 */
AbstractClass.toString = function () {
    return '[Model ' + this.modelName + ']';
};

/**
 * Save instance. When instance haven't id, create method called instead.
 * Triggers: validate, save, update | create
 * @param options {validate: true, throws: false} [optional]
 * @param callback(err, obj)
 */
AbstractClass.prototype.save = function (options, callback) {
    if (stillConnecting(this.constructor.schema, this, arguments)) return;

    if (typeof options == 'function') {
        callback = options;
        options = {};
    }

    callback = callback || function () {};
    options = options || {};

    if (!('validate' in options)) {
        options.validate = true;
    }
    if (!('throws' in options)) {
        options.throws = false;
    }

    var inst = this;
    var data = inst.toObject(true);
    var Model = this.constructor;
    var modelName = Model.modelName;

    if (!this.id) {
        // Pass options and this to create
        var data = { 
            data: this,
            options: options
        };
        return Model.create(data, callback);
    }

    // validate first
    if (!options.validate) {
        return save();
    }

    inst.isValid(function (valid) {
        if (valid) {
            save();
        } else {
            var err = new ValidationError(inst);
            // throws option is dangerous for async usage
            if (options.throws) {
                throw err;
            }
            callback(err, inst);
        }
    }, data);

    // then save
    function save() {
        inst.trigger('save', function (saveDone) {
            inst.trigger('update', function (updateDone) {
                inst._adapter().save(modelName, inst.constructor._forDB(data), function (err) {
                    if (err) {
                        return callback(err, inst);
                    }
                    inst._initProperties(data, false);
                    updateDone.call(inst, function () {
                        saveDone.call(inst, function () {
                            callback(err, inst);
                        });
                    });
                });
            }, data, callback);
        }, data, callback);
    }
};

AbstractClass.prototype.isNewRecord = function () {
    return !this.id;
};

/**
 * Return adapter of current record
 * @private
 */
AbstractClass.prototype._adapter = function () {
    return this.schema.adapter;
};

/**
 * Convert instance to Object
 *
 * @param {Boolean} onlySchema - restrict properties to schema only, default false
 * when onlySchema == true, only properties defined in schema returned, 
 * otherwise all enumerable properties returned
 * @returns {Object} - canonical object representation (no getters and setters)
 */
AbstractClass.prototype.toObject = function (onlySchema) {
    var data = {};
    var ds = this.constructor.schema.definitions[this.constructor.modelName];
    var properties = ds.properties;
    var self = this;

    this.constructor.forEachProperty(function (attr) {
        if (self[attr] instanceof List) {
            data[attr] = self[attr].toObject();
        } else if (self.__data.hasOwnProperty(attr)) {
            data[attr] = self[attr];
        } else {
            data[attr] = null;
        }
    });

    if (!onlySchema) {
        Object.keys(self).forEach(function (attr) {
            if (!data.hasOwnProperty(attr)) {
                data[attr] = self[attr];
            }
        });
    }

    return data;
};

// AbstractClass.prototype.hasOwnProperty = function (prop) {
//     return this.__data && this.__data.hasOwnProperty(prop) ||
//         Object.getOwnPropertyNames(this).indexOf(prop) !== -1;
// };

AbstractClass.prototype.toJSON = function () {
    return this.toObject();
};

/**
 * Delete object from persistence
 *
 * @triggers `destroy` hook (async) before and after destroying object
 */
AbstractClass.prototype.destroy = function (cb) {
    if (stillConnecting(this.constructor.schema, this, arguments)) return;

    this.trigger('destroy', function (destroyed) {
        this._adapter().destroy(this.constructor.modelName, this.id, function (err) {
            if (err) {
                return cb(err);
            }

            destroyed(function () {
                if(cb) cb();
            });
        }.bind(this));
    }, this.toObject(), cb);
};

/**
 * Update single attribute
 *
 * equals to `updateAttributes({name: value}, cb)
 *
 * @param {String} name - name of property
 * @param {Mixed} value - value of property
 * @param {Function} callback - callback called with (err, instance)
 */
AbstractClass.prototype.updateAttribute = function updateAttribute(name, value, callback) {
    var data = {};
    data[name] = value;
    this.updateAttributes(data, callback);
};

/**
 * Update set of attributes
 *
 * this method performs validation before updating
 *
 * @trigger `validation`, `save` and `update` hooks
 * @param {Object} data - data to update
 * @param {Function} callback - callback called with (err, instance)
 */
AbstractClass.prototype.updateAttributes = function updateAttributes(data, cb) {
    if (stillConnecting(this.constructor.schema, this, arguments)) return;

    var inst = this;
    var modelName = this.constructor.modelName;

    if (typeof data === 'function') {
        cb = data;
        data = null;
    }

    if (!data) {
        data = {};
    }

    // update instance's properties
    Object.keys(data).forEach(function (key) {
        inst[key] = data[key];
    });

    inst.isValid(function (valid) {
        if (!valid) {
            if (cb) {
                cb(new ValidationError(inst), inst);
            }
        } else {
            inst.trigger('save', function (saveDone) {
                inst.trigger('update', function (done) {

                    Object.keys(data).forEach(function (key) {
                        inst[key] = data[key];
                    });

                    inst._adapter().updateAttributes(modelName, inst.id, inst.constructor._forDB(inst.toObject(true)), function (err) {
                        if (!err) {
                            // update _was attrs
                            Object.keys(data).forEach(function (key) {
                                inst.__dataWas[key] = inst.__data[key];
                            });
                        }
                        done.call(inst, function () {
                            saveDone.call(inst, function () {
                                if (cb) {
                                    cb(err, inst);
                                }
                            });
                        });
                    });
                }, data, cb);
            }, data, cb);
        }
    }, data);
};

AbstractClass.prototype.fromObject = function (obj) {
    Object.keys(obj).forEach(function (key) {
        this[key] = obj[key];
    }.bind(this));
};

/**
 * Checks is property changed based on current property and initial value
 *
 * @param {String} attr - property name
 * @return Boolean
 */
AbstractClass.prototype.propertyChanged = function propertyChanged(attr) {
    return this.__data[attr] !== this.__dataWas[attr];
};

/**
 * Reload object from persistence
 *
 * @requires `id` member of `object` to be able to call `find`
 * @param {Function} callback - called with (err, instance) arguments
 */
AbstractClass.prototype.reload = function reload(callback) {
    if (stillConnecting(this.constructor.schema, this, arguments)) return;

    this.constructor.find(this.id, callback);
};

/**
 * Reset dirty attributes
 *
 * this method does not perform any database operation it just reset object to it's
 * initial state
 */
AbstractClass.prototype.reset = function () {
    var obj = this;
    Object.keys(obj).forEach(function (k) {
        if (k !== 'id' && !obj.constructor.schema.definitions[obj.constructor.modelName].properties[k]) {
            delete obj[k];
        }
        if (obj.propertyChanged(k)) {
            obj[k] = obj[k + '_was'];
        }
    });
};

AbstractClass.prototype.inspect = function () {
    return util.inspect(this.__data, false, 4, true);
};


/**
 * Check whether `s` is not undefined
 * @param {Mixed} s
 * @return {Boolean} s is undefined
 */
function isdef(s) {
    var undef;
    return s !== undef;
}

/**
 * Define readonly property on object
 *
 * @param {Object} obj
 * @param {String} key
 * @param {Mixed} value
 */
function defineReadonlyProp(obj, key, value) {
    Object.defineProperty(obj, key, {
        writable: false,
        enumerable: true,
        configurable: true,
        value: value
    });
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./hooks.js":50,"./include.js":51,"./list.js":52,"./relations.js":54,"./validations.js":57,"_process":66,"util":68}],54:[function(require,module,exports){
/**
 * Dependencies
 */
var i8n = require('inflection');
var defineScope = require('./scope.js').defineScope;

/**
 * Relations mixins for ./model.js
 */
var Model = require('./model.js');

Model.relationNameFor = function relationNameFor(foreignKey) {
    for (var rel in this.relations) {
        if (this.relations[rel].type === 'belongsTo' && this.relations[rel].keyFrom === foreignKey) {
            return rel;
        }
    }
};

/**
 * Declare hasMany relation
 *
 * @param {Model} anotherClass - class to has many
 * @param {Object} params - configuration {as:, foreignKey:}
 * @example `User.hasMany(Post, {as: 'posts', foreignKey: 'authorId'});`
 */
Model.hasMany = function hasMany(anotherClass, params) {
    var thisClass = this, thisClassName = this.modelName;
    params = params || {};
    if (typeof anotherClass === 'string') {
        params.as = anotherClass;
        if (params.model) {
            anotherClass = params.model;
        } else {
            var anotherClassName = i8n.singularize(anotherClass).toLowerCase();
            for(var name in this.schema.models) {
                if (name.toLowerCase() === anotherClassName) {
                    anotherClass = this.schema.models[name];
                }
            }
        }
    }
    var methodName = params.as ||
        i8n.camelize(i8n.pluralize(anotherClass.modelName), true);
    var fk = params.foreignKey || i8n.camelize(thisClassName + '_id', true);

    this.relations[methodName] = {
        type: 'hasMany',
        keyFrom: 'id',
        keyTo: fk,
        modelTo: anotherClass,
        multiple: true
    };
    // each instance of this class should have method named
    // pluralize(anotherClass.modelName)
    // which is actually just anotherClass.all({where: {thisModelNameId: this.id}}, cb);
    var scopeMethods = {
        find: find,
        destroy: destroy
    };
    if (params.through) {
        var fk2 = i8n.camelize(anotherClass.modelName + '_id', true);
        scopeMethods.create = function create(data, done) {
            if (typeof data !== 'object') {
                done = data;
                data = {};
            }
            if ('function' !== typeof done) {
                done = function() {};
            }
            var self = this;
            var id = this.id;
            anotherClass.create(data, function(err, ac) {
                if (err) return done(err, ac);
                var d = {};
                d[params.through.relationNameFor(fk)] = self;
                d[params.through.relationNameFor(fk2)] = ac;
                params.through.create(d, function(e) {
                    if (e) {
                        ac.destroy(function() {
                            done(e);
                        });
                    } else {
                        done(err, ac);
                    }
                });
            });
        };
        scopeMethods.add = function(acInst, data, done) {
            if (typeof data === 'function') {
                done = data;
                data = {};
            }
            var query = {};
            query[fk] = this.id;
            data[params.through.relationNameFor(fk)] = this;
            query[fk2] = acInst.id || acInst;
            data[params.through.relationNameFor(fk2)] = acInst;
            params.through.findOrCreate({where: query}, data, done);
        };
        scopeMethods.remove = function(acInst, done) {
            var q = {};
            q[fk] = this.id;
            q[fk2] = acInst.id || acInst;
            params.through.findOne({where: q}, function(err, d) {
                if (err) {
                    return done(err);
                }
                if (!d) {
                    return done();
                }
                d.destroy(done);
            });
        };
        delete scopeMethods.destroy;
    }
    defineScope(this.prototype, params.through || anotherClass, methodName, function () {
        var filter = {};
        filter.where = {};
        filter.where[fk] = this.id;
        if (params.through) {
            filter.collect = i8n.camelize(anotherClass.modelName, true);
            filter.include = filter.collect;
        }
        return filter;
    }, scopeMethods);

    if (!params.through) {
        // obviously, anotherClass should have attribute called `fk`
        anotherClass.schema.defineForeignKey(anotherClass.modelName, fk, this.modelName);
    }

    function find(id, cb) {
        anotherClass.find(id, function (err, inst) {
            if (err) return cb(err);
            if (!inst) return cb(new Error('Not found'));
            if (inst[fk] && inst[fk].toString() == this.id.toString()) {
                cb(null, inst);
            } else {
                cb(new Error('Permission denied'));
            }
        }.bind(this));
    }

    function destroy(id, cb) {
        var self = this;
        anotherClass.find(id, function (err, inst) {
            if (err) return cb(err);
            if (!inst) return cb(new Error('Not found'));
            if (inst[fk] && inst[fk].toString() == self.id.toString()) {
                inst.destroy(cb);
            } else {
                cb(new Error('Permission denied'));
            }
        });
    }

};

/**
 * Declare belongsTo relation
 *
 * @param {Class} anotherClass - class to belong
 * @param {Object} params - configuration {as: 'propertyName', foreignKey: 'keyName'}
 *
 * **Usage examples**
 * Suppose model Post have a *belongsTo* relationship with User (the author of the post). You could declare it this way:
 * Post.belongsTo(User, {as: 'author', foreignKey: 'userId'});
 *
 * When a post is loaded, you can load the related author with:
 * post.author(function(err, user) {
 *     // the user variable is your user object
 * });
 *
 * The related object is cached, so if later you try to get again the author, no additional request will be made.
 * But there is an optional boolean parameter in first position that set whether or not you want to reload the cache:
 * post.author(true, function(err, user) {
 *     // The user is reloaded, even if it was already cached.
 * });
 *
 * This optional parameter default value is false, so the related object will be loaded from cache if available.
 */
Model.belongsTo = function (anotherClass, params) {
    params = params || {};
    if ('string' === typeof anotherClass) {
        params.as = anotherClass;
        if (params.model) {
            anotherClass = params.model;
        } else {
            var anotherClassName = anotherClass.toLowerCase();
            for(var name in this.schema.models) {
                if (name.toLowerCase() === anotherClassName) {
                    anotherClass = this.schema.models[name];
                }
            }
        }
    }
    var methodName = params.as || i8n.camelize(anotherClass.modelName, true);
    var fk = params.foreignKey || methodName + 'Id';

    this.relations[methodName] = {
        type: 'belongsTo',
        keyFrom: fk,
        keyTo: 'id',
        modelTo: anotherClass,
        multiple: false
    };

    this.schema.defineForeignKey(this.modelName, fk, anotherClass.modelName);
    this.prototype['__finders__'] = this.prototype['__finders__'] || {};

    this.prototype['__finders__'][methodName] = function (id, cb) {
        if (id === null) {
            cb(null, null);
            return;
        }
        anotherClass.find(id, function (err,inst) {
            if (err) {
                return cb(err);
            }
            if (!inst) {
                return cb(null, null);
            }
            if (inst.id.toString() === this[fk].toString()) {
                cb(null, inst);
            } else {
                cb(new Error('Permission denied'));
            }
        }.bind(this));
    };

    this.prototype[methodName] = function (refresh, p) {
        if (arguments.length === 1) {
            p = refresh;
            refresh = false;
        } else if (arguments.length > 2) {
            throw new Error('Method can\'t be called with more than two arguments');
        }
        var self = this;
        var cachedValue;
        if (!refresh && this.__cachedRelations && (typeof this.__cachedRelations[methodName] !== 'undefined')) {
            cachedValue = this.__cachedRelations[methodName];
        }
        if (p instanceof Model) { // acts as setter
            this[fk] = p.id;
            this.__cachedRelations[methodName] = p;
        } else if (typeof p === 'function') { // acts as async getter
            if (typeof cachedValue === 'undefined') {
                this.__finders__[methodName].apply(self, [this[fk], function(err, inst) {
                    if (!err) {
                        self.__cachedRelations[methodName] = inst;
                    }
                    p(err, inst);
                }]);
                return this[fk];
            } else {
                p(null, cachedValue);
                return cachedValue;
            }
        } else if (typeof p === 'undefined') { // acts as sync getter
            return this[fk];
        } else { // setter
            this[fk] = p;
            delete this.__cachedRelations[methodName];
        }
    };

};

/**
 * Many-to-many relation
 *
 * Post.hasAndBelongsToMany('tags'); creates connection model 'PostTag'
 */
Model.hasAndBelongsToMany = function hasAndBelongsToMany(anotherClass, params) {
    params = params || {};
    var models = this.schema.models;

    if ('string' === typeof anotherClass) {
        params.as = anotherClass;
        if (params.model) {
            anotherClass = params.model;
        } else {
            anotherClass = lookupModel(i8n.singularize(anotherClass)) ||
                anotherClass;
        }
        if (typeof anotherClass === 'string') {
            throw new Error('Could not find "' + anotherClass + '" relation for ' + this.modelName);
        }
    }

    if (!params.through) {
        var name1 = this.modelName + anotherClass.modelName;
        var name2 = anotherClass.modelName + this.modelName;
        params.through = lookupModel(name1) || lookupModel(name2) ||
            this.schema.define(name1);
    }
    params.through.belongsTo(this);
    params.through.belongsTo(anotherClass);

    this.hasMany(anotherClass, {as: params.as, through: params.through});

    function lookupModel(modelName) {
        var lookupClassName = modelName.toLowerCase();
        for (var name in models) {
            if (name.toLowerCase() === lookupClassName) {
                return models[name];
            }
        }
    }

};

},{"./model.js":53,"./scope.js":56,"inflection":58}],55:[function(require,module,exports){
(function (process,__dirname){
/**
 * Module dependencies
 */
var AbstractClass = require('./model.js');
var List = require('./list.js');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var fs = require('fs');

var existsSync = fs.existsSync || path.existsSync;

/**
 * Export public API
 */
exports.Schema = Schema;
// exports.AbstractClass = AbstractClass;

/**
 * Helpers
 */
var slice = Array.prototype.slice;

Schema.Text = function Text() {};
Schema.JSON = function JSON() {};

Schema.types = {};
Schema.registerType = function (type) {
    this.types[type.name] = type;
};

Schema.registerType(Schema.Text);
Schema.registerType(Schema.JSON);


/**
 * Schema - adapter-specific classes factory.
 *
 * All classes in single schema shares same adapter type and
 * one database connection
 *
 * @param name - type of schema adapter (mysql, mongoose, sequelize, redis)
 * @param settings - any database-specific settings which we need to
 * establish connection (of course it depends on specific adapter)
 *
 * - host
 * - port
 * - username
 * - password
 * - database
 * - debug {Boolean} = false
 *
 * @example Schema creation, waiting for connection callback
 * ```
 * var schema = new Schema('mysql', { database: 'myapp_test' });
 * schema.define(...);
 * schema.on('connected', function () {
 *     // work with database
 * });
 * ```
 */
function Schema(name, settings) {
    var schema = this;
    // just save everything we get
    this.name = name;
    this.settings = settings || {};

    // Disconnected by default
    this.connected = false;
    this.connecting = false;

    // create blank models pool
    this.models = {};
    this.definitions = {};

    // and initialize schema using adapter
    // this is only one initialization entry point of adapter
    // this module should define `adapter` member of `this` (schema)
    var adapter;
    if (typeof name === 'object') {
        adapter = name;
        this.name = adapter.name;
    } else if (name.match(/^\//)) {
        // try absolute path
        adapter = require(name);
    } else if (existsSync(__dirname + '/adapters/' + name + '.js')) {
        // try built-in adapter
        adapter = require('./adapters/' + name);
    } else {
        // try foreign adapter
        try {
            adapter = require('jugglingdb-' + name);
        } catch (e) {
            return console.log('\nWARNING: JugglingDB adapter "' + name + '" is not installed,\nso your models would not work, to fix run:\n\n    npm install jugglingdb-' + name, '\n');
        }
    }

    adapter.initialize(this, function () {

        this.adapter.log = function (query, start) {
            schema.log(query, start);
        };

        this.adapter.logger = function (query) {
            var t1 = Date.now();
            var log = this.log;
            return function (q) {
                log(q || query, t1);
            };
        };

        this.connected = true;
        this.emit('connected');

    }.bind(this));

    // we have an adaper now?
    if (!this.adapter) {
        throw new Error('Adapter "' + name + '" is not defined correctly: it should define `adapter` member of schema synchronously');
    }


    schema.connect = function(cb) {
        var schema = this;
        schema.connecting = true;
        if (schema.adapter.connect) {
            schema.adapter.connect(function(err) {
                if (!err) {
                    schema.connected = true;
                    schema.connecting = false;
                    schema.emit('connected');
                }
                if (cb) {
                    cb(err);
                }
            });
        } else {
            if (cb) {
                process.nextTick(cb);
            }
        }
    };
};

util.inherits(Schema, EventEmitter);

/**
 * Define class
 *
 * @param {String} className
 * @param {Object} properties - hash of class properties in format
 *   `{property: Type, property2: Type2, ...}`
 *   or
 *   `{property: {type: Type}, property2: {type: Type2}, ...}`
 * @param {Object} settings - other configuration of class
 * @return newly created class
 *
 * @example simple case
 * ```
 * var User = schema.define('User', {
 *     email: String,
 *     password: String,
 *     birthDate: Date,
 *     activated: Boolean
 * });
 * ```
 * @example more advanced case
 * ```
 * var User = schema.define('User', {
 *     email: { type: String, limit: 150, index: true },
 *     password: { type: String, limit: 50 },
 *     birthDate: Date,
 *     registrationDate: {type: Date, default: function () { return new Date }},
 *     activated: { type: Boolean, default: false }
 * });
 * ```
 */
Schema.prototype.define = function defineClass(className, properties, settings) {
    var schema = this;
    var args = slice.call(arguments);

    if (!className) throw new Error('Class name required');
    if (args.length == 1) properties = {}, args.push(properties);
    if (args.length == 2) settings   = {}, args.push(settings);

    settings = settings || {};

    if ('function' === typeof properties) {
        var props = {};
        properties({
            property: function(name, type, settings) {
                settings = settings || {};
                settings.type = type;
                props[name] = settings;
            },
            set: function(key, val) {
                settings[key] = val;
            }
        });
        properties = props;
    }

    properties = properties || {};

    // every class can receive hash of data as optional param
    var NewClass = function ModelConstructor(data, schema) {
        if (!(this instanceof ModelConstructor)) {
            return new ModelConstructor(data);
        }
        AbstractClass.call(this, data);
        hiddenProperty(this, 'schema', schema || this.constructor.schema);
    };

    hiddenProperty(NewClass, 'schema', schema);
    hiddenProperty(NewClass, 'modelName', className);
    hiddenProperty(NewClass, 'tableName', settings.table || className);
    hiddenProperty(NewClass, 'relations', {});

    // inherit AbstractClass methods
    for (var i in AbstractClass) {
        NewClass[i] = AbstractClass[i];
    }
    for (var j in AbstractClass.prototype) {
        NewClass.prototype[j] = AbstractClass.prototype[j];
    }

    NewClass.getter = {};
    NewClass.setter = {};

    standartize(properties, settings);

    // store class in model pool
    this.models[className] = NewClass;
    this.definitions[className] = {
        properties: properties,
        settings: settings
    };

    // pass control to adapter
    this.adapter.define({
        model:      NewClass,
        properties: properties,
        settings:   settings
    });

    NewClass.prototype.__defineGetter__('id', function () {
        return this.__data.id;
    });

    properties.id = properties.id || { type: Number };

    NewClass.forEachProperty = function (cb) {
        Object.keys(properties).forEach(cb);
    };

    NewClass.registerProperty = function (attr) {
        var DataType = properties[attr].type;
        if (DataType instanceof Array) {
            DataType = List;
        } else if (DataType.name === 'Date') {
            var OrigDate = Date;
            DataType = function Date(arg) {
                return new OrigDate(arg);
            };
        } else if (DataType.name === 'JSON' || DataType === JSON) {
            DataType = function JSON(s) {
                return s;
            };
        } else if (DataType.name === 'Text' || DataType === Schema.Text) {
            DataType = function Text(s) {
                return s;
            };
        }

        Object.defineProperty(NewClass.prototype, attr, {
            get: function () {
                if (NewClass.getter[attr]) {
                    return NewClass.getter[attr].call(this);
                } else {
                    return this.__data[attr];
                }
            },
            set: function (value) {
                if (NewClass.setter[attr]) {
                    NewClass.setter[attr].call(this, value);
                } else {
                    if (value === null || value === undefined || typeof DataType === 'object') {
                        this.__data[attr] = value;
                    } else if (DataType === Boolean) {
                        this.__data[attr] = value === 'false' ? false : !!value;
                    } else {
                        this.__data[attr] = DataType(value);
                    }
                }
            },
            configurable: true,
            enumerable: true
        });

        NewClass.prototype.__defineGetter__(attr + '_was', function () {
            return this.__dataWas[attr];
        });

        Object.defineProperty(NewClass.prototype, '_' + attr, {
            get: function () {
                return this.__data[attr];
            },
            set: function (value) {
                this.__data[attr] = value;
            },
            configurable: true,
            enumerable: false
        });
    };

    NewClass.forEachProperty(NewClass.registerProperty);

    this.emit('define', NewClass, className, properties, settings);

    return NewClass;

};

    function standartize(properties, settings) {
        Object.keys(properties).forEach(function (key) {
            var v = properties[key];
            if (
                typeof v === 'function' ||
                typeof v === 'object' && v && v.constructor.name === 'Array'
            ) {
                properties[key] = { type: v };
            }
        });
        // TODO: add timestamps fields
        // when present in settings: {timestamps: true}
        // or {timestamps: {created: 'created_at', updated: false}}
        // by default property names: createdAt, updatedAt
    }

/**
 * Define single property named `prop` on `model`
 *
 * @param {String} model - name of model
 * @param {String} prop - name of propery
 * @param {Object} params - property settings
 */
Schema.prototype.defineProperty = function (model, prop, params) {
    this.definitions[model].properties[prop] = params;
    this.models[model].registerProperty(prop);
    if (this.adapter.defineProperty) {
        this.adapter.defineProperty(model, prop, params);
    }
};

/**
 * Extend existing model with bunch of properties
 *
 * @param {String} model - name of model
 * @param {Object} props - hash of properties
 *
 * Example:
 *
 *     // Instead of doing this:
 *
 *     // amend the content model with competition attributes
 *     db.defineProperty('Content', 'competitionType', { type: String });
 *     db.defineProperty('Content', 'expiryDate', { type: Date, index: true });
 *     db.defineProperty('Content', 'isExpired', { type: Boolean, index: true });
 *
 *     // schema.extend allows to
 *     // extend the content model with competition attributes
 *     db.extendModel('Content', {
 *       competitionType: String,
 *       expiryDate: { type: Date, index: true },
 *       isExpired: { type: Boolean, index: true }
 *     });
 */
Schema.prototype.extendModel = function (model, props) {
    var t = this;
    standartize(props, {});
    Object.keys(props).forEach(function (propName) {
        var definition = props[propName];
        t.defineProperty(model, propName, definition);
    });
};

/**
 * Drop each model table and re-create.
 * This method make sense only for sql adapters.
 *
 * @warning All data will be lost! Use autoupdate if you need your data.
 */
Schema.prototype.automigrate = function (cb) {
    this.freeze();
    if (this.adapter.automigrate) {
        this.adapter.automigrate(cb);
    } else if (cb) {
        cb();
    }
};

/**
 * Update existing database tables.
 * This method make sense only for sql adapters.
 */
Schema.prototype.autoupdate = function (cb) {
    this.freeze();
    if (this.adapter.autoupdate) {
        this.adapter.autoupdate(cb);
    } else if (cb) {
        cb();
    }
};

/**
 * Check whether migrations needed
 * This method make sense only for sql adapters.
 */
Schema.prototype.isActual = function (cb) {
    this.freeze();
    if (this.adapter.isActual) {
        this.adapter.isActual(cb);
    } else if (cb) {
        cb(null, true);
    }
};

/**
 * Log benchmarked message. Do not redefine this method, if you need to grab
 * chema logs, use `schema.on('log', ...)` emitter event
 *
 * @private used by adapters
 */
Schema.prototype.log = function (sql, t) {
    this.emit('log', sql, t);
};

/**
 * Freeze schema. Behavior depends on adapter
 */
Schema.prototype.freeze = function freeze() {
    if (this.adapter.freezeSchema) {
        this.adapter.freezeSchema();
    }
}

/**
 * Backward compatibility. Use model.tableName prop instead.
 * Return table name for specified `modelName`
 * @param {String} modelName
 */
Schema.prototype.tableName = function (modelName) {
    return this.models[modelName].model.tableName;
};

/**
 * Define foreign key
 * @param {String} className
 * @param {String} key - name of key field
 */
Schema.prototype.defineForeignKey = function defineForeignKey(className, key, foreignClassName) {
    // quit if key already defined
    if (this.definitions[className].properties[key]) return;

    if (this.adapter.defineForeignKey) {
        var cb = function (err, keyType) {
            if (err) throw err;
            this.definitions[className].properties[key] = {type: keyType};
        }.bind(this);
        switch (this.adapter.defineForeignKey.length) {
            case 4:
                this.adapter.defineForeignKey(className, key, foreignClassName, cb);
            break;
            default:
            case 3:
                this.adapter.defineForeignKey(className, key, cb);
            break;
        }
    } else {
        this.definitions[className].properties[key] = {type: Number};
    }
    this.models[className].registerProperty(key);
};

/**
 * Close database connection
 */
Schema.prototype.disconnect = function disconnect(cb) {
    if (typeof this.adapter.disconnect === 'function') {
        this.connected = false;
        this.adapter.disconnect(cb);
    } else if (cb) {
        cb();
    }
};

Schema.prototype.copyModel = function copyModel(Master) {
    var schema = this;
    var className = Master.modelName;
    var md = Master.schema.definitions[className];
    var Slave = function SlaveModel() {
        Master.apply(this, [].slice.call(arguments));
        this.schema = schema;
    };

    util.inherits(Slave, Master);

    Slave.__proto__ = Master;

    hiddenProperty(Slave, 'schema', schema);
    hiddenProperty(Slave, 'modelName', className);
    hiddenProperty(Slave, 'tableName', Master.tableName);
    hiddenProperty(Slave, 'relations', Master.relations);

    if (!(className in schema.models)) {

        // store class in model pool
        schema.models[className] = Slave;
        schema.definitions[className] = {
            properties: md.properties,
            settings: md.settings
        };

        if (!schema.isTransaction) {
            schema.adapter.define({
                model:      Slave,
                properties: md.properties,
                settings:   md.settings
            });
        }

    }

    return Slave;
};

Schema.prototype.transaction = function() {
    var schema = this;
    var transaction = new EventEmitter;
    transaction.isTransaction = true;
    transaction.origin = schema;
    transaction.name = schema.name;
    transaction.settings = schema.settings;
    transaction.connected = false;
    transaction.connecting = false;
    transaction.adapter = schema.adapter.transaction();

    // create blank models pool
    transaction.models = {};
    transaction.definitions = {};

    for (var i in schema.models) {
        schema.copyModel.call(transaction, schema.models[i]);
    }

    transaction.connect = schema.connect;

    transaction.exec = function(cb) {
        transaction.adapter.exec(cb);
    };

    return transaction;
};

/**
 * Define hidden property
 */
function hiddenProperty(where, property, value) {
    Object.defineProperty(where, property, {
        writable: false,
        enumerable: false,
        configurable: false,
        value: value
    });
}

/**
 * Define readonly property on object
 *
 * @param {Object} obj
 * @param {String} key
 * @param {Mixed} value
 */
function defineReadonlyProp(obj, key, value) {
    Object.defineProperty(obj, key, {
        writable: false,
        enumerable: true,
        configurable: true,
        value: value
    });
}


}).call(this,require('_process'),"/node_modules/resource/node_modules/jugglingdb/lib")
},{"./list.js":52,"./model.js":53,"_process":66,"events":63,"fs":62,"path":65,"util":68}],56:[function(require,module,exports){
/**
 * Module exports
 */
exports.defineScope = defineScope;

/**
 * Scope mixin for ./model.js
 */
var Model = require('./model.js');

/**
 * Define scope
 * TODO: describe behavior and usage examples
 */
Model.scope = function (name, params) {
    defineScope(this, this, name, params);
};

function defineScope(cls, targetClass, name, params, methods) {

    // collect meta info about scope
    if (!cls._scopeMeta) {
        cls._scopeMeta = {};
    }

    // only makes sence to add scope in meta if base and target classes
    // are same
    if (cls === targetClass) {
        cls._scopeMeta[name] = params;
    } else {
        if (!targetClass._scopeMeta) {
            targetClass._scopeMeta = {};
        }
    }

    Object.defineProperty(cls, name, {
        enumerable: false,
        configurable: true,
        get: function () {
            var f = function caller(condOrRefresh, cb) {
                var actualCond = {};
                var actualRefresh = false;
                var saveOnCache = true;
                if (arguments.length === 1) {
                    cb = condOrRefresh;
                } else if (arguments.length === 2) {
                    if (typeof condOrRefresh === 'boolean') {
                        actualRefresh = condOrRefresh;
                    } else {
                        actualCond = condOrRefresh;
                        actualRefresh = true;
                        saveOnCache = false;
                    }
                } else {
                    throw new Error('Method can be only called with one or two arguments');
                }

                if (!this.__cachedRelations || (typeof this.__cachedRelations[name] == 'undefined') || actualRefresh) {
                    var self = this;
                    var params = mergeParams(actualCond, caller._scope);
                    return targetClass.all(params, function(err, data) {
                        if (!err && saveOnCache) {
                            if (!self.__cachedRelations) {
                                self.__cachedRelations = {};
                            }
                            self.__cachedRelations[name] = data;
                        }
                        cb(err, data);
                    });
                } else {
                    cb(null, this.__cachedRelations[name]);
                }
            };
            f._scope = typeof params === 'function' ? params.call(this) : params;
            f.build = build;
            f.create = create;
            f.destroyAll = destroyAll;
            for (var i in methods) {
                f[i] = methods[i].bind(this);
            }

            // define sub-scopes
            Object.keys(targetClass._scopeMeta).forEach(function (name) {
                Object.defineProperty(f, name, {
                    enumerable: false,
                    get: function () {
                        mergeParams(f._scope, targetClass._scopeMeta[name]);
                        return f;
                    }
                });
            }.bind(this));
            return f;
        }
    });

    // and it should have create/build methods with binded thisModelNameId param
    function build(data) {
        return new targetClass(mergeParams(this._scope, {where:data || {}}).where);
    }

    function create(data, cb) {
        if (typeof data === 'function') {
            cb = data;
            data = {};
        }
        this.build(data).save(cb);
    }

    /*
        Callback
        - The callback will be called after all elements are destroyed
        - For every destroy call which results in an error
        - If fetching the Elements on which destroyAll is called results in an error
    */
    function destroyAll(cb) {
        targetClass.all(this._scope, function (err, data) {
            if (err) {
                cb(err);
            } else {
                (function loopOfDestruction (data) {
                    if(data.length > 0) {
                        data.shift().destroy(function(err) {
                            if(err && cb) cb(err);
                            loopOfDestruction(data);
                        });
                    } else {
                        if(cb) cb();
                    }
                }(data));
            }
        });
    }

    function mergeParams(base, update) {
        if (update.where) {
            base.where = merge(base.where, update.where);
        }
        if (update.include) {
            base.include = update.include;
        }
        if (update.collect) {
            base.collect = update.collect;
        }

        // overwrite order
        if (update.order) {
            base.order = update.order;
        }

        return base;

    }
}

/**
 * Merge `base` and `update` params
 * @param {Object} base - base object (updating this object)
 * @param {Object} update - object with new data to update base
 * @returns {Object} `base`
 */
function merge(base, update) {
    base = base || {};
    if (update) {
        Object.keys(update).forEach(function (key) {
            base[key] = update[key];
        });
    }
    return base;
}


},{"./model.js":53}],57:[function(require,module,exports){
(function (process){
/**
 * Module exports
 */
exports.ValidationError = ValidationError;

/**
 * Validation mixins for model.js
 *
 * Basically validation configurators is just class methods, which adds validations
 * configs to AbstractClass._validations. Each of this validations run when
 * `obj.isValid()` method called.
 *
 * Each configurator can accept n params (n-1 field names and one config). Config
 * is {Object} depends on specific validation, but all of them has one common part:
 * `message` member. It can be just string, when only one situation possible,
 * e.g. `Post.validatesPresenceOf('title', { message: 'can not be blank' });`
 *
 * In more complicated cases it can be {Hash} of messages (for each case):
 * `User.validatesLengthOf('password', { min: 6, max: 20, message: {min: 'too short', max: 'too long'}});`
 */
var Validatable = require('./model.js');

/**
 * Validate presence. This validation fails when validated field is blank.
 * 
 * Default error message "can't be blank"
 *
 * @example presence of title
 * ```
 * Post.validatesPresenceOf('title');
 * ```
 * @example with custom message
 * ```
 * Post.validatesPresenceOf('title', {message: 'Can not be blank'});
 * ```
 *
 * @sync
 *
 * @nocode
 * @see helper/validatePresence
 */
Validatable.validatesPresenceOf = getConfigurator('presence');

/**
 * Validate length. Three kinds of validations: min, max, is.
 *
 * Default error messages:
 *
 * - min: too short
 * - max: too long
 * - is:  length is wrong
 *
 * @example length validations
 * ```
 * User.validatesLengthOf('password', {min: 7});
 * User.validatesLengthOf('email', {max: 100});
 * User.validatesLengthOf('state', {is: 2});
 * User.validatesLengthOf('nick', {min: 3, max: 15});
 * ```
 * @example length validations with custom error messages
 * ```
 * User.validatesLengthOf('password', {min: 7, message: {min: 'too weak'}});
 * User.validatesLengthOf('state', {is: 2, message: {is: 'is not valid state name'}});
 * ```
 *
 * @sync
 * @nocode
 * @see helper/validateLength
 */
Validatable.validatesLengthOf = getConfigurator('length');

/**
 * Validate numericality.
 *
 * @example
 * ```
 * User.validatesNumericalityOf('age', { message: { number: '...' }});
 * User.validatesNumericalityOf('age', {int: true, message: { int: '...' }});
 * ```
 *
 * Default error messages:
 *
 * - number: is not a number
 * - int: is not an integer
 *
 * @sync
 * @nocode
 * @see helper/validateNumericality
 */
Validatable.validatesNumericalityOf = getConfigurator('numericality');

/**
 * Validate inclusion in set
 *
 * @example 
 * ```
 * User.validatesInclusionOf('gender', {in: ['male', 'female']});
 * User.validatesInclusionOf('role', {
 *     in: ['admin', 'moderator', 'user'], message: 'is not allowed'
 * });
 * ```
 *
 * Default error message: is not included in the list
 *
 * @sync
 * @nocode
 * @see helper/validateInclusion
 */
Validatable.validatesInclusionOf = getConfigurator('inclusion');

/**
 * Validate exclusion
 *
 * @example `Company.validatesExclusionOf('domain', {in: ['www', 'admin']});`
 *
 * Default error message: is reserved
 *
 * @nocode
 * @see helper/validateExclusion
 */
Validatable.validatesExclusionOf = getConfigurator('exclusion');

/**
 * Validate format
 *
 * Default error message: is invalid
 *
 * @nocode
 * @see helper/validateFormat
 */
Validatable.validatesFormatOf = getConfigurator('format');

/**
 * Validate using custom validator
 *
 * Default error message: is invalid
 *
 * Example:
 *
 *     User.validate('name', customValidator, {message: 'Bad name'});
 *     function customValidator(err) {
 *         if (this.name === 'bad') err();
 *     });
 *     var user = new User({name: 'Peter'});
 *     user.isValid(); // true
 *     user.name = 'bad';
 *     user.isValid(); // false
 *
 * @nocode
 * @see helper/validateCustom
 */
Validatable.validate = getConfigurator('custom');

/**
 * Validate using custom async validator
 *
 * Default error message: is invalid
 *
 * Example:
 *
 *     User.validateAsync('name', customValidator, {message: 'Bad name'});
 *     function customValidator(err, done) {
 *         process.nextTick(function () {
 *             if (this.name === 'bad') err();
 *             done();
 *         });
 *     });
 *     var user = new User({name: 'Peter'});
 *     user.isValid(); // false (because async validation setup)
 *     user.isValid(function (isValid) {
 *         isValid; // true
 *     })
 *     user.name = 'bad';
 *     user.isValid(); // false
 *     user.isValid(function (isValid) {
 *         isValid; // false
 *     })
 *
 * @async
 * @nocode
 * @see helper/validateCustom
 */
Validatable.validateAsync = getConfigurator('custom', {async: true});

/**
 * Validate uniqueness
 *
 * Default error message: is not unique
 *
 * @async
 * @nocode
 * @see helper/validateUniqueness
 */
Validatable.validatesUniquenessOf = getConfigurator('uniqueness', {async: true});

// implementation of validators

/**
 * Presence validator
 */
function validatePresence(attr, conf, err) {
    if (blank(this[attr])) {
        err();
    }
}

/**
 * Length validator
 */
function validateLength(attr, conf, err) {
    if (nullCheck.call(this, attr, conf, err)) return;

    var len = this[attr].length;
    if (conf.min && len < conf.min) {
        err('min');
    }
    if (conf.max && len > conf.max) {
        err('max');
    }
    if (conf.is && len !== conf.is) {
        err('is');
    }
}

/**
 * Numericality validator
 */
function validateNumericality(attr, conf, err) {
    if (nullCheck.call(this, attr, conf, err)) return;

    if (typeof this[attr] !== 'number') {
        return err('number');
    }
    if (conf.int && this[attr] !== Math.round(this[attr])) {
        return err('int');
    }
}

/**
 * Inclusion validator
 */
function validateInclusion(attr, conf, err) {
    if (nullCheck.call(this, attr, conf, err)) return;

    if (!~conf.in.indexOf(this[attr])) {
        err()
    }
}

/**
 * Exclusion validator
 */
function validateExclusion(attr, conf, err) {
    if (nullCheck.call(this, attr, conf, err)) return;

    if (~conf.in.indexOf(this[attr])) {
        err()
    }
}

/**
 * Format validator
 */
function validateFormat(attr, conf, err) {
    if (nullCheck.call(this, attr, conf, err)) return;

    if (typeof this[attr] === 'string') {
        if (!this[attr].match(conf['with'])) {
            err();
        }
    } else {
        err();
    }
}

/**
 * Custom validator
 */
function validateCustom(attr, conf, err, done) {
    conf.customValidator.call(this, err, done);
}

/**
 * Uniqueness validator
 */
function validateUniqueness(attr, conf, err, done) {
    if (nullCheck.call(this, attr, conf, err)) {
        return done();
    }

    var cond = {where: {}};
    cond.where[attr] = this[attr];
    this.constructor.all(cond, function (error, found) {
        if (error) {
            return err();
        }
        if (found.length > 1) {
            err();
        } else if (found.length === 1 && (!this.id || !found[0].id || found[0].id.toString() != this.id.toString())) {
            err();
        }
        done();
    }.bind(this));
}

var validators = {
    presence:     validatePresence,
    length:       validateLength,
    numericality: validateNumericality,
    inclusion:    validateInclusion,
    exclusion:    validateExclusion,
    format:       validateFormat,
    custom:       validateCustom,
    uniqueness:   validateUniqueness
};

function getConfigurator(name, opts) {
    return function () {
        configure(this, name, arguments, opts);
    };
}

/**
 * This method performs validation, triggers validation hooks.
 * Before validation `obj.errors` collection cleaned.
 * Each validation can add errors to `obj.errors` collection.
 * If collection is not blank, validation failed.
 *
 * @warning This method can be called as sync only when no async validation
 * configured. It's strongly recommended to run all validations as asyncronous.
 *
 * @param {Function} callback called with (valid)
 * @return {Boolean} true if no async validation configured and all passed
 *
 * @example ExpressJS controller: render user if valid, show flash otherwise
 * ```
 * user.isValid(function (valid) {
 *     if (valid) res.render({user: user});
 *     else res.flash('error', 'User is not valid'), console.log(user.errors), res.redirect('/users');
 * });
 * ```
 */
Validatable.prototype.isValid = function (callback, data) {
    var valid = true, inst = this, wait = 0, async = false;

    // exit with success when no errors
    if (!this.constructor._validations) {
        cleanErrors(this);
        if (callback) {
            this.trigger('validate', function (validationsDone) {
                validationsDone.call(inst, function() {
                    callback(valid);
                });
            });
        }
        return valid;
    }

    Object.defineProperty(this, 'errors', {
        enumerable: false,
        configurable: true,
        value: new Errors
    });

    this.trigger('validate', function (validationsDone) {
        var inst = this,
            asyncFail = false;

        this.constructor._validations.forEach(function (v) {
            if (v[2] && v[2].async) {
                async = true;
                wait += 1;
                process.nextTick(function () {
                    validationFailed(inst, v, done);
                });
            } else {
                if (validationFailed(inst, v)) {
                    valid = false;
                }
            }

        });

        if (!async) {
            validationsDone.call(inst, function() {
                if (valid) cleanErrors(inst);
                if (callback) {
                    callback(valid);
                }
            });
        }

        function done(fail) {
            asyncFail = asyncFail || fail;
            if (--wait === 0) {
                validationsDone.call(inst, function () {
                    if (valid && !asyncFail) cleanErrors(inst);
                    if (callback) {
                        callback(valid && !asyncFail);
                    }
                });
            }
        }

    }, data);

    if (async) {
        // in case of async validation we should return undefined here,
        // because not all validations are finished yet
        return;
    } else {
        return valid;
    }

};

function cleanErrors(inst) {
    Object.defineProperty(inst, 'errors', {
        enumerable: false,
        configurable: true,
        value: false
    });
}

function validationFailed(inst, v, cb) {
    var attr = v[0];
    var conf = v[1];
    var opts = v[2] || {};

    if (typeof attr !== 'string') return false;

    // here we should check skip validation conditions (if, unless)
    // that can be specified in conf
    if (skipValidation(inst, conf, 'if')) return false;
    if (skipValidation(inst, conf, 'unless')) return false;

    var fail = false;
    var validator = validators[conf.validation];
    var validatorArguments = [];
    validatorArguments.push(attr);
    validatorArguments.push(conf);
    validatorArguments.push(function onerror(kind) {
        var message, code = conf.validation;
        if (conf.message) {
            message = conf.message;
        }
        if (!message && defaultMessages[conf.validation]) {
            message = defaultMessages[conf.validation];
        }
        if (!message) {
            message = 'is invalid';
        }
        if (kind) {
            code += '.' + kind;
            if (message[kind]) {
                // get deeper
                message = message[kind];
            } else if (defaultMessages.common[kind]) {
                message = defaultMessages.common[kind];
            } else {
                message = 'is invalid';
            }
        }
        inst.errors.add(attr, message, code);
        fail = true;
    });
    if (cb) {
        validatorArguments.push(function () {
            cb(fail);
        });
    }
    validator.apply(inst, validatorArguments);
    return fail;
}

function skipValidation(inst, conf, kind) {
    var doValidate = true;
    if (typeof conf[kind] === 'function') {
        doValidate = conf[kind].call(inst);
        if (kind === 'unless') doValidate = !doValidate;
    } else if (typeof conf[kind] === 'string') {
        if (typeof inst[conf[kind]] === 'function') {
            doValidate = inst[conf[kind]].call(inst);
            if (kind === 'unless') doValidate = !doValidate;
        } else if (inst.__data.hasOwnProperty(conf[kind])) {
            doValidate = inst[conf[kind]];
            if (kind === 'unless') doValidate = !doValidate;
        } else {
            doValidate = kind === 'if';
        }
    }
    return !doValidate;
}

var defaultMessages = {
    presence: 'can\'t be blank',
    length: {
        min: 'too short',
        max: 'too long',
        is: 'length is wrong'
    },
    common: {
        blank: 'is blank',
        'null': 'is null'
    },
    numericality: {
        'int': 'is not an integer',
        'number': 'is not a number'
    },
    inclusion: 'is not included in the list',
    exclusion: 'is reserved',
    uniqueness: 'is not unique'
};

function nullCheck(attr, conf, err) {
    var isNull = this[attr] === null || !(attr in this);
    if (isNull) {
        if (!conf.allowNull) {
            err('null');
        }
        return true;
    } else {
        if (blank(this[attr])) {
            if (!conf.allowBlank) {
                err('blank');
            }
            return true;
        }
    }
    return false;
}

/**
 * Return true when v is undefined, blank array, null or empty string
 * otherwise returns false
 *
 * @param {Mix} v
 * @returns {Boolean} whether `v` blank or not
 */
function blank(v) {
    if (typeof v === 'undefined') return true;
    if (v instanceof Array && v.length === 0) return true;
    if (v === null) return true;
    if (typeof v == 'string' && v === '') return true;
    return false;
}

function configure(cls, validation, args, opts) {
    if (!cls._validations) {
        Object.defineProperty(cls, '_validations', {
            writable: true,
            configurable: true,
            enumerable: false,
            value: []
        });
    }
    args = [].slice.call(args);
    var conf;
    if (typeof args[args.length - 1] === 'object') {
        conf = args.pop();
    } else {
        conf = {};
    }
    if (validation === 'custom' && typeof args[args.length - 1] === 'function') {
        conf.customValidator = args.pop();
    }
    conf.validation = validation;
    args.forEach(function (attr) {
        cls._validations.push([attr, conf, opts]);
    });
}

function Errors() {
    Object.defineProperty(this, 'codes', {
        enumerable: false,
        configurable: true,
        value: {}
    });
}

Errors.prototype.add = function (field, message, code) {
    code = code || 'invalid';
    if (!this[field]) {
        this[field] = [];
        this.codes[field] = [];
    }
    this[field].push(message);
    this.codes[field].push(code);
};

function ErrorCodes(messages) {
    var c = this;
    Object.keys(messages).forEach(function(field) {
        c[field] = messages[field].codes;
    });
}

function ValidationError(obj) {
    if (!(this instanceof ValidationError)) return new ValidationError(obj);

    this.name = 'ValidationError';
    this.message = 'Validation error';
    this.statusCode = 400;
    this.codes = obj.errors && obj.errors.codes;
    this.context = obj && obj.constructor && obj.constructor.modelName;

    Error.call(this);
};

ValidationError.prototype.__proto__ = Error.prototype;

}).call(this,require('_process'))
},{"./model.js":53,"_process":66}],58:[function(require,module,exports){
/*!
 * inflection
 * Copyright(c) 2011 Ben Lin <ben@dreamerslab.com>
 * MIT Licensed
 *
 * @fileoverview
 * A port of inflection-js to node.js module.
 */

( function ( root ){

  /**
   * @description This is a list of nouns that use the same form for both singular and plural.
   *              This list should remain entirely in lower case to correctly match Strings.
   * @private
   */
  var uncountable_words = [
    'equipment', 'information', 'rice', 'money', 'species',
    'series', 'fish', 'sheep', 'moose', 'deer', 'news'
  ];

  /**
   * @description These rules translate from the singular form of a noun to its plural form.
   * @private
   */
  var plural_rules = [

    // do not replace if its already a plural word
    [ new RegExp( '(m)en$',      'gi' )],
    [ new RegExp( '(pe)ople$',   'gi' )],
    [ new RegExp( '(child)ren$', 'gi' )],
    [ new RegExp( '([ti])a$',    'gi' )],
    [ new RegExp( '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi' )],
    [ new RegExp( '(hive)s$',           'gi' )],
    [ new RegExp( '(tive)s$',           'gi' )],
    [ new RegExp( '(curve)s$',          'gi' )],
    [ new RegExp( '([lr])ves$',         'gi' )],
    [ new RegExp( '([^fo])ves$',        'gi' )],
    [ new RegExp( '([^aeiouy]|qu)ies$', 'gi' )],
    [ new RegExp( '(s)eries$',          'gi' )],
    [ new RegExp( '(m)ovies$',          'gi' )],
    [ new RegExp( '(x|ch|ss|sh)es$',    'gi' )],
    [ new RegExp( '([m|l])ice$',        'gi' )],
    [ new RegExp( '(bus)es$',           'gi' )],
    [ new RegExp( '(o)es$',             'gi' )],
    [ new RegExp( '(shoe)s$',           'gi' )],
    [ new RegExp( '(cris|ax|test)es$',  'gi' )],
    [ new RegExp( '(octop|vir)i$',      'gi' )],
    [ new RegExp( '(alias|status)es$',  'gi' )],
    [ new RegExp( '^(ox)en',            'gi' )],
    [ new RegExp( '(vert|ind)ices$',    'gi' )],
    [ new RegExp( '(matr)ices$',        'gi' )],
    [ new RegExp( '(quiz)zes$',         'gi' )],

    // original rule
    [ new RegExp( '(m)an$', 'gi' ),                 '$1en' ],
    [ new RegExp( '(pe)rson$', 'gi' ),              '$1ople' ],
    [ new RegExp( '(child)$', 'gi' ),               '$1ren' ],
    [ new RegExp( '^(ox)$', 'gi' ),                 '$1en' ],
    [ new RegExp( '(ax|test)is$', 'gi' ),           '$1es' ],
    [ new RegExp( '(octop|vir)us$', 'gi' ),         '$1i' ],
    [ new RegExp( '(alias|status)$', 'gi' ),        '$1es' ],
    [ new RegExp( '(bu)s$', 'gi' ),                 '$1ses' ],
    [ new RegExp( '(buffal|tomat|potat)o$', 'gi' ), '$1oes' ],
    [ new RegExp( '([ti])um$', 'gi' ),              '$1a' ],
    [ new RegExp( 'sis$', 'gi' ),                   'ses' ],
    [ new RegExp( '(?:([^f])fe|([lr])f)$', 'gi' ),  '$1$2ves' ],
    [ new RegExp( '(hive)$', 'gi' ),                '$1s' ],
    [ new RegExp( '([^aeiouy]|qu)y$', 'gi' ),       '$1ies' ],
    [ new RegExp( '(x|ch|ss|sh)$', 'gi' ),          '$1es' ],
    [ new RegExp( '(matr|vert|ind)ix|ex$', 'gi' ),  '$1ices' ],
    [ new RegExp( '([m|l])ouse$', 'gi' ),           '$1ice' ],
    [ new RegExp( '(quiz)$', 'gi' ),                '$1zes' ],

    [ new RegExp( 's$', 'gi' ), 's' ],
    [ new RegExp( '$', 'gi' ),  's' ]
  ];

  /**
   * @description These rules translate from the plural form of a noun to its singular form.
   * @private
   */
  var singular_rules = [

    // do not replace if its already a singular word
    [ new RegExp( '(m)an$',                 'gi' )],
    [ new RegExp( '(pe)rson$',              'gi' )],
    [ new RegExp( '(child)$',               'gi' )],
    [ new RegExp( '^(ox)$',                 'gi' )],
    [ new RegExp( '(ax|test)is$',           'gi' )],
    [ new RegExp( '(octop|vir)us$',         'gi' )],
    [ new RegExp( '(alias|status)$',        'gi' )],
    [ new RegExp( '(bu)s$',                 'gi' )],
    [ new RegExp( '(buffal|tomat|potat)o$', 'gi' )],
    [ new RegExp( '([ti])um$',              'gi' )],
    [ new RegExp( 'sis$',                   'gi' )],
    [ new RegExp( '(?:([^f])fe|([lr])f)$',  'gi' )],
    [ new RegExp( '(hive)$',                'gi' )],
    [ new RegExp( '([^aeiouy]|qu)y$',       'gi' )],
    [ new RegExp( '(x|ch|ss|sh)$',          'gi' )],
    [ new RegExp( '(matr|vert|ind)ix|ex$',  'gi' )],
    [ new RegExp( '([m|l])ouse$',           'gi' )],
    [ new RegExp( '(quiz)$',                'gi' )],

    // original rule
    [ new RegExp( '(m)en$', 'gi' ),                                                       '$1an' ],
    [ new RegExp( '(pe)ople$', 'gi' ),                                                    '$1rson' ],
    [ new RegExp( '(child)ren$', 'gi' ),                                                  '$1' ],
    [ new RegExp( '([ti])a$', 'gi' ),                                                     '$1um' ],
    [ new RegExp( '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi' ), '$1$2sis' ],
    [ new RegExp( '(hive)s$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(tive)s$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(curve)s$', 'gi' ),                                                    '$1' ],
    [ new RegExp( '([lr])ves$', 'gi' ),                                                   '$1f' ],
    [ new RegExp( '([^fo])ves$', 'gi' ),                                                  '$1fe' ],
    [ new RegExp( '([^aeiouy]|qu)ies$', 'gi' ),                                           '$1y' ],
    [ new RegExp( '(s)eries$', 'gi' ),                                                    '$1eries' ],
    [ new RegExp( '(m)ovies$', 'gi' ),                                                    '$1ovie' ],
    [ new RegExp( '(x|ch|ss|sh)es$', 'gi' ),                                              '$1' ],
    [ new RegExp( '([m|l])ice$', 'gi' ),                                                  '$1ouse' ],
    [ new RegExp( '(bus)es$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(o)es$', 'gi' ),                                                       '$1' ],
    [ new RegExp( '(shoe)s$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(cris|ax|test)es$', 'gi' ),                                            '$1is' ],
    [ new RegExp( '(octop|vir)i$', 'gi' ),                                                '$1us' ],
    [ new RegExp( '(alias|status)es$', 'gi' ),                                            '$1' ],
    [ new RegExp( '^(ox)en', 'gi' ),                                                      '$1' ],
    [ new RegExp( '(vert|ind)ices$', 'gi' ),                                              '$1ex' ],
    [ new RegExp( '(matr)ices$', 'gi' ),                                                  '$1ix' ],
    [ new RegExp( '(quiz)zes$', 'gi' ),                                                   '$1' ],
    [ new RegExp( 'ss$', 'gi' ),                                                          'ss' ],
    [ new RegExp( 's$', 'gi' ),                                                           '' ]
  ];

  /**
   * @description This is a list of words that should not be capitalized for title case.
   * @private
   */
  var non_titlecased_words = [
    'and', 'or', 'nor', 'a', 'an', 'the', 'so', 'but', 'to', 'of', 'at','by',
    'from', 'into', 'on', 'onto', 'off', 'out', 'in', 'over', 'with', 'for'
  ];

  /**
   * @description These are regular expressions used for converting between String formats.
   * @private
   */
  var id_suffix         = new RegExp( '(_ids|_id)$', 'g' );
  var underbar          = new RegExp( '_', 'g' );
  var space_or_underbar = new RegExp( '[\ _]', 'g' );
  var uppercase         = new RegExp( '([A-Z])', 'g' );
  var underbar_prefix   = new RegExp( '^_' );

  var inflector = {

  /**
   * A helper method that applies rules based replacement to a String.
   * @private
   * @function
   * @param {String} str String to modify and return based on the passed rules.
   * @param {Array: [RegExp, String]} rules Regexp to match paired with String to use for replacement
   * @param {Array: [String]} skip Strings to skip if they match
   * @param {String} override String to return as though this method succeeded (used to conform to APIs)
   * @returns {String} Return passed String modified by passed rules.
   * @example
   *
   *     this._apply_rules( 'cows', singular_rules ); // === 'cow'
   */
    _apply_rules : function( str, rules, skip, override ){
      if( override ){
        str = override;
      }else{
        var ignore = ( inflector.indexOf( skip, str.toLowerCase()) > -1 );

        if( !ignore ){
          var i = 0;
          var j = rules.length;

          for( ; i < j; i++ ){
            if( str.match( rules[ i ][ 0 ])){
              if( rules[ i ][ 1 ] !== undefined ){
                str = str.replace( rules[ i ][ 0 ], rules[ i ][ 1 ]);
              }
              break;
            }
          }
        }
      }

      return str;
    },



  /**
   * This lets us detect if an Array contains a given element.
   * @public
   * @function
   * @param {Array} arr The subject array.
   * @param {Object} item Object to locate in the Array.
   * @param {Number} fromIndex Starts checking from this position in the Array.(optional)
   * @param {Function} compareFunc Function used to compare Array item vs passed item.(optional)
   * @returns {Number} Return index position in the Array of the passed item.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.indexOf([ 'hi','there' ], 'guys' ); // === -1
   *     inflection.indexOf([ 'hi','there' ], 'hi' ); // === 0
   */
    indexOf : function( arr, item, fromIndex, compareFunc ){
      if( !fromIndex ){
        fromIndex = -1;
      }

      var index = -1;
      var i     = fromIndex;
      var j     = arr.length;

      for( ; i < j; i++ ){
        if( arr[ i ]  === item || compareFunc && compareFunc( arr[ i ], item )){
          index = i;
          break;
        }
      }

      return index;
    },



  /**
   * This function adds pluralization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {String} plural Overrides normal output with said String.(optional)
   * @returns {String} Singular English language nouns are returned in plural form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.pluralize( 'person' ); // === 'people'
   *     inflection.pluralize( 'octopus' ); // === "octopi"
   *     inflection.pluralize( 'Hat' ); // === 'Hats'
   *     inflection.pluralize( 'person', 'guys' ); // === 'guys'
   */
    pluralize : function ( str, plural ){
      return inflector._apply_rules( str, plural_rules, uncountable_words, plural );
    },



  /**
   * This function adds singularization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {String} singular Overrides normal output with said String.(optional)
   * @returns {String} Plural English language nouns are returned in singular form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.singularize( 'people' ); // === 'person'
   *     inflection.singularize( 'octopi' ); // === "octopus"
   *     inflection.singularize( 'Hats' ); // === 'Hat'
   *     inflection.singularize( 'guys', 'person' ); // === 'person'
   */
    singularize : function ( str, singular ){
      return inflector._apply_rules( str, singular_rules, uncountable_words, singular );
    },



  /**
   * This function adds camelization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} lowFirstLetter Default is to capitalize the first letter of the results.(optional)
   *                                 Passing true will lowercase it.
   * @returns {String} Lower case underscored words will be returned in camel case.
   *                  additionally '/' is translated to '::'
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.camelize( 'message_properties' ); // === 'MessageProperties'
   *     inflection.camelize( 'message_properties', true ); // === 'messageProperties'
   */
    camelize : function ( str, lowFirstLetter ){
      var str_path = str.toLowerCase().split( '/' );
      var i        = 0;
      var j        = str_path.length;

      for( ; i < j; i++ ){
        var str_arr = str_path[ i ].split( '_' );
        var initX   = (( lowFirstLetter && i + 1 === j ) ? ( 1 ) : ( 0 ));
        var k       = initX;
        var l       = str_arr.length;

        for( ; k < l; k++ ){
          str_arr[ k ] = str_arr[ k ].charAt( 0 ).toUpperCase() + str_arr[ k ].substring( 1 );
        }

        str_path[ i ] = str_arr.join( '' );
      }

      return str_path.join( '::' );
    },



  /**
   * This function adds underscore support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} allUpperCase Default is to lowercase and add underscore prefix.(optional)
   *                  Passing true will return as entered.
   * @returns {String} Camel cased words are returned as lower cased and underscored.
   *                  additionally '::' is translated to '/'.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.underscore( 'MessageProperties' ); // === 'message_properties'
   *     inflection.underscore( 'messageProperties' ); // === 'message_properties'
   *     inflection.underscore( 'MP', true ); // === 'MP'
   */
    underscore : function ( str, allUpperCase ){
      if( allUpperCase && str === str.toUpperCase()) return str;

      var str_path = str.split( '::' );
      var i        = 0;
      var j        = str_path.length;

      for( ; i < j; i++ ){
        str_path[ i ] = str_path[ i ].replace( uppercase, '_$1' );
        str_path[ i ] = str_path[ i ].replace( underbar_prefix, '' );
      }

      return str_path.join( '/' ).toLowerCase();
    },



  /**
   * This function adds humanize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} lowFirstLetter Default is to capitalize the first letter of the results.(optional)
   *                                 Passing true will lowercase it.
   * @returns {String} Lower case underscored words will be returned in humanized form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.humanize( 'message_properties' ); // === 'Message properties'
   *     inflection.humanize( 'message_properties', true ); // === 'message properties'
   */
    humanize : function( str, lowFirstLetter ){
      str = str.toLowerCase();
      str = str.replace( id_suffix, '' );
      str = str.replace( underbar, ' ' );

      if( !lowFirstLetter ){
        str = inflector.capitalize( str );
      }

      return str;
    },



  /**
   * This function adds capitalization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} All characters will be lower case and the first will be upper.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.capitalize( 'message_properties' ); // === 'Message_properties'
   *     inflection.capitalize( 'message properties', true ); // === 'Message properties'
   */
    capitalize : function ( str ){
      str = str.toLowerCase();

      return str.substring( 0, 1 ).toUpperCase() + str.substring( 1 );
    },



  /**
   * This function adds dasherization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Replaces all spaces or underbars with dashes.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.dasherize( 'message_properties' ); // === 'message-properties'
   *     inflection.dasherize( 'Message Properties' ); // === 'Message-Properties'
   */
    dasherize : function ( str ){
      return str.replace( space_or_underbar, '-' );
    },



  /**
   * This function adds titleize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Capitalizes words as you would for a book title.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.titleize( 'message_properties' ); // === 'Message Properties'
   *     inflection.titleize( 'message properties to keep' ); // === 'Message Properties to Keep'
   */
    titleize : function ( str ){
      str         = str.toLowerCase().replace( underbar, ' ');
      var str_arr = str.split(' ');
      var i       = 0;
      var j       = str_arr.length;

      for( ; i < j; i++ ){
        var d = str_arr[ i ].split( '-' );
        var k = 0;
        var l = d.length;

        for( ; k < l; k++){
          if( inflector.indexOf( non_titlecased_words, d[ k ].toLowerCase()) < 0 ){
            d[ k ] = inflector.capitalize( d[ k ]);
          }
        }

        str_arr[ i ] = d.join( '-' );
      }

      str = str_arr.join( ' ' );
      str = str.substring( 0, 1 ).toUpperCase() + str.substring( 1 );

      return str;
    },



  /**
   * This function adds demodulize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Removes module names leaving only class names.(Ruby style)
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.demodulize( 'Message::Bus::Properties' ); // === 'Properties'
   */
    demodulize : function ( str ){
      var str_arr = str.split( '::' );

      return str_arr[ str_arr.length - 1 ];
    },



  /**
   * This function adds tableize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Return camel cased words into their underscored plural form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.tableize( 'MessageBusProperty' ); // === 'message_bus_properties'
   */
    tableize : function ( str ){
      str = inflector.underscore( str );
      str = inflector.pluralize( str );

      return str;
    },



  /**
   * This function adds classification support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Underscored plural nouns become the camel cased singular form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.classify( 'message_bus_properties' ); // === 'MessageBusProperty'
   */
    classify : function ( str ){
      str = inflector.camelize( str );
      str = inflector.singularize( str );

      return str;
    },



  /**
   * This function adds foreign key support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} dropIdUbar Default is to seperate id with an underbar at the end of the class name,
                                 you can pass true to skip it.(optional)
   * @returns {String} Underscored plural nouns become the camel cased singular form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.foreign_key( 'MessageBusProperty' ); // === 'message_bus_property_id'
   *     inflection.foreign_key( 'MessageBusProperty', true ); // === 'message_bus_propertyid'
   */
    foreign_key : function( str, dropIdUbar ){
      str = inflector.demodulize( str );
      str = inflector.underscore( str ) + (( dropIdUbar ) ? ( '' ) : ( '_' )) + 'id';

      return str;
    },



  /**
   * This function adds ordinalize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Return all found numbers their sequence like "22nd".
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.ordinalize( 'the 1 pitch' ); // === 'the 1st pitch'
   */
    ordinalize : function ( str ){
      var str_arr = str.split(' ');
      var i       = 0;
      var j       = str_arr.length;

      for( ; i < j; i++ ){
        var k = parseInt( str_arr[ i ], 10 );

        if( !isNaN( k )){
          var ltd = str_arr[ i ].substring( str_arr[ i ].length - 2 );
          var ld  = str_arr[ i ].substring( str_arr[ i ].length - 1 );
          var suf = 'th';

          if( ltd != '11' && ltd != '12' && ltd != '13' ){
            if( ld === '1' ){
              suf = 'st';
            }else if( ld === '2' ){
              suf = 'nd';
            }else if( ld === '3' ){
              suf = 'rd';
            }
          }

          str_arr[ i ] += suf;
        }
      }

      return str_arr.join( ' ' );
    }
  };

  if( typeof exports === 'undefined' ) return root.inflection = inflector;

/**
 * @public
 */
  inflector.version = "1.2.5";
/**
 * Exports module.
 */
  module.exports = inflector;
})( this );

},{}],59:[function(require,module,exports){
var rpc = {},
    mschema = require("mschema");
var invoke = rpc.invoke = function (data, method, schema, callback) {
  // validate incoming input data based on schema
  var validate = mschema.validate(data, schema.input, { strict: false });
  if (!validate.valid) {
    return callback(new Error('Validation error: ' + JSON.stringify(validate.errors, true, 2)), validate.errors);
  }
  // execute remote method
  method(data, function (err, result) {
    // if the executed method has errored continue with error immediately
    if (err) {
      return callback(err);
    }
    // if no error was detected in executing the method attempt to,
    // validate the method's output result based on schema
    var validate = mschema.validate(result, schema.output, { strict: false });
    if (!validate.valid) {
      callback(validate.errors, result);
    } else {
      callback(null, result);
    }
  });
}

module['exports'] = rpc;
},{"mschema":60}],60:[function(require,module,exports){
var mschema = {};

mschema.types = {
  "string": function (val) {
    return typeof val === "string";
  },
  "number": function (val) {
    return typeof val === "number";
  },
  "boolean": function (val) {
    return typeof val === "boolean";
  },
  "object": function (val) {
    return typeof val === "object";
  },
  "any": function (val) {
    return true;
  }
};

var validate = mschema.validate = function (_data, _schema, options) {

  var result = { valid: true, instance: {} },
      errors = [],
      options = options || {};

  if (typeof options.strict === "undefined") {
    options.strict = true;
  }

  if (typeof _schema !== 'object') {
    _schema = {};
  }

  function _parse (data, schema) {

    // iterate through properties and compare values to types
    for (var propertyName in schema) {

      // extract property type
      var property = schema[propertyName];

      // extract corresponding data value
      var value = data[propertyName];

      function parseConstraint (property, value) {

        if (typeof property === "string" && (property === 'string' || property === 'number' || property === 'object' || property === 'array' || property === 'boolean' || property === 'any')) {
          property = {
            "type": property,
            "required": false
          };
        }

        // if value is undefined and a default value is specified
        if (typeof property.default !== 'undefined' && typeof value === 'undefined') {
          // assign default value
          value = property.default;
          data[propertyName] = value;
        }

        if (options.strict === false) {
          var _value;
          // determine if any incoming data might need to be changed from a string number into a Number type
          if (typeof value === "string" && (property === "number" || property.type === "number")) {
            _value = parseInt(data[propertyName], 10);
            if (_value.toString() !== "NaN") {
              // a non NaN number was parsed, assign it as validation value and to instance value
              value = _value;
              data[propertyName] = value;
            }
          }
        }

        // check if it's value is required but undefined in value
        if (property.required && (value === null || value === undefined || value.length === 0)) {
          errors.push({
            property: propertyName,
            constraint: 'required',
            expected: true,
            actual: false,
            value: value,
            message: 'Required value is missing'
          });
          // if the value is required and missing, don't check for any other constraints
          return;
        }

        if (typeof property === 'object') {
          // determine if we are at the end of the branch ( constraints ), or simply another nested property
          var nested = false;
          for (var p in property) {
            if (typeof property[p] === 'object' && p !== 'enum' && p!== 'regex') { // enum and regex properties are a special case since they accept array / object as values
              nested = true;
            }
          }
          if(!nested) {
            property.required = false;
          }
        }


        // if an undefined value has been sent to a non-required property,
        // ignore the property and continue the validation
        if (value === undefined && property.required === false) {
          return;
        }

        if (typeof property.regex === 'object') {
          var re = property.regex,
              result;

          if (property.required === false && value.length === 0) {
            return;
          }

          result = re.exec(value);
          if (result === null) {
            errors.push({
              property: propertyName,
              constraint: 'regex',
              expected: property.regex,
              actual: value,
              value: value,
              message: 'Regex does not match string'
            });
            return;
          }
        }

        if (propertyName === "properties") {
          if(typeof data === "object") {
            Object.keys(data).forEach(function(key){
              _parse(data[key], property);
            });
            return;
          } else {
            errors.push({
              property: propertyName,
              constraint: 'type',
              expected: "object",
              actual: typeof value,
              value: value,
              message: 'Invalid value for properties'
            });
            return;
          }
          return;
        }

        if (typeof value === "object") {
          _parse(value, property);
          return;
        } else {

          if (nested === true) {

            if (property.required === true && typeof value !== 'object') {
              errors.push({
                property: propertyName,
                constraint: 'type',
                expected: "object",
                actual: typeof value,
                value: value,
                message: 'Invalid value for object type'
              });
            }

            if (property.required !== true && typeof value !== 'object') {

              if (typeof value === 'undefined') {
                value = {};
                data[propertyName] = {};
              } else {
                errors.push({
                  property: propertyName,
                  constraint: 'type',
                  expected: "object",
                  actual: typeof value,
                  value: value,
                  message: 'Invalid value for object type'
                });
              }
            }

            return;
          }

          for (var constraint in property) {
            if (typeof property[constraint] === "object") {
              if (typeof value === 'object') {
                _parse(value, property);
                return;
              } else {
                checkConstraint(propertyName, constraint, property[constraint], value, errors);
              }
            } else {
              checkConstraint(propertyName, constraint, property[constraint], value, errors);
            }
          }
        }

      }

      // TODO: remove this check and instead create object literal to represent array type
      // { type: 'array', required: false }
      // if the property is an array, assume it has a single value of either string or object type
      if (Array.isArray(property) === true) {

        // if the array has more then one element, it is most likely a syntax error in the schema definition from the user
        if (property.length > 1) {
          errors.push({
            property: property,
            constraint: 'type',
            expected: "Single element array",
            actual: value.length + " element array",
            value: value.toString(),
            message: 'Typed arrays can only be of one type'
          });
        }

        // check if the value provided is an array
        if (!Array.isArray(value)) {
          if (typeof value === "undefined") {
            value = [];
          } else {
            // if the value provided is not an array, validation fails
            errors.push({
              property: propertyName,
              constraint: 'type',
              expected: "array",
              actual: typeof value,
              value: value,
              message: 'Value is not an array'
            });
          }
          continue;
        }
        // iterate through every value in the array check and for validity
        if (property.length === 0) {
          continue;
        } else {
          value.forEach(function(item){
            parseConstraint(property[0], item);
          });
        }
      }

      else { // if property is not of type Array
        parseConstraint(property, value);
      }

    }

  }

  // create a clone of the schema so the original schema passed is not modifed by _parse()
  var schemaCopy = {};
  schemaCopy = clone(_schema);

  // if the incoming data is not an object or function, assume its a single value and create a single keyed object to represent it
  if (typeof _data !== "object" && typeof _data !== 'function') {
    _data = {
      key: _data
    };
    schemaCopy = {
      key: schemaCopy
    }
  }
  _parse(_data, schemaCopy);

  // TODO: clone data to fix immutable data issue
  // see: /test/immutable-data.js
  //  var dataCopy = clone(_data);
  // _parse(dataCopy, schemaCopy);

  result.instance = _data;

  if (errors.length > 0) {
    result.valid = false;
  }

  result.errors = errors;
  return result;
};

var checkConstraint = mschema.checkConstraint = function (property, constraint, expected, value, errors) {

  switch (constraint) {

    case 'type':
      if (!mschema.types[expected](value)) {
        errors.push({
          property: property,
          constraint: 'type',
          value: value,
          expected: expected,
          actual: typeof value,
          message: 'Type does not match'
        });
      }
    break;

    case 'minLength':
      if (expected > value.length) {
        errors.push({
          property: property,
          constraint: 'minLength',
          value: value,
          expected: expected,
          actual: value.length,
          message: 'Value was below minLength of property'
        });
      }
    break;

    case 'maxLength':
      if (expected <= value.length) {
        errors.push({
          property: property,
          constraint: 'maxLength',
          value: value,
          expected: expected,
          actual: value.length,
          message: 'Value exceeded maxLength of property'
        });
      }
    break;

    case 'min':
      if (expected > value) {
        errors.push({
          property: property,
          constraint: 'min',
          expected: expected,
          actual: value,
          value: value,
          message: 'Value was below min of property'
        });
      }
    break;

    case 'max':
      if (expected < value) {
        errors.push({
          property: property,
          constraint: 'max',
          expected: expected,
          actual: value,
          value: value,
          message: 'Value execeed max of property'
        });
      }
    break;

    case 'enum':
      if (expected.indexOf(value) === -1) {
        errors.push({
          property: property,
          constraint: 'enum',
          expected: expected,
          actual: value,
          value: value,
          message: 'Value is not part of enum set'
        });
      }
    break;

    default:
      // console.log('missing constraint - ' + constraint);
    break;

  }

};

function clone (obj, copy) {
  if (obj == null || typeof obj != "object") {
    return obj;
  }
  if (obj.constructor != Object && obj.constructor != Array) {
    return obj;
  }
  if (obj.constructor == Date || obj.constructor == RegExp || obj.constructor == Function ||
      obj.constructor == String || obj.constructor == Number || obj.constructor == Boolean) {
    return new obj.constructor(obj);
  }
  copy = copy || new obj.constructor();
  for (var name in obj) {
    copy[name] = typeof copy[name] == "undefined" ? clone(obj[name], null) : copy[name];
  }
  return copy;
}

module['exports'] = mschema;
},{}],61:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || !!this._all;
    }
    else {
      return !!this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if(!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    exports.EventEmitter2 = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();
},{}],62:[function(require,module,exports){

},{}],63:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],64:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],65:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":66}],66:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],67:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],68:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":67,"_process":66,"inherits":64}]},{},[1])(1)
});