module['exports'] = function spawn (app, opts, cb) {
  cb = cb || function (err, res) {
    if (err) {
      console.log('An error has occurred in ' + app)
      console.log('big.spawn about to throw!');
      throw err;
    }
  };
  opts = opts || {};
  var _app = require('../apps/' + app);
  _app(opts, cb);
};