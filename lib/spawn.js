module['exports'] = function spawn (app, opts, cb) {
  cb = cb || function (err, res) { if (err) throw err; };
  opts = opts || {};
  var _app = require('../apps/' + app);
  _app(opts, cb);
};