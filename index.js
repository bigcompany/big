var big = {};
module['exports'] = big;

var resource = big.resource = require('resource');

big.define = resource.define;
big.emit = resource.emit;
big.on = resource.on;
big.onAny = resource.onAny;

big.start = require('./lib/start');
big.spawn = require('./lib/spawn');